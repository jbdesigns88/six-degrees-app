require('dotenv').config({ path: './server/.env' });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Allow all for development
});

const PORT = process.env.PORT || 3001;
const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or API Key is not defined. Please check your .env file.");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());

const challenges = new Map(); // Stores active challenge data
const userSockets = new Map(); // Stores userId -> socketId mapping

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join', async ({ challengeId, userId }) => {
        try {
            let challenge = challenges.get(challengeId);
            if (!challenge) {
                console.warn(`User ${userId} tried to join non-existent challenge ${challengeId}`);
                socket.emit('join:error', { message: 'This challenge does not exist or has already ended.' });
                return;
            }

            socket.join(challengeId);
            socket.userId = userId;
            socket.challengeId = challengeId;
            userSockets.set(userId, socket.id);
            
            challenge.players.set(userId, socket.id);
            console.log(`User ${userId} (${socket.id}) joined challenge ${challengeId}. Players: ${[...challenge.players.keys()]}`);

            if (challenge.players.size === 2 && challenge.state === 'waiting') {
                challenge.state = 'active';
                const [player1Id, player2Id] = [...challenge.players.keys()];

                const [
                    { data: p1Profile, error: p1Error }, 
                    { data: p2Profile, error: p2Error }
                ] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', player1Id).single(),
                    supabase.from('profiles').select('*').eq('id', player2Id).single()
                ]);
                if (p1Error || p2Error) throw new Error('Could not fetch player profiles.');

                io.to(challenge.players.get(player1Id)).emit('game:start', { startId: challenge.startId, targetId: challenge.targetId, opponent: p2Profile });
                io.to(challenge.players.get(player2Id)).emit('game:start', { startId: challenge.startId, targetId: challenge.targetId, opponent: p1Profile });
                
                console.log(`Game started for challenge ${challengeId}`);
            }
        } catch(error) {
            console.error(`Error in 'join' event for user ${userId}:`, error);
        }
    });

    socket.on('game:update', async ({ challengeId, path }) => {
        try {
            const challenge = challenges.get(challengeId);
            if (!challenge) return;

            const lastNode = path[path.length - 1];
            const isWin = lastNode && lastNode.id === challenge.targetId;

            if (!isWin) {
                socket.to(challengeId).emit('game:update', { path });
                return;
            }

            // Game Over: This player has won.
            const winnerId = socket.userId;
            const playerIds = [...challenge.players.keys()];
            const loserId = playerIds.find(id => id !== winnerId);
            
            let ratingChanges = {};

            if (loserId) {
                const [{ data: winnerProfile }, { data: loserProfile }] = await Promise.all([
                    supabase.from('profiles').select('rating').eq('id', winnerId).single(),
                    supabase.from('profiles').select('rating').eq('id', loserId).single()
                ]);

                if (winnerProfile && loserProfile) {
                    const K = 32;
                    const winnerExpected = 1 / (1 + Math.pow(10, (loserProfile.rating - winnerProfile.rating) / 400));
                    const ratingChange = Math.round(K * (1 - winnerExpected));
                    
                    const newWinnerRating = winnerProfile.rating + ratingChange;
                    const newLoserRating = loserProfile.rating - ratingChange;

                    await Promise.all([
                        supabase.from('profiles').update({ rating: newWinnerRating }).eq('id', winnerId),
                        supabase.from('profiles').update({ rating: newLoserRating }).eq('id', loserId)
                    ]);
                    
                    ratingChanges = {
                        [winnerId]: ratingChange,
                        [loserId]: -ratingChange
                    };
                }
            }

            io.to(challengeId).emit('game:over', { winnerId, ratingChanges });
            challenges.delete(challengeId);
            console.log(`Game over for challenge ${challengeId}. Winner: ${winnerId}`);
        } catch (error) {
            console.error(`Error in 'game:update' for challenge ${challengeId}:`, error);
        }
    });

    socket.on('challenge:cancel', ({ challengeId }) => {
        if (challenges.has(challengeId)) {
            challenges.delete(challengeId);
            console.log(`Challenge ${challengeId} cancelled and removed by user.`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        const { challengeId, userId } = socket;
        if (userId) {
            userSockets.delete(userId);
        }
        if (challengeId && challenges.has(challengeId)) {
            const challenge = challenges.get(challengeId);
            challenge.players.delete(userId); // Remove player from challenge
            if (challenge.players.size > 0) {
                 socket.to(challengeId).emit('opponent:left');
            }
            challenges.delete(challengeId);
            console.log(`Challenge ${challengeId} removed due to disconnect.`);
        }
    });
});

const apiRouter = express.Router();

apiRouter.post('/users/login', async (req, res) => {
    const { username } = req.body;
    console.log(`Login attempt for username: "${username}"`);
    if (!username || username.trim().length === 0) {
        return res.status(400).send('Username is required.');
    }
    try {
        let { data: profile, error } = await supabase.from('profiles').select('*').eq('username', username).single();
        if (error && error.code !== 'PGRST116') throw error;
        if (!profile) {
            console.log(`Username "${username}" not found, creating new profile.`);
            const { data: newProfile, error: insertError } = await supabase.from('profiles').insert({ username: username, rating: 1000 }).select().single();
            if (insertError) throw insertError;
            profile = newProfile;
        }
        console.log(`Login success for "${username}"`);
        res.json(profile);
    } catch (error) {
        console.error('Login/Register Error:', error);
        res.status(500).send('An error occurred on the server.');
    }
});

apiRouter.get('/users/leaderboard', async (req, res) => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').order('rating', { ascending: false }).limit(20);
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).send('An error occurred on the server.');
    }
});

apiRouter.post('/challenge/create', (req, res) => {
    const { challengeId, startId, targetId } = req.body;
    if (!challengeId || !startId || !targetId) {
        return res.status(400).send('Challenge ID, startId, and targetId are required.');
    }
    challenges.set(challengeId, { players: new Map(), state: 'waiting', startId, targetId });
    console.log(`Challenge created: ${challengeId} (Start: ${startId}, Target: ${targetId})`);
    res.status(201).send({ message: 'Challenge created' });
});

app.use('/api', apiRouter);

const staticPath = path.resolve(__dirname, '..');
console.log(`Serving static files from: ${staticPath}`);
app.use(express.static(staticPath));

app.get('*', (req, res) => {
    res.sendFile(path.resolve(staticPath, 'index.html'));
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
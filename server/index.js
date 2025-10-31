require('dotenv').config({ path: './server/.env' });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const PORT = process.env.PORT || 3001;
const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or API Key is not defined. Please check your .env file.");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
const apiRouter = express.Router();

apiRouter.post('/users/login', async (req, res) => {
    const { username } = req.body;
    if (!username || username.trim().length === 0) {
        return res.status(400).send('Username is required.');
    }
    try {
        let { data: profile, error } = await supabase.from('profiles').select('*').eq('username', username).single();
        if (error && error.code !== 'PGRST116') throw error; // Ignore "single row not found" error
        if (!profile) {
            const { data: newProfile, error: insertError } = await supabase.from('profiles').insert({ username: username, rating: 1000 }).select().single();
            if (insertError) throw insertError;
            profile = newProfile;
        }
        res.json(profile);
    } catch (error) {
        console.error('Login/Register Error:', error);
        res.status(500).send('An error occurred during login/registration.');
    }
});

apiRouter.get('/users/leaderboard', async (req, res) => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').order('rating', { ascending: false }).limit(20);
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).send('An error occurred while fetching the leaderboard.');
    }
});

app.use('/api', apiRouter);

// Socket.IO Logic
const challenges = new Map();

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    socket.userId = userId;
    console.log(`Client connected: ${socket.id} for user: ${userId}`);

    socket.on('challenge:create', async ({ startId, targetId }, callback) => {
        if (!userId) return callback({ ok: false, message: "User not authenticated." });
        try {
            const { data } = await supabase.from('profiles').select('username').eq('id', userId).single();
            if (!data) throw new Error("User not found");
            const newChallengeId = `${data.username.replace(/\s+/g, '-')}-${Date.now()}`;
            challenges.set(newChallengeId, { players: new Map(), state: 'waiting', startId, targetId });
            console.log(`Challenge created via socket: ${newChallengeId}`);
            callback({ ok: true, challengeId: newChallengeId });
        } catch (error) {
            console.error('Error creating challenge:', error);
            callback({ ok: false, message: error.message });
        }
    });

    socket.on('join', async ({ challengeId, userId }) => {
        let challenge = challenges.get(challengeId);
        if (!challenge) {
            return socket.emit('join:error', { message: 'This challenge does not exist or has already ended.' });
        }
        socket.join(challengeId);
        socket.challengeId = challengeId;
        challenge.players.set(userId, socket.id);
        console.log(`User ${userId} joined challenge ${challengeId}. Players: ${challenge.players.size}`);

        if (challenge.players.size === 2 && challenge.state === 'waiting') {
            challenge.state = 'active';
            const [player1Id, player2Id] = [...challenge.players.keys()];
            const [ { data: p1 }, { data: p2 } ] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', player1Id).single(),
                supabase.from('profiles').select('*').eq('id', player2Id).single()
            ]);
            io.to(challenge.players.get(player1Id)).emit('game:start', { startId: challenge.startId, targetId: challenge.targetId, opponent: p2 });
            io.to(challenge.players.get(player2Id)).emit('game:start', { startId: challenge.startId, targetId: challenge.targetId, opponent: p1 });
            console.log(`Game started for challenge ${challengeId}`);
        }
    });
    
    socket.on('game:update', async ({ path }) => {
        const { challengeId, userId } = socket;
        if (!challengeId || !userId) return;
        const challenge = challenges.get(challengeId);
        if (!challenge) return;
        
        const lastNode = path[path.length - 1];
        const isWin = lastNode && lastNode.id === challenge.targetId;

        if (!isWin) {
            socket.to(challengeId).emit('game:update', { path });
            return;
        }

        const winnerId = userId;
        const loserId = [...challenge.players.keys()].find(id => id !== winnerId);
        let ratingChanges = {};

        if (loserId) {
            const [{ data: winnerP }, { data: loserP }] = await Promise.all([
                supabase.from('profiles').select('rating').eq('id', winnerId).single(),
                supabase.from('profiles').select('rating').eq('id', loserId).single()
            ]);
            if (winnerP && loserP) {
                const K = 32;
                const winnerExpected = 1 / (1 + Math.pow(10, (loserP.rating - winnerP.rating) / 400));
                const ratingChange = Math.round(K * (1 - winnerExpected));
                await Promise.all([
                    supabase.from('profiles').update({ rating: winnerP.rating + ratingChange }).eq('id', winnerId),
                    supabase.from('profiles').update({ rating: loserP.rating - ratingChange }).eq('id', loserId)
                ]);
                ratingChanges = { [winnerId]: ratingChange, [loserId]: -ratingChange };
            }
        }
        io.to(challengeId).emit('game:over', { winnerId, ratingChanges });
        challenges.delete(challengeId);
        console.log(`Game over for challenge ${challengeId}. Winner: ${winnerId}`);
    });

    socket.on('challenge:cancel', () => {
        if (socket.challengeId && challenges.has(socket.challengeId)) {
            challenges.delete(socket.challengeId);
            console.log(`Challenge ${socket.challengeId} cancelled.`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        const { challengeId, userId } = socket;
        if (challengeId && challenges.has(challengeId)) {
            const challenge = challenges.get(challengeId);
            challenge.players.delete(userId);
            if (challenge.players.size > 0) {
                socket.to(challengeId).emit('opponent:left');
            } else {
                challenges.delete(challengeId); // Delete if last player leaves
            }
            console.log(`Player ${userId} disconnected from challenge ${challengeId}.`);
        }
    });
});

// Static File Serving & SPA Fallback
const staticPath = path.join(__dirname, '..');
app.use(express.static(staticPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
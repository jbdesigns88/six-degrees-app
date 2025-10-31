import React, { useState, useEffect, useCallback, useRef } from 'react';
import LoginScreen from './components/LoginScreen';
import StartScreen from './components/StartScreen';
import GameBoard from './components/GameBoard';
import EndScreen from './components/EndScreen';
import Header from './components/Header';
import LeaderboardScreen from './components/LeaderboardScreen';
import ProfileScreen from './components/ProfileScreen';
import SettingsScreen from './components/SettingsScreen';
import HowToPlayScreen from './components/HowToPlayScreen';
import LobbyScreen from './components/LobbyScreen';
import WaitingForOpponentScreen from './components/WaitingForOpponentScreen';
import BottomNavBar from './components/BottomNavBar';
import ConnectionNodeSkeleton from './components/ConnectionNodeSkeleton';
import LinkIcon from './components/icons/LinkIcon';

import * as geminiService from './services/geminiService';
import * as localStorageService from './services/localStorageService';
import * as ratingService from './services/ratingService';
import * as userService from './services/userService';
import * as challengeService from './services/challengeService';
import { socketService } from './services/socketService';

import { Actor, ConnectionNodeData, View, GameMode, CpuDifficulty, LossReason, UserProfile } from './types';

const MAX_PATH_LENGTH = 13; // 6 degrees + start actor
const GAME_TIME_LIMIT = 300; // 5 minutes

const App: React.FC = () => {
    const [view, setView] = useState<View>('login');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [gameMode, setGameMode] = useState<GameMode>('solo');
    const [startActor, setStartActor] = useState<Actor | null>(null);
    const [targetActor, setTargetActor] = useState<Actor | null>(null);
    const [path, setPath] = useState<ConnectionNodeData[]>([]);
    const [cpuPath, setCpuPath] = useState<ConnectionNodeData[]>([]);
    const [choices, setChoices] = useState<ConnectionNodeData[]>([]);
    const [loading, setLoading] = useState({ initial: false, choices: false, solution: false, cpu: false });
    const [elapsedTime, setElapsedTime] = useState(0);
    const [win, setWin] = useState(false);
    const [lossReason, setLossReason] = useState<LossReason | null>(null);
    const [solutionPath, setSolutionPath] = useState<ConnectionNodeData[]>([]);
    const [ratingChange, setRatingChange] = useState<number | undefined>(undefined);
    const [challengeId, setChallengeId] = useState<string | null>(null);
    const [opponent, setOpponent] = useState<UserProfile | null>(null);
    const [opponentPath, setOpponentPath] = useState<ConnectionNodeData[]>([]);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cpuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingChallengeIdRef = useRef<string | null>(null);

    useEffect(() => {
        const path = window.location.pathname;
        const match = path.match(/^\/game\/([a-zA-Z0-9-]+)/);

        if (match && match[1]) {
            pendingChallengeIdRef.current = match[1];
            window.history.replaceState(null, '', '/');
        }
        
        const storedUsername = localStorageService.getUsername();
        if (storedUsername) {
            handleLogin(storedUsername);
        }

        return () => {
            socketService.disconnect();
        }
    }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    const startTimer = useCallback(() => {
        stopTimer();
        setElapsedTime(0);
        timerRef.current = setInterval(() => {
            setElapsedTime(prev => {
                if (prev >= GAME_TIME_LIMIT - 1) {
                    stopTimer();
                    endGame(false, 'time_up');
                    return GAME_TIME_LIMIT;
                }
                return prev + 1;
            });
        }, 1000);
    }, [stopTimer]);

    const handleLogin = useCallback(async (name: string) => {
        try {
            const profile = await userService.loginOrRegister(name);
            setUserProfile(profile);
            localStorageService.setUsername(name);
            setView('start');
            socketService.connect();
            
            if (pendingChallengeIdRef.current && profile) {
                const challengeIdToJoin = pendingChallengeIdRef.current;
                pendingChallengeIdRef.current = null;
                setChallengeId(challengeIdToJoin);
                setView('waiting'); 
                socketService.emit('join', { challengeId: challengeIdToJoin, userId: profile.id });
            }
        } catch (error) {
            console.error("Login failed:", error);
            alert("Could not log in. Please check the server connection and try again.");
        }
    }, []);
    
    const handleLogout = () => {
        localStorageService.clearUsername();
        setUserProfile(null);
        setView('login');
        socketService.disconnect();
    };

    const resetGameState = useCallback(() => {
        setGameMode('solo');
        setStartActor(null);
        setTargetActor(null);
        setPath([]);
        setCpuPath([]);
        setOpponentPath([]);
        setChoices([]);
        setLoading({ initial: false, choices: false, solution: false, cpu: false });
        setWin(false);
        setLossReason(null);
        setSolutionPath([]);
        setElapsedTime(0);
        setRatingChange(undefined);
        setOpponent(null);
        setChallengeId(null);
        stopTimer();
        if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
    }, [stopTimer]);

    const startGame = useCallback(async (
        mode: GameMode,
        difficulty: CpuDifficulty = 'Casual',
        challengeData: { startId: number, targetId: number, isJoining?: boolean } | null = null
    ) => {
        resetGameState();
        setGameMode(mode);
        
        // If creating a new online match, go to 'waiting'. Otherwise, go to 'game'.
        if (mode === 'online' && !challengeData?.isJoining) {
            setView('waiting');
        } else {
            setView('game');
        }
        setLoading(prev => ({ ...prev, initial: true }));

        try {
            let start: Actor, target: Actor;
            if (challengeData) {
                [start, target] = await Promise.all([
                    geminiService.getActorById(challengeData.startId),
                    geminiService.getActorById(challengeData.targetId)
                ]);
            } else {
                ({ start, target } = await geminiService.getInitialActors());
            }

            setStartActor(start);
            setTargetActor(target);
            setPath([start]);
            if (mode === 'cpu') setCpuPath([start]);
            if (mode === 'online') setOpponentPath([start]);
            
            // For any mode except creating a new online game, fetch choices and start the timer immediately.
            if (mode !== 'online' || challengeData?.isJoining) {
                const initialChoices = await geminiService.getChoices(start);
                setChoices(initialChoices);
                startTimer();
            }

            // If we are CREATING a new online game (i.e., not joining one)
            if (mode === 'online' && !challengeData?.isJoining && userProfile) {
                 const newChallengeId = `${userProfile.username.replace(/\s+/g, '-')}-${Date.now()}`;
                 await challengeService.createChallenge(newChallengeId, start.id, target.id);
                 setChallengeId(newChallengeId);
                 socketService.emit('join', { challengeId: newChallengeId, userId: userProfile.id });
                 // The view is already set to 'waiting'
            }

        } catch (error) {
            console.error("Failed to start game:", error);
            alert("Could not start the game. Please try again.");
            setView('start');
        } finally {
            setLoading(prev => ({ ...prev, initial: false }));
        }
    }, [resetGameState, startTimer, userProfile]);
    
    const endGame = useCallback(async (didPlayerWin: boolean, reason: LossReason | null = null) => {
        stopTimer();
        if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
        
        setWin(didPlayerWin);
        setLossReason(reason);
        setView('end');
        
        if (!didPlayerWin && startActor && targetActor) {
            setLoading(prev => ({ ...prev, solution: true }));
            try {
                const solPath = await geminiService.getSolutionPath(startActor, targetActor);
                setSolutionPath(solPath);
            } catch (error) {
                console.error("Failed to get solution path:", error);
            } finally {
                setLoading(prev => ({ ...prev, solution: false }));
            }
        }
    }, [stopTimer, startActor, targetActor]);
    
    const handleSelectChoice = useCallback(async (choice: ConnectionNodeData) => {
        if (loading.choices || !targetActor || !userProfile) return;

        const newPath = [...path, choice];
        setPath(newPath);
        if (gameMode === 'online') {
            socketService.emit('game:update', { challengeId, path: newPath });
        }
        setChoices([]);

        if (gameMode !== 'online') {
            if (choice.id === targetActor.id) {
                endGame(true);
                return;
            }
            if (newPath.length >= MAX_PATH_LENGTH) {
                endGame(false, 'too_many_steps');
                return;
            }
        }
        
        // For online mode, the server will determine the winner. We just keep fetching choices.
        // For solo mode, this code runs after the win/loss checks above.
        setLoading(prev => ({ ...prev, choices: true }));
        try {
            const nextChoices = await geminiService.getChoices(choice);
            setChoices(nextChoices);
        } catch (error) {
            console.error("Failed to get choices:", error);
        } finally {
            setLoading(prev => ({ ...prev, choices: false }));
        }
    }, [path, targetActor, loading.choices, endGame, gameMode, challengeId, userProfile]);

    const handleCreateNewChallenge = useCallback(async () => {
        startGame('online');
    }, [startGame]);

    const handleCancelChallenge = useCallback(() => {
        if (challengeId) {
            socketService.emit('challenge:cancel', { challengeId });
        }
        resetGameState();
        setView('start');
    }, [challengeId, resetGameState]);

    // WebSocket Effects
    useEffect(() => {
        const unsubs: (()=>void)[] = [];
        if(userProfile) {
            unsubs.push(socketService.on('game:start', (payload) => {
                setOpponent(payload.opponent);
                startGame('online', undefined, { startId: payload.startId, targetId: payload.targetId, isJoining: true });
            }));
            unsubs.push(socketService.on('game:update', (payload) => {
                setOpponentPath(payload.path);
            }));
            unsubs.push(socketService.on('game:over', (payload) => {
                const didIWin = payload.winnerId === userProfile.id;
                endGame(didIWin, didIWin ? null : 'opponent_won');
            }));
            unsubs.push(socketService.on('rating:update', (payload) => {
                setRatingChange(payload.change);
                setUserProfile(p => p ? { ...p, rating: payload.newRating } : null);
            }));
            unsubs.push(socketService.on('opponent:left', () => {
                 endGame(true, 'opponent_left');
            }));
            unsubs.push(socketService.on('join:error', (payload) => {
                alert(`Error joining challenge: ${payload.message}`);
                setView('start');
            }));
        }
        return () => unsubs.forEach(u => u());

    }, [userProfile, startGame, endGame]);

     const handleNavigate = (view: View) => setView(view);

    const renderContent = () => {
        switch (view) {
            case 'login': return <LoginScreen onLogin={handleLogin} />;
            case 'start': return <StartScreen onStartGame={(mode, diff) => startGame(mode, diff)} onNavigate={handleNavigate} playerRating={userProfile} />;
            case 'game':
                if (loading.initial || !startActor || !targetActor) {
                    return <div className="flex flex-col items-center justify-center h-full"><div className="flex items-center p-4 snap-x space-x-3"><ConnectionNodeSkeleton isFirst /><LinkIcon /><ConnectionNodeSkeleton isLast /></div><p className="mt-4 text-lg text-gray-400 animate-pulse">Setting the stage...</p></div>;
                }
                return <GameBoard path={path} opponentPath={gameMode === 'cpu' ? cpuPath : opponentPath} target={targetActor} choices={choices} onSelectChoice={handleSelectChoice} loadingChoices={loading.choices} elapsedTime={elapsedTime} maxPathLength={MAX_PATH_LENGTH} gameMode={gameMode} opponent={opponent ?? undefined} />;
            case 'end':
                return <EndScreen win={win} lossReason={lossReason} path={path} cpuPath={gameMode === 'cpu' ? cpuPath : opponentPath} solutionPath={solutionPath} loadingSolution={loading.solution} onPlayAgain={() => { resetGameState(); setView('start');}} onChallenge={handleCreateNewChallenge} onNavigate={handleNavigate} elapsedTime={elapsedTime} target={targetActor!} gameMode={gameMode} ratingChange={ratingChange} />;
            case 'leaderboard': return <LeaderboardScreen onBack={() => setView('start')} />;
            case 'profile':
                if (!userProfile) return null;
                return <ProfileScreen userProfile={userProfile} />;
            case 'settings': return <SettingsScreen onNavigate={handleNavigate} />;
            case 'howToPlay': return <HowToPlayScreen onBack={() => setView('settings')} />;
            case 'lobby':
                 if (!userProfile) return null;
                return <LobbyScreen onChallenge={handleCreateNewChallenge} onBack={() => setView('start')} username={userProfile.username} rating={userProfile.rating} />;
            case 'waiting':
                if (loading.initial) {
                     return <div className="flex flex-col items-center justify-center h-full"><div className="flex items-center p-4 snap-x space-x-3"><ConnectionNodeSkeleton isFirst /><LinkIcon /><ConnectionNodeSkeleton isLast /></div><p className="mt-4 text-lg text-gray-400 animate-pulse">Creating your challenge...</p></div>;
                }
                return <WaitingForOpponentScreen challengeId={challengeId!} onCancel={handleCancelChallenge} />;
            default:
                return <LoginScreen onLogin={handleLogin} />;
        }
    };
    
    const showHeader = view !== 'login';
    const showNav = ['start', 'leaderboard', 'profile', 'settings'].includes(view);

    return (
        <div className="bg-gray-900 text-white font-sans h-screen w-screen flex flex-col overflow-hidden">
            {showHeader && <Header username={userProfile?.username} onLogout={handleLogout} />}
            <main className="flex-grow overflow-y-auto" style={{ paddingBottom: showNav ? '70px' : '0' }}>
                {renderContent()}
            </main>
            {showNav && <BottomNavBar currentView={view} onNavigate={handleNavigate} />}
        </div>
    );
};

export default App;
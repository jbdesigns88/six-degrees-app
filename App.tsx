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
import { socketService, simulateOpponent } from './services/socketService';

import { Actor, ConnectionNodeData, View, GameMode, CpuDifficulty, LossReason, Rating } from './types';

const MAX_PATH_LENGTH = 13; // 6 degrees + start actor
const GAME_TIME_LIMIT = 300; // 5 minutes

const App: React.FC = () => {
    // App State
    const [view, setView] = useState<View>('login');
    const [username, setUsername] = useState<string | null>(null);
    const [playerRating, setPlayerRating] = useState<Rating | null>(null);

    // Game State
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
    
    // Online state
    const [challengeId, setChallengeId] = useState<string | null>(null);
    const [opponent, setOpponent] = useState<{ username: string, rating: number } | null>(null);
    const [opponentPath, setOpponentPath] = useState<ConnectionNodeData[]>([]);


    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cpuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initialization and URL parsing
    useEffect(() => {
        const path = window.location.pathname;
        const match = path.match(/^\/game\/([a-zA-Z0-9-]+)/);

        if (match && match[1]) {
            const incomingChallengeId = match[1];
            localStorage.setItem('pendingChallengeId', incomingChallengeId);
            // Clean the URL to avoid re-triggering on refresh
            window.history.replaceState(null, '', '/');
        }
        
        const storedUsername = localStorageService.getUsername();
        if (storedUsername) {
            handleLogin(storedUsername);
        }
    }, []);

    // Game Timer
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

    const handleLogin = useCallback((name: string) => {
        setUsername(name);
        const userRating = localStorageService.getPlayerRating(name);
        setPlayerRating(userRating);
        setView('start');
        simulateOpponent(name);

        const pendingChallengeId = localStorage.getItem('pendingChallengeId');
        if (pendingChallengeId) {
            localStorage.removeItem('pendingChallengeId');
            acceptChallenge(pendingChallengeId, name, userRating.rating);
        }
    }, []);
    
    const handleLogout = () => {
        localStorageService.clearUsername();
        setUsername(null);
        setPlayerRating(null);
        setView('login');
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
        challengeData: { startId: number, targetId: number } | null = null
    ) => {
        // Reset parts of state but keep actors if from a challenge
        if (mode !== 'online') resetGameState();
        setGameMode(mode);
        setView('game');
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
            
            const initialChoices = await geminiService.getChoices(start);
            setChoices(initialChoices);
            startTimer();
            if (mode === 'cpu') {
                scheduleCpuMove([start], initialChoices, target, difficulty);
            }
        } catch (error) {
            console.error("Failed to start game:", error);
            alert("Could not start the game. Please try again.");
            setView('start');
        } finally {
            setLoading(prev => ({ ...prev, initial: false }));
        }
    }, [resetGameState, startTimer]);
    
    const endGame = useCallback(async (didPlayerWin: boolean, reason: LossReason | null = null) => {
        stopTimer();
        if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
        
        setWin(didPlayerWin);
        setLossReason(reason);
        setView('end');

        if (gameMode !== 'solo' && playerRating) {
            const opponentRating = gameMode === 'cpu'
                ? ratingService.getCpuRating(opponent?.username as CpuDifficulty || 'Casual')
                : opponent?.rating || 1000;
            const change = ratingService.calculateRatingChange(playerRating.rating, opponentRating, didPlayerWin);
            setRatingChange(change);
            const newRating = { ...playerRating, rating: playerRating.rating + change };
            setPlayerRating(newRating);
            localStorageService.setPlayerRating(newRating);
        }

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
    }, [stopTimer, gameMode, startActor, targetActor, playerRating, opponent]);
    
    const handleSelectChoice = useCallback(async (choice: ConnectionNodeData) => {
        if (loading.choices || !targetActor) return;

        const newPath = [...path, choice];
        setPath(newPath);
        if (gameMode === 'online') {
            socketService.emit('game:update', { challengeId, path: newPath });
        }
        setChoices([]);

        if (choice.id === targetActor.id) {
            endGame(true);
            return;
        }

        if (newPath.length >= MAX_PATH_LENGTH) {
            endGame(false, 'too_many_steps');
            return;
        }

        setLoading(prev => ({ ...prev, choices: true }));
        try {
            const nextChoices = await geminiService.getChoices(choice);
            setChoices(nextChoices);
        } catch (error) {
            console.error("Failed to get choices:", error);
            alert("Could not load the next choices. The game may be stuck.");
        } finally {
            setLoading(prev => ({ ...prev, choices: false }));
        }
    }, [path, targetActor, loading.choices, endGame, gameMode, challengeId]);

    const scheduleCpuMove = useCallback((currentCpuPath: ConnectionNodeData[], currentChoices: ConnectionNodeData[], currentTarget: Actor, difficulty: CpuDifficulty) => {
        if (win || lossReason) return;
        const delay = difficulty === 'Casual' ? Math.random() * 8000 + 7000 : Math.random() * 4000 + 3000;
        
        cpuTimerRef.current = setTimeout(async () => {
            setLoading(p => ({...p, cpu: true}));
            const move = await geminiService.getCpuMove(currentCpuPath, currentChoices, currentTarget);
            setLoading(p => ({...p, cpu: false}));
            
            if (move) {
                const newCpuPath = [...currentCpuPath, move];
                setCpuPath(newCpuPath);

                if (move.id === currentTarget.id) {
                    endGame(false, 'cpu_won');
                    return;
                }

                if (newCpuPath.length >= MAX_PATH_LENGTH) {
                    endGame(true);
                    return;
                }

                const nextChoices = await geminiService.getChoices(move);
                scheduleCpuMove(newCpuPath, nextChoices, currentTarget, difficulty);
            }
        }, delay);
    }, [win, lossReason, endGame]);
    
    const handleNavigate = (newView: View) => setView(newView);

    const handleCreateNewChallenge = useCallback(async () => {
        if (!username) return;
        setLoading(prev => ({ ...prev, initial: true }));
        try {
            const { start, target } = await geminiService.getInitialActors();
            setStartActor(start);
            setTargetActor(target);
            const newChallengeId = `${username.replace(/\s+/g, '-')}-${Date.now()}`;
            setChallengeId(newChallengeId);
            socketService.emit('challenge:new', {
                id: newChallengeId, from: username, startId: start.id, targetId: target.id,
            });
            setView('waiting');
        } catch (error) {
            console.error("Failed to create new challenge:", error);
            alert("There was an error creating the challenge. Please try again.");
        } finally {
            setLoading(prev => ({ ...prev, initial: false }));
        }
    }, [username]);
    
    const acceptChallenge = useCallback((challengeId: string, acceptingUsername: string, acceptingUserRating: number) => {
        socketService.emit('challenge:accepted', {
            challengeId, acceptedBy: acceptingUsername, acceptedByRating: acceptingUserRating,
        });
        const unsubscribe = socketService.on('game:start', (gameData: { startId: number, targetId: number, opponent: { username: string, rating: number } }) => {
            setOpponent(gameData.opponent);
            setChallengeId(challengeId);
            startGame('online', undefined, { startId: gameData.startId, targetId: gameData.targetId });
            unsubscribe();
        });
    }, [startGame]);

    useEffect(() => {
        if (view !== 'waiting' || !challengeId || !startActor || !targetActor || !username || !playerRating) return;
        const onChallengeAccepted = (data: { challengeId: string, acceptedBy: string, acceptedByRating: number }) => {
            if (data.challengeId === challengeId) {
                const opponentData = { username: data.acceptedBy, rating: data.acceptedByRating };
                setOpponent(opponentData);
                socketService.emit('game:start', {
                    startId: startActor.id,
                    targetId: targetActor.id,
                    opponent: { username: username, rating: playerRating.rating }
                });
                startGame('online', undefined, { startId: startActor.id, targetId: targetActor.id });
            }
        };
        const unsubscribe = socketService.on('challenge:accepted', onChallengeAccepted);
        return () => unsubscribe();
    }, [view, challengeId, startActor, targetActor, username, playerRating, startGame]);

    useEffect(() => {
        if (gameMode !== 'online' || !challengeId) return;
        const onOpponentMove = (data: { challengeId: string, path: ConnectionNodeData[] }) => {
            if (data.challengeId === challengeId) {
                setOpponentPath(data.path);
                if(data.path[data.path.length-1]?.id === targetActor?.id) {
                     endGame(false, 'opponent_won');
                }
            }
        };
        const unsubscribe = socketService.on('game:update', onOpponentMove);
        return () => unsubscribe();
    }, [gameMode, challengeId, targetActor, endGame]);


    const renderContent = () => {
        switch (view) {
            case 'login': return <LoginScreen onLogin={handleLogin} />;
            case 'start': return <StartScreen onStartGame={(mode, diff) => startGame(mode, diff)} onNavigate={handleNavigate} playerRating={playerRating} />;
            case 'game':
                if (loading.initial || !startActor || !targetActor) {
                    return (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="flex items-center p-4 snap-x space-x-3">
                                <ConnectionNodeSkeleton isFirst />
                                <LinkIcon />
                                <ConnectionNodeSkeleton isLast />
                            </div>
                            <p className="mt-4 text-lg text-gray-400 animate-pulse">Setting the stage...</p>
                        </div>
                    );
                }
                return <GameBoard path={path} opponentPath={gameMode === 'cpu' ? cpuPath : opponentPath} target={targetActor} choices={choices} onSelectChoice={handleSelectChoice} loadingChoices={loading.choices} elapsedTime={elapsedTime} maxPathLength={MAX_PATH_LENGTH} gameMode={gameMode} opponent={opponent ?? undefined} />;
            case 'end':
                return <EndScreen win={win} lossReason={lossReason} path={path} cpuPath={gameMode === 'cpu' ? cpuPath : opponentPath} solutionPath={solutionPath} loadingSolution={loading.solution} onPlayAgain={() => setView('start')} onChallenge={handleCreateNewChallenge} onNavigate={handleNavigate} elapsedTime={elapsedTime} target={targetActor!} gameMode={gameMode} ratingChange={ratingChange} />;
            case 'leaderboard': return <LeaderboardScreen onBack={() => setView('start')} />;
            case 'profile':
                if (!username || !playerRating) return null;
                return <ProfileScreen username={username} rating={playerRating.rating} rank={ratingService.getRank(playerRating.rating)} />;
            case 'settings': return <SettingsScreen onNavigate={handleNavigate} />;
            case 'howToPlay': return <HowToPlayScreen onBack={() => setView('settings')} />;
            case 'lobby':
                 if (!username || !playerRating) return null;
                return <LobbyScreen onChallenge={handleCreateNewChallenge} onBack={() => setView('start')} username={username} rating={playerRating.rating} />;
            case 'waiting':
                return <WaitingForOpponentScreen challengeId={challengeId!} onCancel={() => { setChallengeId(null); setView('start'); }} />;
            default:
                return <LoginScreen onLogin={handleLogin} />;
        }
    };
    
    const showHeader = view !== 'login';
    const showNav = ['start', 'leaderboard', 'profile', 'settings'].includes(view);

    return (
        <div className="bg-gray-900 text-white font-sans h-screen w-screen flex flex-col overflow-hidden">
            {showHeader && <Header username={username} onLogout={handleLogout} />}
            <main className="flex-grow overflow-y-auto" style={{ paddingBottom: showNav ? '70px' : '0' }}>
                {renderContent()}
            </main>
            {showNav && <BottomNavBar currentView={view} onNavigate={handleNavigate} />}
        </div>
    );
};

export default App;

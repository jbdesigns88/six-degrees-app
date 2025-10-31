import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectionNodeData, Actor, LossReason, GameMode, Score } from './types';
import * as geminiService from './services/geminiService';
import * as localStorageService from './services/localStorageService';
import StartScreen from './components/StartScreen';
import GameBoard from './components/GameBoard';
import EndScreen from './components/EndScreen';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import ChallengeModal from './components/ChallengeModal';

type View = 'login' | 'start' | 'playing' | 'win' | 'lose' | 'leaderboard';
const MAX_PATH_LENGTH = 13; // 6 degrees
const ROUND_TIME_SECONDS = 120;

const App: React.FC = () => {
    const [view, setView] = useState<View>('login');
    const [lossReason, setLossReason] = useState<LossReason | null>(null);
    const [gameMode, setGameMode] = useState<GameMode>('cpu');
    const [username, setUsername] = useState<string | null>(null);
    const [showChallengeModal, setShowChallengeModal] = useState(false);
    
    // Player state
    const [path, setPath] = useState<ConnectionNodeData[]>([]);
    const [choices, setChoices] = useState<ConnectionNodeData[]>([]);
    const [loadingChoices, setLoadingChoices] = useState(false);

    // CPU state
    const [cpuPath, setCpuPath] = useState<ConnectionNodeData[]>([]);
    
    // Shared state
    const [startActor, setStartActor] = useState<Actor | null>(null);
    const [targetActor, setTargetActor] = useState<Actor | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    const isGameActiveRef = useRef(false);

    const initializeNewGame = useCallback(async (challenge: {startId: number, targetId: number} | null = null) => {
        setView('login');
        setPath([]);
        setCpuPath([]);
        setChoices([]);
        setElapsedTime(0);
        setLossReason(null);
        isGameActiveRef.current = false;
        
        try {
            let start: Actor, target: Actor;
            if (challenge) {
                [start, target] = await Promise.all([
                    geminiService.getActorById(challenge.startId),
                    geminiService.getActorById(challenge.targetId)
                ]);
            } else {
                ({ start, target } = await geminiService.getInitialActors());
            }
            setStartActor(start);
            setTargetActor(target);
            setPath([start]);
            setCpuPath([start]);

            // Check for existing user session
            const savedUser = localStorageService.getUsername();
            if (savedUser) {
                setUsername(savedUser);
                setView('start');
            }
        } catch (error) {
            console.error("Failed to initialize game:", error);
            // Handle error, maybe show an error screen
        }
    }, []);

     // Check for challenge URL and initialize game on first load
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const startId = urlParams.get('start');
        const targetId = urlParams.get('target');
        
        if (startId && targetId) {
            initializeNewGame({ startId: parseInt(startId), targetId: parseInt(targetId) });
        } else {
            initializeNewGame();
        }
    }, [initializeNewGame]);

    const endGame = useCallback((status: 'win' | 'lose', reason: LossReason | null = null) => {
        if (!isGameActiveRef.current) return;
        
        isGameActiveRef.current = false;
        setView(status);
        setLossReason(reason);

        if (status === 'win' && username) {
            const score: Score = {
                playerName: username,
                degrees: Math.floor((path.length - 1) / 2),
                time: elapsedTime,
                date: new Date().toISOString()
            };
            localStorageService.saveScore(score);
        }
    }, [username, path, elapsedTime]);
    
    // Game Timer
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (view === 'playing') {
            timer = setInterval(() => {
                setElapsedTime(prevTime => {
                    if (prevTime + 1 >= ROUND_TIME_SECONDS) {
                        clearInterval(timer);
                        endGame('lose', 'time_up');
                        return ROUND_TIME_SECONDS;
                    }
                    return prevTime + 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [view, endGame]);

    const fetchChoicesForPlayer = useCallback(async (node: ConnectionNodeData) => {
        setLoadingChoices(true);
        setChoices([]);
        try {
            const newChoices = await geminiService.getChoices(node);
            setChoices(newChoices);
        } catch (error) {
            console.error("Failed to fetch choices:", error);
        } finally {
            setLoadingChoices(false);
        }
    }, []);
    
    const startGame = (mode: GameMode) => {
        if(startActor) {
            setGameMode(mode);
            isGameActiveRef.current = true;
            setView('playing');
            fetchChoicesForPlayer(startActor);
        }
    };

    const handleLogin = (name: string) => {
        localStorageService.setUsername(name);
        setUsername(name);
        setView('start');
    }

    const handleLogout = () => {
        localStorageService.clearUsername();
        setUsername(null);
        setView('login');
    }

    const handleSelectChoice = (choice: ConnectionNodeData) => {
        if (view !== 'playing' || !targetActor) return;

        const newPath = [...path, choice];
        setPath(newPath);

        if (choice.type === 'actor' && choice.id === targetActor.id) {
            endGame('win');
            return;
        }

        if (newPath.length >= MAX_PATH_LENGTH) {
            endGame('lose', 'too_many_steps');
            return;
        }
        
        fetchChoicesForPlayer(choice);
    };
    
    // Independent CPU Logic
    useEffect(() => {
        if (view !== 'playing' || !startActor || !targetActor || gameMode !== 'cpu') {
            return;
        }

        const runCpuLogic = async () => {
            let currentCpuPath: ConnectionNodeData[] = [startActor];

            while (isGameActiveRef.current) {
                const lastNode = currentCpuPath[currentCpuPath.length - 1];
                const cpuChoices = await geminiService.getChoices(lastNode);
                if (!isGameActiveRef.current) break;

                await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
                const cpuMove = await geminiService.getCpuMove(currentCpuPath, cpuChoices, targetActor);
                if (!isGameActiveRef.current || !cpuMove) break;
                
                currentCpuPath = [...currentCpuPath, cpuMove];
                setCpuPath(currentCpuPath);

                if (cpuMove.type === 'actor' && cpuMove.id === targetActor.id) {
                    endGame('lose', 'cpu_won');
                    break;
                }
                if (currentCpuPath.length >= MAX_PATH_LENGTH) break; 
            }
        };
        runCpuLogic();
    }, [view, startActor, targetActor, endGame, gameMode]);
    
    const getChallengeUrl = () => {
        if (!startActor || !targetActor) return '';
        const url = new URL(window.location.href);
        url.search = `?start=${startActor.id}&target=${targetActor.id}`;
        return url.toString();
    }

    const renderContent = () => {
        if (!startActor || !targetActor) {
             return <div className="flex justify-center items-center h-full"><p className="text-white text-xl animate-pulse">Initializing your cinematic challenge...</p></div>;
        }
        
        switch (view) {
            case 'login':
                return <LoginScreen onLogin={handleLogin} />;
            case 'leaderboard':
                return <LeaderboardScreen onBack={() => setView('start')} />;
            case 'start':
                return <StartScreen onStartGame={startGame} start={startActor} target={targetActor} onShowLeaderboard={() => setView('leaderboard')} />;
            case 'playing':
                return (
                    <GameBoard
                        path={path}
                        cpuPath={cpuPath}
                        target={targetActor}
                        choices={choices}
                        onSelectChoice={handleSelectChoice}
                        loadingChoices={loadingChoices}
                        elapsedTime={elapsedTime}
                        maxPathLength={MAX_PATH_LENGTH}
                        gameMode={gameMode}
                    />
                );
            case 'win':
            case 'lose':
                return <EndScreen 
                            win={view === 'win'} 
                            lossReason={lossReason}
                            path={path} 
                            cpuPath={cpuPath}
                            onPlayAgain={() => initializeNewGame()} 
                            onChallenge={() => setShowChallengeModal(true)}
                            elapsedTime={elapsedTime} 
                            target={targetActor} 
                            gameMode={gameMode}
                        />;
            default:
                return null;
        }
    };
    
    return (
        <main className="bg-gray-900 text-white min-h-screen flex flex-col font-sans">
            <Header username={username} onLogout={handleLogout} />
            <div className="flex-grow">
              {renderContent()}
            </div>
             {showChallengeModal && (
                <ChallengeModal
                    challengeUrl={getChallengeUrl()}
                    onClose={() => setShowChallengeModal(false)}
                />
            )}
        </main>
    );
};

export default App;
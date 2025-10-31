import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectionNodeData, Actor, LossReason } from './types';
import * as geminiService from './services/geminiService';
import StartScreen from './components/StartScreen';
import GameBoard from './components/GameBoard';
import EndScreen from './components/EndScreen';
import Header from './components/Header';

type GameStatus = 'loading' | 'start' | 'playing' | 'win' | 'lose';
const MAX_PATH_LENGTH = 13; // 6 degrees
const ROUND_TIME_SECONDS = 120;

const App: React.FC = () => {
    const [gameStatus, setGameStatus] = useState<GameStatus>('loading');
    const [lossReason, setLossReason] = useState<LossReason | null>(null);
    
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

    const endGame = useCallback((status: 'win' | 'lose', reason: LossReason | null = null) => {
        if (!isGameActiveRef.current) return; // Prevent multiple end-game calls
        
        isGameActiveRef.current = false;
        setGameStatus(status);
        setLossReason(reason);
    }, []);

    const resetGame = useCallback(async () => {
        setGameStatus('loading');
        setPath([]);
        setCpuPath([]);
        setChoices([]);
        setElapsedTime(0);
        setLossReason(null);
        isGameActiveRef.current = false;

        try {
            const { start, target } = await geminiService.getInitialActors();
            setStartActor(start);
            setTargetActor(target);
            setPath([start]);
            setCpuPath([start]);
            setGameStatus('start');
        } catch (error) {
            console.error("Failed to initialize game:", error);
        }
    }, []);

    useEffect(() => {
        resetGame();
    }, [resetGame]);
    
    // Game Timer
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (gameStatus === 'playing') {
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
    }, [gameStatus, endGame]);

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
    
    const startGame = () => {
        if(startActor) {
            isGameActiveRef.current = true;
            setGameStatus('playing');
            fetchChoicesForPlayer(startActor);
        }
    };

    const handleSelectChoice = (choice: ConnectionNodeData) => {
        if (gameStatus !== 'playing' || !targetActor) return;

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
        if (gameStatus !== 'playing' || !startActor || !targetActor) {
            return;
        }

        const runCpuLogic = async () => {
            // FIX: Explicitly type `currentCpuPath` as `ConnectionNodeData[]`.
            // TypeScript was incorrectly inferring the type as `Actor[]` from its initial value,
            // which caused an error when a `Movie` node was added to the path.
            let currentCpuPath: ConnectionNodeData[] = [startActor];

            while (isGameActiveRef.current) {
                const lastNode = currentCpuPath[currentCpuPath.length - 1];

                // 1. Get choices for the current node
                const cpuChoices = await geminiService.getChoices(lastNode);
                if (!isGameActiveRef.current) break;

                // 2. Pick the best choice (movie or actor)
                await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500)); // Human-like delay
                const cpuMove = await geminiService.getCpuMove(currentCpuPath, cpuChoices, targetActor);
                 if (!isGameActiveRef.current || !cpuMove) break;
                
                // 3. Update path
                currentCpuPath = [...currentCpuPath, cpuMove];
                setCpuPath(currentCpuPath);

                // 4. Check for win/loss conditions
                if (cpuMove.type === 'actor' && cpuMove.id === targetActor.id) {
                    endGame('lose', 'cpu_won');
                    break;
                }
                if (currentCpuPath.length >= MAX_PATH_LENGTH) {
                    // CPU loses silently, just stops trying
                    break; 
                }
            }
        };

        runCpuLogic();

    }, [gameStatus, startActor, targetActor, endGame]);

    const renderContent = () => {
        if (gameStatus === 'loading' || !startActor || !targetActor) {
            return <div className="flex justify-center items-center h-full"><p className="text-white text-xl animate-pulse">Initializing your cinematic challenge...</p></div>;
        }
        
        switch (gameStatus) {
            case 'start':
                return <StartScreen onStartGame={startGame} start={startActor} target={targetActor} />;
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
                    />
                );
            case 'win':
            case 'lose':
                return <EndScreen 
                            win={gameStatus === 'win'} 
                            lossReason={lossReason}
                            path={path} 
                            cpuPath={cpuPath}
                            onPlayAgain={resetGame} 
                            elapsedTime={elapsedTime} 
                            target={targetActor} 
                        />;
            default:
                return null;
        }
    };
    
    return (
        <main className="bg-gray-900 text-white h-screen flex flex-col font-sans">
            <Header />
            <div className="flex-grow overflow-hidden">
              {renderContent()}
            </div>
        </main>
    );
};

export default App;
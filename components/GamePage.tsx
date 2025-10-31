import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import EndScreen from './EndScreen';
import WaitingForOpponentScreen from './WaitingForOpponentScreen';
import ConnectionNodeSkeleton from './ConnectionNodeSkeleton';
import LinkIcon from './icons/LinkIcon';

import * as geminiService from '../services/geminiService';
import { socketService } from '../services/socketService';

import { Actor, ConnectionNodeData, GameMode, LossReason, UserProfile } from '../types';

const MAX_PATH_LENGTH = 13; // 6 degrees + start actor
const GAME_TIME_LIMIT = 300; // 5 minutes

interface GamePageProps {
    userProfile: UserProfile;
}

const GamePage: React.FC<GamePageProps> = ({ userProfile }) => {
    const { challengeId: challengeIdFromUrl } = useParams<{ challengeId: string }>();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState<'loading' | 'waiting' | 'playing' | 'ended'>('loading');
    const [gameMode, setGameMode] = useState<GameMode>('solo');
    const [startActor, setStartActor] = useState<Actor | null>(null);
    const [targetActor, setTargetActor] = useState<Actor | null>(null);
    const [path, setPath] = useState<ConnectionNodeData[]>([]);
    const [choices, setChoices] = useState<ConnectionNodeData[]>([]);
    const [loadingChoices, setLoadingChoices] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [win, setWin] = useState(false);
    const [lossReason, setLossReason] = useState<LossReason | null>(null);
    const [solutionPath, setSolutionPath] = useState<ConnectionNodeData[]>([]);
    const [loadingSolution, setLoadingSolution] = useState(false);
    const [ratingChange, setRatingChange] = useState<number | undefined>(undefined);
    
    // Online state
    const [challengeId, setChallengeId] = useState<string | null>(challengeIdFromUrl ?? null);
    const [opponent, setOpponent] = useState<UserProfile | null>(null);
    const [opponentPath, setOpponentPath] = useState<ConnectionNodeData[]>([]);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    
    const stopTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    const endGame = useCallback(async (didPlayerWin: boolean, reason: LossReason | null = null) => {
        stopTimer();
        setWin(didPlayerWin);
        setLossReason(reason);
        setGameState('ended');
        
        if (!didPlayerWin && startActor && targetActor) {
            setLoadingSolution(true);
            try {
                const solPath = await geminiService.getSolutionPath(startActor, targetActor);
                setSolutionPath(solPath);
            } catch (error) {
                console.error("Failed to get solution path:", error);
            } finally {
                setLoadingSolution(false);
            }
        }
    }, [stopTimer, startActor, targetActor]);
    
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
    }, [stopTimer, endGame]);

    const initializeGame = useCallback(async (
        mode: GameMode,
        start: Actor, 
        target: Actor
    ) => {
        setGameMode(mode);
        setStartActor(start);
        setTargetActor(target);
        setPath([start]);
        if (mode === 'online') setOpponentPath([start]);
        
        setLoadingChoices(true);
        const initialChoices = await geminiService.getChoices(start);
        setChoices(initialChoices);
        setLoadingChoices(false);
        setGameState('playing');
        startTimer();
    }, [startTimer]);

    // Main effect to setup the game based on URL
    useEffect(() => {
        const setup = async () => {
            if (!challengeId) return;

            if (challengeId === 'solo') {
                const { start, target } = await geminiService.getInitialActors();
                initializeGame('solo', start, target);
            } else {
                setGameMode('online');
                socketService.emit('join', { challengeId: challengeId, userId: userProfile.id });
                setGameState('waiting');
            }
        };
        setup().catch(err => {
            console.error("Failed to setup game:", err);
            alert("There was an error setting up the game. Returning to the main menu.");
            navigate('/');
        });
    }, [challengeId, userProfile.id, navigate, initializeGame]);
    
    // WebSocket Effects for online games
    useEffect(() => {
        const unsubs: (()=>void)[] = [];
        if(gameMode === 'online') {
            unsubs.push(socketService.on('game:start', (payload) => {
                setOpponent(payload.opponent);
                const startPromise = geminiService.getActorById(payload.startId);
                const targetPromise = geminiService.getActorById(payload.targetId);
                Promise.all([startPromise, targetPromise]).then(([start, target]) => {
                    initializeGame('online', start, target);
                });
            }));
            unsubs.push(socketService.on('game:update', (payload) => {
                setOpponentPath(payload.path);
            }));
            unsubs.push(socketService.on('game:over', (payload) => {
                const didIWin = payload.winnerId === userProfile.id;
                setRatingChange(payload.ratingChanges[userProfile.id]);
                endGame(didIWin, didIWin ? null : 'opponent_won');
            }));
            unsubs.push(socketService.on('opponent:left', () => {
                 endGame(true, 'opponent_left');
            }));
            unsubs.push(socketService.on('join:error', (payload) => {
                alert(`Error joining challenge: ${payload.message}`);
                navigate('/');
            }));
        }
        return () => unsubs.forEach(u => u());
    }, [gameMode, userProfile.id, endGame, navigate, initializeGame]);

    const handleSelectChoice = useCallback(async (choice: ConnectionNodeData) => {
        if (loadingChoices || !targetActor) return;
        const newPath = [...path, choice];
        setPath(newPath);
        if (gameMode === 'online' && challengeId) {
            socketService.emit('game:update', { path: newPath });
        }
        setChoices([]);
        if (choice.id === targetActor.id) {
            if (gameMode !== 'online') endGame(true); // Online win is determined by server
            return;
        }
        if (newPath.length >= MAX_PATH_LENGTH) {
            if (gameMode !== 'online') endGame(false, 'too_many_steps');
            return;
        }
        setLoadingChoices(true);
        try {
            const nextChoices = await geminiService.getChoices(choice);
            setChoices(nextChoices);
        } catch (error) {
            console.error("Failed to get choices:", error);
        } finally {
            setLoadingChoices(false);
        }
    }, [path, targetActor, loadingChoices, endGame, gameMode, challengeId]);

    const handleCancelChallenge = () => {
        if (challengeId) {
            socketService.emit('challenge:cancel', {});
        }
        navigate('/');
    };
    
    const handlePlayAgain = () => {
        navigate(0); // Refresh the page to start a new game of the same type
    };
    
    const handleNewChallenge = () => {
        // A 'new' challenge is created from the home page now
        navigate('/');
    };

    if (gameState === 'loading') {
        return <div className="flex flex-col items-center justify-center h-full"><div className="flex items-center p-4 snap-x space-x-3"><ConnectionNodeSkeleton isFirst /><LinkIcon /><ConnectionNodeSkeleton isLast /></div><p className="mt-4 text-lg text-gray-400 animate-pulse">Setting the stage...</p></div>;
    }

    if (gameState === 'waiting') {
        return <WaitingForOpponentScreen challengeId={challengeId!} onCancel={handleCancelChallenge} />;
    }

    if (gameState === 'playing' && startActor && targetActor) {
        return <GameBoard path={path} opponentPath={opponentPath} target={targetActor} choices={choices} onSelectChoice={handleSelectChoice} loadingChoices={loadingChoices} elapsedTime={elapsedTime} maxPathLength={MAX_PATH_LENGTH} gameMode={gameMode} opponent={opponent ?? undefined} />;
    }

    if (gameState === 'ended' && targetActor) {
        return <EndScreen win={win} lossReason={lossReason} path={path} cpuPath={opponentPath} solutionPath={solutionPath} loadingSolution={loadingSolution} onPlayAgain={() => navigate(`/game/${gameMode === 'solo' ? 'solo' : challengeId}`)} onChallenge={handleNewChallenge} onNavigate={() => navigate('/')} elapsedTime={elapsedTime} target={targetActor} gameMode={gameMode} ratingChange={ratingChange} />;
    }
    
    return null;
};

export default GamePage;

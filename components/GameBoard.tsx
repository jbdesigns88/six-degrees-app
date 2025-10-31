import React, { useState, useCallback, useEffect } from 'react';
import { ConnectionNodeData, Actor, GameMode } from '../types';
import ConnectionNode from './ConnectionNode';
import LinkIcon from './icons/LinkIcon';
import LoadingSpinner from './icons/LoadingSpinner';
import GameHeader from './GameHeader';
import * as geminiService from '../services/geminiService';

interface GameBoardProps {
  path: ConnectionNodeData[];
  opponentPath: ConnectionNodeData[];
  target: Actor;
  choices: ConnectionNodeData[];
  onSelectChoice: (choice: ConnectionNodeData) => void;
  loadingChoices: boolean;
  elapsedTime: number;
  maxPathLength: number;
  gameMode: GameMode;
  opponent?: { username: string; rating: number };
}

interface ChoiceCardProps {
    choice: ConnectionNodeData;
    onSelect: () => void;
    isSelected: boolean;
    isHinted: boolean;
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({ choice, onSelect, isSelected, isHinted }) => {
    const [imgLoaded, setImgLoaded] = useState(false);
    const name = choice.type === 'actor' ? choice.name : choice.title;
    const placeholderUrl = `https://via.placeholder.com/200x300/1f2f37/4b5563?text=${encodeURIComponent(name)}`;

    const ringClasses = isSelected 
        ? 'ring-4 ring-cyan-500 ring-offset-2 ring-offset-gray-900' 
        : isHinted
        ? 'ring-4 ring-amber-500 ring-offset-2 ring-offset-gray-900 animate-pulse'
        : 'focus:ring-2 focus:ring-cyan-400';

    return (
        <button
            onClick={onSelect}
            className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none flex flex-col ${ringClasses}`}
          >
            <div className="relative w-full aspect-[2/3]">
              {!imgLoaded && <div className="absolute inset-0 bg-gray-700 animate-pulse"></div>}
              <img 
                  src={choice.imageUrl} 
                  alt={name} 
                  className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImgLoaded(true)}
                  onError={(e) => {
                      e.currentTarget.src = placeholderUrl;
                      setImgLoaded(true);
                  }}
              />
            </div>
            <div className="p-2 text-center flex-grow flex flex-col justify-center">
              <p className="font-bold text-xs sm:text-sm text-white leading-tight">{name}</p>
              <p className="text-xs text-cyan-400 capitalize">{choice.type}</p>
            </div>
          </button>
    );
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const GameBoard: React.FC<GameBoardProps> = ({
  path,
  opponentPath,
  target,
  choices,
  onSelectChoice,
  loadingChoices,
  elapsedTime,
  maxPathLength,
  gameMode,
  opponent,
}) => {
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [hintedChoiceId, setHintedChoiceId] = useState<number | null>(null);
  const [isGettingHint, setIsGettingHint] = useState(false);
  
  const lastNodeInPath = path[path.length - 1];
  const choiceType = lastNodeInPath?.type === 'actor' ? 'movies' : 'actors';
  const startActor = path[0] as Actor;
  const playerDegrees = Math.floor(path.length / 2);
  const opponentDegrees = Math.floor(opponentPath.length / 2);

  const handleChoiceSelection = (choice: ConnectionNodeData) => {
      if (loadingChoices) return;
      setSelectedChoiceId(choice.id);
      setHintedChoiceId(null);
      onSelectChoice(choice);
  };
  
  // This effect clears the selection when new choices arrive
  useEffect(() => {
    if (!loadingChoices) {
      setSelectedChoiceId(null);
    }
  }, [loadingChoices]);

  const handleGetHint = async () => {
    if (isGettingHint || loadingChoices || !target) return;
    setIsGettingHint(true);
    try {
        const hint = await geminiService.getCpuMove(path, choices, target);
        if (hint) {
            setHintedChoiceId(hint.id);
        }
    } catch (error) {
        console.error("Failed to get hint:", error);
        alert("Sorry, couldn't get a hint right now. Please try again.");
    } finally {
        setIsGettingHint(false);
    }
  };

  return (
    <div className="flex flex-col">
      <GameHeader
        startActor={startActor}
        targetActor={target}
        path={path}
        maxPathLength={maxPathLength}
        elapsedTime={elapsedTime}
      />
      
      {/* Path Carousel */}
      <div className="flex-shrink-0">
        <div className="flex items-center overflow-x-auto p-4 snap-x snap-mandatory space-x-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} aria-roledescription="carousel" aria-label="Connection Path">
          {path.map((node, index) => (
            <React.Fragment key={`${node.type}-${node.id}`}>
              <div className="snap-center w-[72vw] sm:w-[58vw] md:w-[40vw] lg:w-56">
                <ConnectionNode data={node} isFirst={index === 0} />
              </div>
              {index < path.length - 1 && <LinkIcon />}
            </React.Fragment>
          ))}
          <div className="snap-center text-center flex-shrink-0 w-48 px-4 flex flex-col items-center justify-center h-full text-gray-400">
            <p className="animate-pulse mb-2 text-sm">... trying to reach ...</p>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <div className="snap-center w-[72vw] sm:w-[58vw] md:w-[40vw] lg:w-56">
            <ConnectionNode data={target} isLast={true} />
          </div>
        </div>
      </div>
       {gameMode === 'online' && opponent && (
            <div className="text-center text-sm text-gray-400 p-2 bg-gray-800">
                Opponent: <span className="font-bold text-amber-300">{opponent.username}</span> ({opponent.rating}) - Path Length: {opponentPath.length}
            </div>
        )}

      <hr className="border-gray-700" />

      {/* Choices Area */}
      <div className="p-4">
        {loadingChoices && selectedChoiceId === null ? (
          <div className="text-center py-8">
            <LoadingSpinner />
            <p className="mt-4 text-gray-400">
                {`Finding ${choiceType}...`}
            </p>
          </div>
        ) : (
          <div className="w-full">
              <div className="flex justify-around items-center w-full max-w-sm mx-auto mb-4 text-center border-y border-gray-700 py-3">
                  <div className="px-4">
                      <div className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">You</div>
                      <div className="text-2xl font-bold text-white">{playerDegrees}</div>
                      <div className="text-xs text-gray-400">degrees</div>
                  </div>
                  <div className={`px-4 ${gameMode !== 'solo' ? 'border-x border-gray-700' : ''}`}>
                      <div className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Time</div>
                      <div className="text-2xl font-bold text-white">{formatTime(elapsedTime)}</div>
                      <div className="text-xs text-gray-400">elapsed</div>
                  </div>
                  {gameMode !== 'solo' && (
                    <div className="px-4">
                        <div className="text-sm font-semibold text-amber-300 uppercase tracking-wider">{gameMode === 'cpu' ? 'CPU' : 'Opponent'}</div>
                        <div className="text-2xl font-bold text-white">{opponentDegrees}</div>
                        <div className="text-xs text-gray-400">degrees</div>
                    </div>
                  )}
              </div>
              <div className="flex justify-center items-center gap-4 mb-4">
                <h2 className="text-lg font-bold text-cyan-300 text-center">
                    Choose the next connection:
                </h2>
                <button 
                    onClick={handleGetHint} 
                    disabled={isGettingHint || loadingChoices || choices.length === 0}
                    className="px-3 py-1 bg-amber-600 text-white font-semibold rounded-full shadow-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                    {isGettingHint ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Thinking...
                        </>
                    ) : (
                        <>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Hint
                        </>
                    )}
                </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {choices.map((choice) => (
                <ChoiceCard
                  key={`${choice.type}-${choice.id}`}
                  choice={choice}
                  onSelect={() => handleChoiceSelection(choice)}
                  isSelected={selectedChoiceId === choice.id}
                  isHinted={hintedChoiceId === choice.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameBoard;
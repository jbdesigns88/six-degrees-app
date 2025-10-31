import React, { useState } from 'react';
import { ConnectionNodeData, Actor } from '../types';
import ConnectionNode from './ConnectionNode';
import LinkIcon from './icons/LinkIcon';
import LoadingSpinner from './icons/LoadingSpinner';
import GameHeader from './GameHeader';

interface GameBoardProps {
  path: ConnectionNodeData[];
  cpuPath: ConnectionNodeData[];
  target: Actor;
  choices: ConnectionNodeData[];
  onSelectChoice: (choice: ConnectionNodeData) => void;
  loadingChoices: boolean;
  elapsedTime: number;
  maxPathLength: number;
}

const ChoiceCard: React.FC<{ choice: ConnectionNodeData; onSelect: () => void; }> = ({ choice, onSelect }) => {
    const [imgLoaded, setImgLoaded] = useState(false);
    const name = choice.type === 'actor' ? choice.name : choice.title;
    const placeholderUrl = `https://via.placeholder.com/200x300/1f2937/4b5563?text=${encodeURIComponent(name)}`;

    return (
        <button
            onClick={onSelect}
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform transform hover:scale-105 hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-400 flex flex-col"
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
  cpuPath,
  target,
  choices,
  onSelectChoice,
  loadingChoices,
  elapsedTime,
  maxPathLength,
}) => {
  const lastNodeInPath = path[path.length - 1];
  const choiceType = lastNodeInPath?.type === 'actor' ? 'movies' : 'actors';
  const startActor = path[0] as Actor;
  const playerDegrees = Math.floor(path.length / 2);
  const cpuDegrees = Math.floor(cpuPath.length / 2);

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
              <div className="snap-center">
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
          <div className="snap-center">
            <ConnectionNode data={target} isLast={true} />
          </div>
        </div>
      </div>

      <hr className="border-gray-700" />

      {/* Choices Area */}
      <div className="p-4">
        {loadingChoices ? (
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
                  <div className="px-4 border-x border-gray-700">
                      <div className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Time</div>
                      <div className="text-2xl font-bold text-white">{formatTime(elapsedTime)}</div>
                      <div className="text-xs text-gray-400">elapsed</div>
                  </div>
                  <div className="px-4">
                      <div className="text-sm font-semibold text-amber-300 uppercase tracking-wider">CPU</div>
                      <div className="text-2xl font-bold text-white">{cpuDegrees}</div>
                      <div className="text-xs text-gray-400">degrees</div>
                  </div>
              </div>
              <h2 className="text-lg font-bold text-cyan-300 mb-4 text-center">
                  Choose the next connection:
              </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {choices.map((choice) => (
                <ChoiceCard
                  key={`${choice.type}-${choice.id}`}
                  choice={choice}
                  onSelect={() => onSelectChoice(choice)}
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
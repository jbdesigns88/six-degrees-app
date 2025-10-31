import React from 'react';
import { Actor, ConnectionNodeData } from '../types';

interface GameHeaderProps {
  startActor: Actor;
  targetActor: Actor;
  path: ConnectionNodeData[];
  maxPathLength: number;
  elapsedTime: number;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const GameHeader: React.FC<GameHeaderProps> = ({ startActor, targetActor, path, maxPathLength, elapsedTime }) => {
    const progressPercentage = Math.min((path.length / maxPathLength) * 100, 100);
    const currentDegrees = Math.floor(path.length / 2);
    const maxDegrees = Math.floor(maxPathLength / 2);

    return (
        <div className="sticky top-0 z-10 bg-gray-800/80 backdrop-blur-sm p-3 border-b border-gray-700 flex-shrink-0" aria-live="polite">
            <div className="flex justify-between items-center gap-4">
                <div className="text-sm font-semibold truncate flex-1 min-w-0" aria-label={`Connection goal: from ${startActor.name} to ${targetActor.name}`}>
                    <span className="text-cyan-400 truncate">{startActor.name}</span>
                    <span className="text-gray-400 mx-1 sm:mx-2" aria-hidden="true">→</span>
                    <span className="text-amber-400 truncate">{targetActor.name}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                    <div className="text-sm font-mono bg-gray-900/70 px-2 py-1 rounded-md text-cyan-300 border border-gray-700">
                        {formatTime(elapsedTime)}
                    </div>
                    <div className="hidden sm:block text-sm font-bold bg-gray-700 text-white px-3 py-1 rounded-full" aria-label={`Current progress: ${currentDegrees} of ${maxDegrees} links`}>
                        {currentDegrees} / {maxDegrees}
                    </div>
                </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                <div 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progressPercentage}%` }}
                    role="progressbar"
                    aria-valuenow={progressPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${Math.round(progressPercentage)}% complete`}
                ></div>
            </div>
        </div>
    );
};

export default GameHeader;

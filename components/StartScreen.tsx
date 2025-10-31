import React from 'react';
import { Actor, GameMode } from '../types';
import ConnectionNode from './ConnectionNode';

interface StartScreenProps {
  onStartGame: (mode: GameMode) => void;
  onShowLeaderboard: () => void;
  start: Actor;
  target: Actor;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame, onShowLeaderboard, start, target }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-gray-900 text-white">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">
        Six Degrees
      </h1>
      <p className="text-lg text-gray-300 mb-8 max-w-2xl">
        Can you connect two stars of the silver screen? Your challenge is to link the starting actor to the target actor in six moves or less.
      </p>

      <div className="flex items-center justify-center w-full max-w-lg gap-4 sm:gap-6 mb-8 px-4">
        <div className="w-2/5 max-w-40">
          <ConnectionNode data={start} isFirst={true} />
        </div>
        <div className="flex flex-col items-center text-gray-400 font-bold text-lg sm:text-2xl animate-pulse flex-shrink-0">
            <span className="mb-2">to</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span className="mt-2">link</span>
        </div>
        <div className="w-2/5 max-w-40">
          <ConnectionNode data={target} isLast={true} />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => onStartGame('solo')}
          className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300"
        >
          Play Solo
        </button>
        <button
          onClick={() => onStartGame('cpu')}
          className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-amber-300"
        >
          Play vs. CPU
        </button>
      </div>
       <button 
        onClick={onShowLeaderboard}
        className="mt-6 text-gray-400 hover:text-white transition-colors underline"
      >
        View Leaderboard
      </button>
    </div>
  );
};

export default StartScreen;
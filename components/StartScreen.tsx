import React from 'react';
import { UserProfile, View, GameMode, CpuDifficulty } from '../types';
import { getRank } from '../services/ratingService';

interface StartScreenProps {
  onStartGame: (mode: GameMode, difficulty?: CpuDifficulty) => void;
  onNavigate: (view: View) => void;
  playerRating: UserProfile | null;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame, onNavigate, playerRating }) => {
  const rank = playerRating ? getRank(playerRating.rating) : null;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-gray-900 text-white">
      {playerRating && rank && (
        <div className="mb-8 p-4 bg-gray-800/50 rounded-lg">
          <div className="text-sm text-gray-400">Your Rating</div>
          <div className="text-3xl font-bold font-mono text-cyan-300">{playerRating.rating}</div>
          <div className="text-amber-300 mt-1">{rank.icon} {rank.title}</div>
        </div>
      )}
      <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">
        Six Degrees
      </h1>
      <p className="text-base text-gray-300 mb-8 max-w-2xl">
        Choose a game mode to test your cinematic knowledge.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
        {/* Solo Practice */}
        <button onClick={() => onStartGame('solo')} className="p-6 bg-gray-800 rounded-lg shadow-lg text-left transition-transform transform hover:scale-105 hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-400">
          <h2 className="text-xl font-bold text-cyan-300">Solo Practice</h2>
          <p className="text-gray-400 mt-1 text-sm">Hone your skills with no pressure. The clock is your only opponent.</p>
        </button>

        {/* Play Online */}
        <button onClick={() => onNavigate('lobby')} className="p-6 bg-gray-800 rounded-lg shadow-lg text-left transition-transform transform hover:scale-105 hover:shadow-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-400">
          <h2 className="text-xl font-bold text-amber-300">Play Online</h2>
          <p className="text-gray-400 mt-1 text-sm">Challenge other players in real-time and climb the global rankings.</p>
        </button>
        
        {/* Play vs CPU Casual */}
        <button disabled className="p-6 bg-gray-800 rounded-lg shadow-lg text-left transition-transform transform hover:scale-105 hover:shadow-green-500/30 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed">
          <h2 className="text-xl font-bold text-green-300">Vs. CPU (Casual)</h2>
          <p className="text-gray-400 mt-1 text-sm">A relaxed match against an AI opponent. (Coming soon)</p>
        </button>

        {/* Play vs CPU Pro */}
        <button disabled className="p-6 bg-gray-800 rounded-lg shadow-lg text-left transition-transform transform hover:scale-105 hover:shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed">
          <h2 className="text-xl font-bold text-red-300">Vs. CPU (Pro)</h2>
          <p className="text-gray-400 mt-1 text-sm">Face a tougher AI. (Coming soon)</p>
        </button>
      </div>
      
      <div className="mt-8 flex gap-4">
        <button onClick={() => onNavigate('howToPlay')} className="text-gray-400 hover:text-white transition-colors">
          How to Play
        </button>
        <span className="text-gray-600">|</span>
        <button onClick={() => onNavigate('leaderboard')} className="text-gray-400 hover:text-white transition-colors">
          Leaderboard
        </button>
      </div>

    </div>
  );
};

export default StartScreen;
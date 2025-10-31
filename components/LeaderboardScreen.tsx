import React, { useEffect, useState } from 'react';
import { Score } from '../types';
import * as localStorageService from '../services/localStorageService';

interface LeaderboardScreenProps {
  onBack: () => void;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onBack }) => {
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    setScores(localStorageService.getLeaderboard());
  }, []);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

  return (
    <div className="flex flex-col items-center h-full p-4 bg-gray-900 text-white overflow-y-auto">
      <h1 className="text-4xl md:text-5xl font-extrabold my-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">
        Leaderboard
      </h1>

      <div className="w-full max-w-2xl bg-gray-800/50 rounded-lg shadow-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="p-3 font-bold uppercase text-gray-400 text-sm">Rank</th>
              <th className="p-3 font-bold uppercase text-gray-400 text-sm">Player</th>
              <th className="p-3 font-bold uppercase text-gray-400 text-sm text-center">Degrees</th>
              <th className="p-3 font-bold uppercase text-gray-400 text-sm text-center">Time</th>
            </tr>
          </thead>
          <tbody>
            {scores.length > 0 ? (
              scores.map((score, index) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-3 font-bold text-lg">{index + 1}</td>
                  <td className="p-3 font-semibold">{score.playerName}</td>
                  <td className="p-3 text-center">{score.degrees}</td>
                  <td className="p-3 text-center font-mono">{formatTime(score.time)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">
                  No scores yet. Be the first to get on the board!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={onBack}
        className="mt-8 px-8 py-4 bg-gray-700 text-white font-bold rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-gray-500"
      >
        Back to Game
      </button>
    </div>
  );
};

export default LeaderboardScreen;
import React, { useEffect, useState } from 'react';
import { Rating } from '../types';
import * as localStorageService from '../services/localStorageService';
import { getRank } from '../services/ratingService';

interface LeaderboardScreenProps {
  onBack: () => void;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onBack }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    setRatings(localStorageService.getRatingsForLeaderboard());
  }, []);
  
  return (
    <div className="flex flex-col items-center h-full p-4 bg-gray-900 text-white overflow-y-auto">
      <h1 className="text-4xl md:text-5xl font-extrabold my-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">
        Player Rankings
      </h1>

      <div className="w-full max-w-2xl bg-gray-800/50 rounded-lg shadow-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="p-3 font-bold uppercase text-gray-400 text-sm">Rank</th>
              <th className="p-3 font-bold uppercase text-gray-400 text-sm">Player</th>
              <th className="p-3 font-bold uppercase text-gray-400 text-sm">Title</th>
              <th className="p-3 font-bold uppercase text-gray-400 text-sm text-center">Rating</th>
            </tr>
          </thead>
          <tbody>
            {ratings.length > 0 ? (
              ratings.map((player, index) => {
                const rank = getRank(player.rating);
                return (
                    <tr key={player.username} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-3 font-bold text-lg">{index + 1}</td>
                    <td className="p-3 font-semibold">{player.username}</td>
                    <td className="p-3">{rank.icon} {rank.title}</td>
                    <td className="p-3 text-center font-mono font-bold text-lg text-cyan-300">{player.rating}</td>
                    </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">
                  No players on the board yet. Start playing to get a rating!
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
        Back
      </button>
    </div>
  );
};

export default LeaderboardScreen;

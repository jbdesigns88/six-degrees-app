import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import * as userService from '../services/userService';
import { getRank } from '../services/ratingService';
import LoadingSpinner from './icons/LoadingSpinner';

interface LeaderboardScreenProps {
  onBack: () => void;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onBack }) => {
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await userService.getLeaderboard();
        setPlayers(data);
        setError(null);
      } catch (err) {
        setError('Failed to load leaderboard. Please check your connection.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <LoadingSpinner />
          <p className="mt-2 text-gray-400">Loading Rankings...</p>
        </div>
      );
    }

    if (error) {
       return <div className="p-8 text-center text-red-400">{error}</div>;
    }

    if (players.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="p-8 text-center text-gray-400">
            No players on the board yet. Start playing to get a rating!
          </td>
        </tr>
      )
    }

    return players.map((player, index) => {
        const rank = getRank(player.rating);
        return (
            <tr key={player.id} className="border-b border-gray-700 hover:bg-gray-700/50">
            <td className="p-3 font-bold text-lg">{index + 1}</td>
            <td className="p-3 font-semibold">{player.username}</td>
            <td className="p-3">{rank.icon} {rank.title}</td>
            <td className="p-3 text-center font-mono font-bold text-lg text-cyan-300">{player.rating}</td>
            </tr>
        );
      });
  }


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
            {renderContent()}
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

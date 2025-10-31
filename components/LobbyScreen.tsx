
import React from 'react';

interface LobbyScreenProps {
  onChallenge: () => void;
  onBack: () => void;
  username: string;
  rating: number;
}


const LobbyScreen: React.FC<LobbyScreenProps> = ({ onChallenge, onBack, username, rating }) => {
  return (
    <div className="flex flex-col items-center h-full p-4 bg-gray-900 text-white overflow-y-auto">
      <h1 className="text-4xl md:text-5xl font-extrabold my-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">
        Online Lobby
      </h1>
      <p className="text-gray-300 mb-6 text-center max-w-md">
          Create a new challenge to generate a shareable link. Send it to a friend to start a real-time match!
      </p>

      <div className="w-full max-w-md mb-6">
        <button
            onClick={onChallenge}
            className="w-full px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-amber-300"
        >
          Create New Challenge
        </button>
      </div>
      
      <div className="w-full max-w-md bg-gray-800/50 rounded-lg shadow-lg">
        <div className="p-3 bg-gray-700/50 font-bold uppercase text-gray-400 text-sm text-center">
            Your Info
        </div>
        <ul>
            <li className="flex justify-between items-center p-3 border-b border-gray-700 bg-cyan-900/20 last:border-b-0">
                <span className="font-bold text-cyan-300">{username} (You)</span>
                <span className="font-mono text-cyan-300">{rating}</span>
            </li>
        </ul>
      </div>

       <button
        onClick={onBack}
        className="mt-8 px-8 py-4 bg-gray-700 text-white font-bold rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-gray-500"
      >
        Back to Menu
      </button>
    </div>
  );
};

export default LobbyScreen;

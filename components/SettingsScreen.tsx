import React from 'react';
import { useNavigate } from 'react-router-dom';

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center h-full p-4 md:p-6 bg-gray-900 text-white">
      <h1 className="text-4xl md:text-5xl font-extrabold my-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">
        Settings
      </h1>
      <div className="w-full max-w-2xl space-y-4">
        <div className="bg-gray-800/50 p-4 rounded-lg flex justify-between items-center">
          <span className="text-gray-300">Game Rules & Scoring</span>
          <button 
            onClick={() => navigate('/how-to-play')}
            className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
          >
            How to Play
          </button>
        </div>
         <div className="bg-gray-800/50 p-4 rounded-lg text-center text-gray-500">
          <p>More settings coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
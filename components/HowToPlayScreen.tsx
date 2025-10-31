import React from 'react';
import { RANKS } from '../services/ratingService';

interface HowToPlayScreenProps {
  onBack: () => void;
}

const HowToPlayScreen: React.FC<HowToPlayScreenProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col items-center h-full p-4 md:p-6 bg-gray-900 text-white overflow-y-auto">
      <h1 className="text-4xl md:text-5xl font-extrabold my-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">
        How to Play
      </h1>

      <div className="w-full max-w-3xl space-y-6 text-left text-gray-300">
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h2 className="text-2xl font-bold text-amber-300 mb-2">The Objective</h2>
          <p>
            The goal is simple: connect two actors through their shared movie history in as few steps as possible. A "step" or "degree" is one movie and one co-star. You'll race against the clock and either a CPU opponent or a live player online.
          </p>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h2 className="text-2xl font-bold text-amber-300 mb-2">Player Rating System</h2>
          <p>
            Every player has a rating that changes based on match outcomes. You start with a rating of 1000. Winning increases your rating, while losing decreases it.
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><span className="font-bold text-green-400">Winning</span> against a higher-rated opponent gives you more points.</li>
            <li><span className="font-bold text-green-400">Winning</span> against a lower-rated opponent gives you fewer points.</li>
            <li><span className="font-bold text-red-400">Losing</span> against a lower-rated opponent costs you more points.</li>
            <li><span className="font-bold text-red-400">Losing</span> against a higher-rated opponent costs you fewer points.</li>
          </ul>
        </div>
        
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h2 className="text-2xl font-bold text-amber-300 mb-2">Ranks & Titles</h2>
          <p>As your rating improves, you'll achieve new ranks. Here's what you can aspire to:</p>
           <div className="mt-4 w-full">
             <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="p-2 text-amber-300">Rating</th>
                  <th className="p-2 text-amber-300">Icon</th>
                  <th className="p-2 text-amber-300">Title</th>
                </tr>
              </thead>
              <tbody>
                {RANKS.map(rank => (
                  <tr key={rank.title} className="border-b border-gray-700">
                    <td className="p-2 font-mono">{rank.minRating}+</td>
                    <td className="p-2 text-2xl">{rank.icon}</td>
                    <td className="p-2 font-semibold">{rank.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
        </div>
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

export default HowToPlayScreen;

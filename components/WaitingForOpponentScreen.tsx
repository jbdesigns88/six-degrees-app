import React, { useState } from 'react';
import LoadingSpinner from './icons/LoadingSpinner';

interface WaitingForOpponentScreenProps {
  challengeId: string;
  onCancel: () => void;
}

const WaitingForOpponentScreen: React.FC<WaitingForOpponentScreenProps> = ({ challengeId, onCancel }) => {
  const [copied, setCopied] = useState(false);
  const challengeUrl = `${window.location.origin}/game/${challengeId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(challengeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-gray-900 text-white">
      <LoadingSpinner />
      <h1 className="text-3xl font-bold mt-6 mb-2">Waiting for an opponent...</h1>
      <p className="text-gray-400 mb-6">Your challenge is live. You can also share the link directly.</p>

      <div className="w-full max-w-md bg-gray-800 p-4 rounded-lg">
        <p className="text-sm text-left text-gray-300 mb-2">Challenge Link:</p>
        <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={challengeUrl}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300"
            />
            <button
              onClick={handleCopy}
              className="flex-shrink-0 px-4 py-2 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
        </div>
      </div>
      
      <button
        onClick={onCancel}
        className="mt-8 px-8 py-4 bg-gray-700 text-white font-bold rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-gray-500"
      >
        Cancel
      </button>
    </div>
  );
};

export default WaitingForOpponentScreen;

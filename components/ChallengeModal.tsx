import React, { useState } from 'react';

interface ChallengeModalProps {
  challengeUrl: string;
  onClose: () => void;
}

const ChallengeModal: React.FC<ChallengeModalProps> = ({ challengeUrl, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(challengeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-amber-400 mb-4">Challenge a Friend</h2>
        <p className="text-gray-300 mb-4">
          Send this link to a friend to see if they can beat your score on the same puzzle!
        </p>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            readOnly
            value={challengeUrl}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ChallengeModal;
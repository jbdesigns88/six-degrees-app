import React from 'react';
import { Rank, UserProfile } from '../types';
import { getRank } from '../services/ratingService';

interface ProfileScreenProps {
  userProfile: UserProfile;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ userProfile }) => {
  const rank = getRank(userProfile.rating);

  return (
    <div className="flex flex-col items-center h-full p-4 md:p-6 bg-gray-900 text-white overflow-y-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold my-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">
            Player Profile
        </h1>
        <div className="w-full max-w-md bg-gray-800/50 p-6 rounded-lg shadow-lg text-center">
             <div className="text-lg text-gray-400">Welcome back,</div>
            <div className="text-3xl font-bold text-cyan-400 mt-1">{userProfile.username}</div>
            
            <div className="mt-6 border-t border-gray-700 pt-6">
                 <div className="text-sm text-gray-400 uppercase tracking-wider">Current Rank</div>
                 <div className="mt-2 text-2xl font-semibold flex items-center justify-center">
                    <span className="text-4xl mr-3">{rank.icon}</span>
                    <span className="text-amber-300">{rank.title}</span>
                </div>
            </div>

            <div className="mt-6 border-t border-gray-700 pt-6">
                <div className="text-sm text-gray-400 uppercase tracking-wider">Rating</div>
                <div className="text-4xl font-bold font-mono text-white mt-2">{userProfile.rating}</div>
            </div>

            <div className="mt-6 border-t border-gray-700 pt-6">
                <p className="text-xs text-gray-500">
                    Play games to increase your rating and achieve higher ranks.
                </p>
            </div>
        </div>
    </div>
  );
};

export default ProfileScreen;

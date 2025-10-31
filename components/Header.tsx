import React from 'react';

interface HeaderProps {
    username?: string | null;
    onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ username, onLogout }) => {
    return (
        <header className="bg-gray-800/80 backdrop-blur-sm p-3 border-b border-gray-700 flex-shrink-0 z-20">
            <div className="flex items-center justify-between mx-auto max-w-7xl px-4">
                <div className="flex-1">
                    {username && (
                        <span className="text-sm text-gray-300">
                            Welcome, <span className="font-bold text-cyan-400">{username}</span>
                        </span>
                    )}
                </div>
                <div className="flex-1 text-center">
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">
                        Six Degrees
                    </h1>
                </div>
                <div className="flex-1 text-right">
                    {username && onLogout && (
                         <button onClick={onLogout} className="text-sm text-gray-400 hover:text-white transition-colors">
                            Log Out
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
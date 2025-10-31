import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="bg-gray-800/80 backdrop-blur-sm p-3 border-b border-gray-700 flex-shrink-0 z-20">
            <div className="flex items-center justify-center">
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">
                    Six Degrees
                </h1>
            </div>
        </header>
    );
};

export default Header;
import React from 'react';
import { View } from '../types';

interface BottomNavBarProps {
    currentView: View;
    onNavigate: (view: View) => void;
}

const NavItem: React.FC<{
    label: string;
    // Fix: Changed JSX.Element to React.ReactElement to resolve namespace error.
    icon: React.ReactElement;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
    const activeClass = 'text-cyan-400';
    const inactiveClass = 'text-gray-400 hover:text-white';
    
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center transition-colors duration-200 ${isActive ? activeClass : inactiveClass}`}>
            {icon}
            <span className={`text-xs mt-1 font-medium ${isActive ? 'text-cyan-400' : 'text-gray-500'}`}>{label}</span>
        </button>
    )
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentView, onNavigate }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700 z-50">
            <div className="flex justify-around items-center h-full max-w-lg mx-auto">
                <NavItem
                    label="Play"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    isActive={currentView === 'start'}
                    onClick={() => onNavigate('start')}
                />
                 <NavItem
                    label="Ranks"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                    isActive={currentView === 'leaderboard'}
                    onClick={() => onNavigate('leaderboard')}
                />
                <NavItem
                    label="Profile"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    isActive={currentView === 'profile'}
                    onClick={() => onNavigate('profile')}
                />
                <NavItem
                    label="Settings"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    isActive={currentView === 'settings'}
                    onClick={() => onNavigate('settings')}
                />
            </div>
        </nav>
    );
};

export default BottomNavBar;

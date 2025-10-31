import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';
import LeaderboardScreen from './components/LeaderboardScreen';
import ProfileScreen from './components/ProfileScreen';
import SettingsScreen from './components/SettingsScreen';
import HowToPlayScreen from './components/HowToPlayScreen';

import * as localStorageService from './services/localStorageService';
import * as userService from './services/userService';
import { socketService } from './services/socketService';

import { UserProfile } from './types';

const App: React.FC = () => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = useCallback(async (name: string) => {
        setIsLoggingIn(true);
        try {
            const profile = await userService.loginOrRegister(name);
            setUserProfile(profile);
            localStorageService.setUsername(name);
            socketService.connect();

            // Check if there was a pending game join from the URL
            const pendingChallengeId = location.state?.pendingChallengeId;
            if (pendingChallengeId) {
                navigate(`/game/${pendingChallengeId}`, { replace: true });
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error("Login failed:", error);
            alert("Could not log in. Please check the server connection and try again.");
        } finally {
            setIsLoggingIn(false);
        }
    }, [navigate, location.state]);
    
    // Check for stored username on initial load
    useEffect(() => {
        const storedUsername = localStorageService.getUsername();
        if (storedUsername) {
            handleLogin(storedUsername);
        } else {
            setIsLoggingIn(false);
        }
    }, []); // Intentionally empty dependency array to run only once

    const handleLogout = () => {
        localStorageService.clearUsername();
        setUserProfile(null);
        socketService.disconnect();
        navigate('/login');
    };
    
    useEffect(() => {
        const unsubs: (()=>void)[] = [];
        if(userProfile) {
            unsubs.push(socketService.on('rating:update', (payload) => {
                 setUserProfile(p => p ? { ...p, rating: payload.newRating } : null);
            }));
        }
        return () => unsubs.forEach(u => u());
    }, [userProfile]);

    if (isLoggingIn) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <p className="text-lg animate-pulse">Connecting...</p>
            </div>
        )
    }

    return (
        <div className="bg-gray-900 text-white font-sans h-screen w-screen flex flex-col overflow-hidden">
            <Header username={userProfile?.username} onLogout={userProfile ? handleLogout : undefined} />
            <main className="flex-grow overflow-y-auto">
                 <Routes>
                    <Route path="/login" element={
                        userProfile ? <Navigate to="/" /> : <LoginScreen onLogin={handleLogin} />
                    } />
                    <Route path="/game/:challengeId" element={
                        userProfile ? <GamePage userProfile={userProfile} /> : <Navigate to="/login" state={{ pendingChallengeId: location.pathname.split('/')[2] }} />
                    } />
                     <Route path="/leaderboard" element={
                        userProfile ? <LeaderboardScreen /> : <Navigate to="/login" />
                    } />
                     <Route path="/profile" element={
                        userProfile ? <ProfileScreen userProfile={userProfile} /> : <Navigate to="/login" />
                    } />
                    <Route path="/settings" element={
                        userProfile ? <SettingsScreen /> : <Navigate to="/login" />
                    } />
                     <Route path="/how-to-play" element={
                        userProfile ? <HowToPlayScreen /> : <Navigate to="/login" />
                    } />
                    <Route path="/*" element={
                        userProfile ? <HomePage userProfile={userProfile} /> : <Navigate to="/login" />
                    } />
                </Routes>
            </main>
        </div>
    );
};

export default App;
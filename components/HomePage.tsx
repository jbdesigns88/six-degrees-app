import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import StartScreen from './StartScreen';
import LobbyScreen from './LobbyScreen';
import BottomNavBar from './BottomNavBar';
import * as geminiService from '../services/geminiService';
import { socketService } from '../services/socketService';
import LoadingSpinner from './icons/LoadingSpinner';

interface HomePageProps {
    userProfile: UserProfile;
}

const HomePage: React.FC<HomePageProps> = ({ userProfile }) => {
    const [view, setView] = useState<'start' | 'lobby'>('start');
    const [isCreating, setIsCreating] = useState(false);
    const navigate = useNavigate();

    const handleCreateNewChallenge = async () => {
        setIsCreating(true);
        try {
            const { start, target } = await geminiService.getInitialActors();
            socketService.emit('challenge:create', { startId: start.id, targetId: target.id }, (response) => {
                setIsCreating(false);
                if (response.ok) {
                    navigate(`/game/${response.challengeId}`);
                } else {
                    alert(`Could not create challenge: ${response.message}`);
                }
            });
        } catch (error) {
            setIsCreating(false);
            console.error("Error creating challenge:", error);
            alert('Could not get initial actors from the server. Please try again.');
        }
    };
    
    const renderContent = () => {
        if (isCreating) {
            return (
                 <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <LoadingSpinner />
                    <h1 className="text-2xl font-bold mt-4">Creating Your Challenge...</h1>
                    <p className="text-gray-400">Finding two perfect actors for your game.</p>
                </div>
            )
        }

        switch (view) {
            case 'start':
                return <StartScreen 
                            onStartGame={() => navigate('/game/solo')}
                            onSwitchToLobby={() => setView('lobby')}
                            playerRating={userProfile} 
                        />;
            case 'lobby':
                 return <LobbyScreen 
                            onChallenge={handleCreateNewChallenge}
                            onBack={() => setView('start')}
                            username={userProfile.username}
                            rating={userProfile.rating}
                        />;
            default:
                 return <StartScreen 
                            onStartGame={() => navigate('/game/solo')}
                            onSwitchToLobby={() => setView('lobby')}
                            playerRating={userProfile} 
                        />;
        }
    }

    return (
        <div className="h-full" style={{ paddingBottom: '70px' }}>
            {renderContent()}
            <BottomNavBar />
        </div>
    )
};

export default HomePage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import StartScreen from './StartScreen';
import LobbyScreen from './LobbyScreen';
import BottomNavBar from './BottomNavBar';

interface HomePageProps {
    userProfile: UserProfile;
}

const HomePage: React.FC<HomePageProps> = ({ userProfile }) => {
    const [view, setView] = useState<'start' | 'lobby'>('start');
    const navigate = useNavigate();

    const handleCreateNewChallenge = () => {
        // Navigate to a special "new" route which GamePage will interpret
        // to create a new online challenge.
        navigate(`/game/new`);
    };
    
    const renderContent = () => {
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

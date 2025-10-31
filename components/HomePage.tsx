import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, View } from '../types';
import StartScreen from './StartScreen';
import LobbyScreen from './LobbyScreen';
import BottomNavBar from './BottomNavBar';

interface HomePageProps {
    userProfile: UserProfile;
}

const HomePage: React.FC<HomePageProps> = ({ userProfile }) => {
    const [view, setView] = useState<View>('start');
    const navigate = useNavigate();

    const handleCreateNewChallenge = async () => {
        // The challenge creation is now handled inside GamePage.
        // We navigate to a special "new" route which GamePage will interpret.
        navigate(`/game/new`);
    };

    const handleNavigate = (newView: View) => {
        if (newView === 'leaderboard' || newView === 'profile' || newView === 'settings' || newView === 'howToPlay') {
            navigate(`/${newView}`);
        } else {
            setView(newView);
        }
    };
    
    const renderContent = () => {
        switch (view) {
            case 'start':
                return <StartScreen 
                            onStartGame={(mode, diff) => navigate('/game/solo')}
                            onNavigate={handleNavigate}
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
                            onStartGame={(mode, diff) => navigate('/game/solo')}
                            onNavigate={handleNavigate}
                            playerRating={userProfile} 
                        />;
        }
    }
    
    // Determine which views show the BottomNavBar
    const showNav = ['start', 'lobby'].includes(view);

    return (
        <div className="h-full" style={{ paddingBottom: showNav ? '70px' : '0' }}>
            {renderContent()}
            {showNav && <BottomNavBar currentView={view} onNavigate={(v) => navigate(`/${v}`)} />}
        </div>
    )
};

export default HomePage;
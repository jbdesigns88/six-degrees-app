import { Score } from '../types';

const USERNAME_KEY = 'six-degrees-username';
const LEADERBOARD_KEY = 'six-degrees-leaderboard';

// User Management
export const getUsername = (): string | null => {
    return localStorage.getItem(USERNAME_KEY);
};

export const setUsername = (name: string) => {
    localStorage.setItem(USERNAME_KEY, name);
};

export const clearUsername = () => {
    localStorage.removeItem(USERNAME_KEY);
};

// Leaderboard Management
export const getLeaderboard = (): Score[] => {
    try {
        const data = localStorage.getItem(LEADERBOARD_KEY);
        if (data) {
            const scores: Score[] = JSON.parse(data);
            // Sort by degrees (ascending), then time (ascending)
            return scores.sort((a, b) => {
                if (a.degrees !== b.degrees) {
                    return a.degrees - b.degrees;
                }
                return a.time - b.time;
            });
        }
    } catch (error) {
        console.error("Failed to retrieve leaderboard from localStorage", error);
    }
    return [];
};

export const saveScore = (score: Score) => {
    try {
        const scores = getLeaderboard();
        scores.push(score);
        // Persist only the top 100 scores
        const sortedScores = scores.sort((a, b) => {
            if (a.degrees !== b.degrees) {
                return a.degrees - b.degrees;
            }
            return a.time - b.time;
        }).slice(0, 100);

        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(sortedScores));
    } catch (error) {
        console.error("Failed to save score to localStorage", error);
    }
};
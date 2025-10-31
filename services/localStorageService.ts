// FIX: Provide full implementation for placeholder file.
import { Score } from '../types';

const LEADERBOARD_KEY = 'gemini-movielink-leaderboard';

export const getLeaderboard = (): Score[] => {
    try {
        const data = localStorage.getItem(LEADERBOARD_KEY);
        if (data) {
            const scores: Score[] = JSON.parse(data);
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
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(scores));
    } catch (error) {
        console.error("Failed to save score to localStorage", error);
    }
};

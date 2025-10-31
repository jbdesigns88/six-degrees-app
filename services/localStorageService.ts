import { Score, Rating } from '../types';

const USERNAME_KEY = 'six-degrees-username';
const LEADERBOARD_KEY = 'six-degrees-leaderboard';
const RATING_KEY = 'six-degrees-rating';
const STARTING_RATING = 1000;

// User Management
export const getUsername = (): string | null => {
    return localStorage.getItem(USERNAME_KEY);
};

export const setUsername = (name: string) => {
    localStorage.setItem(USERNAME_KEY, name);
};

export const clearUsername = () => {
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(RATING_KEY);
};

// Player Rating Management
export const getPlayerRating = (username: string): Rating => {
    const data = localStorage.getItem(RATING_KEY);
    if (data) {
        try {
            const ratings: { [key: string]: number } = JSON.parse(data);
            if (ratings[username]) {
                return { username, rating: ratings[username] };
            }
        } catch (e) {
            console.error("Failed to parse ratings", e);
        }
    }
    // If no rating found for user, initialize it
    const newRating = { username, rating: STARTING_RATING };
    setPlayerRating(newRating);
    return newRating;
}

export const setPlayerRating = (rating: Rating) => {
    const data = localStorage.getItem(RATING_KEY);
    let ratings: { [key: string]: number } = {};
    if (data) {
        try {
            ratings = JSON.parse(data);
        } catch (e) { console.error("Failed to parse ratings on set", e); }
    }
    ratings[rating.username] = Math.max(100, Math.min(3000, rating.rating));
    localStorage.setItem(RATING_KEY, JSON.stringify(ratings));
}


// Leaderboard Management
export const getLeaderboard = (): Score[] => {
    try {
        const data = localStorage.getItem(LEADERBOARD_KEY);
        if (data) {
            const scores: Score[] = JSON.parse(data);
            return scores.sort((a, b) => {
                if (a.degrees !== b.degrees) return a.degrees - b.degrees;
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
        const sortedScores = scores.sort((a, b) => {
            if (a.degrees !== b.degrees) return a.degrees - b.degrees;
            return a.time - b.time;
        }).slice(0, 100);

        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(sortedScores));
    } catch (error) {
        console.error("Failed to save score to localStorage", error);
    }
};

export const getRatingsForLeaderboard = (): Rating[] => {
    const data = localStorage.getItem(RATING_KEY);
    if (!data) return [];
    try {
        const ratings: { [key: string]: number } = JSON.parse(data);
        return Object.entries(ratings)
            .map(([username, rating]) => ({ username, rating }))
            .sort((a, b) => b.rating - a.rating);
    } catch (e) {
        return [];
    }
};

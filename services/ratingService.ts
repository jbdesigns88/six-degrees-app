import { Rank } from '../types';

export const RANKS: Rank[] = [
    { title: "Cinematic Genius", icon: "👑", minRating: 2500 },
    { title: "Hollywood Strategist", icon: "🏆", minRating: 2000 },
    { title: "Six Degrees Master", icon: "🦸", minRating: 1600 },
    { title: "Script Analyst", icon: "🧠", minRating: 1200 },
    { title: "Scene Seeker", icon: "🎥", minRating: 800 },
    { title: "Film Enthusiast", icon: "🍿", minRating: 400 },
    { title: "Movie Intern", icon: "🎬", minRating: 100 }
];

export const getRank = (rating: number): Rank => {
    return RANKS.find(r => rating >= r.minRating) || RANKS[RANKS.length - 1];
};

export const getCpuRating = (difficulty: 'Casual' | 'Pro'): number => {
    // Assign a fixed rating to CPU for calculation purposes
    return difficulty === 'Casual' ? 800 : 1400;
};

export const calculateRatingChange = (
    playerRating: number,
    opponentRating: number,
    didPlayerWin: boolean
): number => {
    const ratingDifference = opponentRating - playerRating;
    let pointsChange: number;

    if (didPlayerWin) {
        if (ratingDifference >= 100) { // Won against higher-rated
            pointsChange = Math.floor(30 + (ratingDifference - 100) * 0.05);
        } else if (ratingDifference <= -100) { // Won against lower-rated
            pointsChange = 10;
        } else { // Won against similar-rated
            pointsChange = 20;
        }
    } else { // Player lost
        if (ratingDifference >= 100) { // Lost against higher-rated
            pointsChange = -10;
        } else if (ratingDifference <= -100) { // Lost against lower-rated
            pointsChange = Math.floor(-30 - (Math.abs(ratingDifference) - 100) * 0.05);
        } else { // Lost against similar-rated
            pointsChange = -20;
        }
    }
    
    return Math.max(-40, Math.min(40, pointsChange));
};

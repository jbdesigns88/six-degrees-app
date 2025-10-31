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

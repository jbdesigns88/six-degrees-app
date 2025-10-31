
export interface Actor {
    id: number;
    type: 'actor';
    name: string;
    imageUrl: string;
}

export interface Movie {
    id: number;
    type: 'movie';
    title: string;
    imageUrl: string;
}

export type ConnectionNodeData = Actor | Movie;

export type GameMode = 'solo' | 'cpu' | 'online';
export type CpuDifficulty = 'Casual' | 'Pro';

export type LossReason = 'cpu_won' | 'opponent_won' | 'time_up' | 'too_many_steps';

export type View = 'login' | 'start' | 'game' | 'end' | 'leaderboard' | 'profile' | 'settings' | 'howToPlay' | 'lobby' | 'waiting';

export interface Score {
    username: string;
    degrees: number;
    time: number;
}

export interface Rating {
    username: string;
    rating: number;
}

export interface Rank {
    title: string;
    icon: string;
    minRating: number;
}

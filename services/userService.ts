import { UserProfile } from '../types';

const API_BASE_URL = '/api';

export const loginOrRegister = async (username: string): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
    });
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to login or register: ${errorData}`);
    }
    return response.json();
};

export const getLeaderboard = async (): Promise<UserProfile[]> => {
    const response = await fetch(`${API_BASE_URL}/users/leaderboard`);
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch leaderboard: ${errorData}`);
    }
    return response.json();
};

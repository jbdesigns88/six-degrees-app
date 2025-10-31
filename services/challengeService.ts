const API_BASE_URL = '/api';

export const createChallenge = async (challengeId: string, startId: number, targetId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/challenge/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ challengeId, startId, targetId }),
    });
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create challenge: ${errorData}`);
    }
};

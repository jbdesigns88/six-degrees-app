
const USERNAME_KEY = 'six-degrees-username';

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

// This is a mock socket service to simulate real-time communication
// between two players in different browser tabs.
// It uses BroadcastChannel to send messages.

const CHANNEL_NAME = 'six-degrees-game';
const channel = new BroadcastChannel(CHANNEL_NAME);

type EventCallback = (data: any) => void;

const listeners: { [key: string]: EventCallback[] } = {};

channel.onmessage = (event) => {
  const { type, data } = event.data;
  if (listeners[type]) {
    listeners[type].forEach(callback => callback(data));
  }
};

const on = (eventType: string, callback: EventCallback) => {
  if (!listeners[eventType]) {
    listeners[eventType] = [];
  }
  listeners[eventType].push(callback);

  // Return an unsubscribe function
  return () => {
    listeners[eventType] = listeners[eventType].filter(cb => cb !== callback);
  };
};

const emit = (eventType: string, data: any) => {
  channel.postMessage({ type: eventType, data });
};

const off = (eventType: string) => {
    delete listeners[eventType];
};


export const socketService = {
  on,
  emit,
  off,
};

// --- Mocking other players in the lobby ---
const MOCK_PLAYERS = [
    { username: 'CinephileCarl', rating: 1350 },
    { username: 'PopcornPenny', rating: 820 },
    { username: 'MovieMavenMary', rating: 1800 },
];

// This function simulates another player accepting a challenge
export const simulateOpponent = (currentUser: string) => {
    const onChallenge = (challenge: any) => {
        // Don't accept our own challenges
        if (challenge.from === currentUser) return;

        console.log(`Simulated opponent is considering challenge from ${challenge.from}`);
        // Randomly decide to accept
        if (Math.random() > 0.3) {
            const opponent = MOCK_PLAYERS[Math.floor(Math.random() * MOCK_PLAYERS.length)];
            console.log(`${opponent.username} accepts the challenge!`);
            setTimeout(() => {
                emit('challenge:accepted', {
                    challengeId: challenge.id,
                    acceptedBy: opponent.username,
                    acceptedByRating: opponent.rating,
                });
            }, 1500);
        }
    };
    
    const unsubscribe = on('challenge:new', onChallenge);

    // Return a cleanup function
    return () => unsubscribe();
};

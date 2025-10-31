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

export type GameMode = 'solo' | 'cpu';

export interface GameState {
  path: ConnectionNodeData[];
  choices: ConnectionNodeData[];
  target: Actor;
  start: Actor;
  isPlayerTurn: boolean;
  gameStatus: 'start' | 'playing' | 'win' | 'lose';
  loading: boolean;
  cpuThinking: boolean;
  elapsedTime: number;
}

export interface Score {
  playerName: string;
  degrees: number;
  time: number;
  date: string;
}

export type LossReason = 'cpu_won' | 'time_up' | 'too_many_steps';
import React from 'react';
import { ConnectionNodeData, Actor } from '../types';
import ConnectionNode from './ConnectionNode';
import LinkIcon from './icons/LinkIcon';
import { LossReason } from '../types';

interface EndScreenProps {
  win: boolean;
  lossReason: LossReason | null;
  path: ConnectionNodeData[];
  cpuPath: ConnectionNodeData[];
  onPlayAgain: () => void;
  elapsedTime: number;
  target: Actor;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const PathDisplay: React.FC<{ title: string, path: ConnectionNodeData[], target: Actor }> = ({ title, path, target }) => (
    <div className="flex flex-col items-center mb-6 bg-gray-800/50 p-4 rounded-lg w-full">
       <h2 className="text-xl font-bold text-amber-300 mb-3">{title}</h2>
       {path.length > 0 ? (
         <div className="flex items-center overflow-x-auto p-2 snap-x snap-mandatory space-x-2 w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {path.map((node, index) => (
                <React.Fragment key={`${node.type}-${node.id}-${index}`}>
                    <div className="snap-center">
                        <ConnectionNode data={node} isFirst={index === 0} isLast={node.type === 'actor' && node.id === target.id} />
                    </div>
                    {index < path.length - 1 && <LinkIcon />}
                </React.Fragment>
            ))}
        </div>
       ) : <p className="text-gray-400">No connection made.</p>}
   </div>
);


const EndScreen: React.FC<EndScreenProps> = ({ win, lossReason, path, cpuPath, onPlayAgain, elapsedTime, target }) => {
  const playerDegrees = Math.floor((path.length - 1) / 2);
  const cpuDegrees = Math.floor((cpuPath.length - 1) / 2);

  const getEndGameMessage = () => {
      if (win) {
          return {
              title: "You Win!",
              subtitle: `Congratulations! You found the connection in ${playerDegrees} degrees.`,
              titleClass: "text-green-400"
          };
      }
      switch (lossReason) {
          case 'cpu_won':
              return {
                  title: "CPU Wins!",
                  subtitle: `The CPU found the connection in ${cpuDegrees} degrees before you did.`,
                  titleClass: "text-red-500"
              };
          case 'time_up':
              return {
                  title: "Time's Up!",
                  subtitle: "You couldn't find the connection in time.",
                  titleClass: "text-yellow-500"
              };
          case 'too_many_steps':
               return {
                  title: "Game Over",
                  subtitle: "You've reached the maximum number of connections.",
                  titleClass: "text-red-500"
              };
          default:
              return {
                  title: "Game Over",
                  subtitle: "Better luck next time!",
                  titleClass: "text-red-500"
              };
      }
  };

  const { title, subtitle, titleClass } = getEndGameMessage();
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-900 text-white overflow-y-auto">
      <div className="text-center my-6">
        <h1 className={`text-5xl font-extrabold mb-2 ${titleClass}`}>
          {title}
        </h1>
        <p className="text-lg text-gray-300">{subtitle}</p>
      </div>

       <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
            <PathDisplay title="Your Final Path" path={path} target={target} />
            <PathDisplay title="CPU's Final Path" path={cpuPath} target={target} />
       </div>
        
        <div className="flex gap-4 items-center my-6 text-center text-lg">
            <div className="bg-gray-800 p-3 rounded-lg min-w-[90px]">
                <div className="text-sm text-gray-400">You</div>
                <div className="text-2xl font-bold text-cyan-400">{playerDegrees}</div>
                 <div className="text-xs text-gray-500">degrees</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg min-w-[90px]">
                <div className="text-sm text-gray-400">Time</div>
                <div className="text-2xl font-bold text-cyan-400">{formatTime(elapsedTime)}</div>
                <div className="text-xs text-gray-500">final</div>
            </div>
             <div className="bg-gray-800 p-3 rounded-lg min-w-[90px]">
                <div className="text-sm text-gray-400">CPU</div>
                <div className="text-2xl font-bold text-cyan-400">{cpuDegrees}</div>
                <div className="text-xs text-gray-500">degrees</div>
            </div>
        </div>


      <button
        onClick={onPlayAgain}
        className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300 mb-6"
      >
        Play Again
      </button>
    </div>
  );
};

export default EndScreen;
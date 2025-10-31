import React from 'react';

interface ConnectionNodeSkeletonProps {
  isFirst?: boolean;
  isLast?: boolean;
}

const ConnectionNodeSkeleton: React.FC<ConnectionNodeSkeletonProps> = ({ isFirst, isLast }) => {
  const cardClasses = `
    relative w-full aspect-[2/3] flex-shrink-0 bg-gray-800 rounded-lg overflow-hidden 
    shadow-lg shadow-black/50 animate-pulse
    ${isLast ? 'border-2 border-amber-400' : 'border-2 border-transparent'}
    ${isFirst ? 'border-2 border-cyan-400' : ''}
  `;

  return (
    <div className={cardClasses}>
      <div className="absolute inset-0 bg-gray-700"></div>
       {(isFirst || isLast) && (
        <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-full ${isFirst ? 'bg-cyan-500/50' : 'bg-amber-500/50'} text-gray-900/50`}>
          {isFirst ? 'START' : 'TARGET'}
        </div>
      )}
    </div>
  );
};

export default ConnectionNodeSkeleton;

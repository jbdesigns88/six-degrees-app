import React, { useState } from 'react';
import { ConnectionNodeData } from '../types';

interface ConnectionNodeProps {
  data: ConnectionNodeData;
  isFirst?: boolean;
  isLast?: boolean;
}

const ConnectionNode: React.FC<ConnectionNodeProps> = ({ data, isFirst, isLast }) => {
  const isActor = data.type === 'actor';
  const name = isActor ? data.name : data.title;
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const placeholderUrl = `https://via.placeholder.com/224x320/1f2937/4b5563?text=${encodeURIComponent(name)}`;
  
  const cardClasses = `
    relative w-full aspect-[2/3] flex-shrink-0 bg-gray-800 rounded-lg overflow-hidden 
    shadow-lg shadow-black/50 transition-all duration-500 ease-in-out transform
    hover:scale-105 hover:shadow-amber-500/30
    ${isLast ? 'border-2 border-amber-400' : 'border-2 border-transparent'}
    ${isFirst ? 'border-2 border-cyan-400' : ''}
  `;

  return (
    <div className={cardClasses} role="group" aria-label={`${data.type}: ${name}`}>
       {!isImageLoaded && (
        <div className="absolute inset-0 bg-gray-700 animate-pulse"></div>
      )}
      <img 
        src={data.imageUrl} 
        alt={name} 
        className={`w-full h-full object-cover transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsImageLoaded(true)}
        onError={(e) => {
          e.currentTarget.src = placeholderUrl;
          setIsImageLoaded(true);
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-3 w-full">
        <p className="text-white font-bold text-sm md:text-base leading-tight drop-shadow-lg">{name}</p>
        <p className="text-xs text-amber-300 capitalize drop-shadow-lg">{data.type}</p>
      </div>
       {(isFirst || isLast) && (
        <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-full ${isFirst ? 'bg-cyan-500' : 'bg-amber-500'} text-gray-900`}>
          {isFirst ? 'START' : 'TARGET'}
        </div>
      )}
    </div>
  );
};

export default ConnectionNode;
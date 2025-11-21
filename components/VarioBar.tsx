import React from 'react';

interface VarioBarProps {
  value: number; // m/s
}

const VarioBar: React.FC<VarioBarProps> = ({ value }) => {
  // Max range for display is +/- 5 m/s
  const MAX_RANGE = 5;
  const clampedValue = Math.max(-MAX_RANGE, Math.min(MAX_RANGE, value));
  
  // Convert to percentage (0 to 100)
  // 0 m/s should be 50%
  // +5 m/s should be 0% (top)
  // -5 m/s should be 100% (bottom)
  // Wait, standard CSS height goes down. 
  // Let's position an absolute bar relative to center.
  
  const isClimbing = value > 0;
  const heightPercent = Math.abs(clampedValue / MAX_RANGE) * 50;
  
  return (
    <div className="h-full w-8 bg-gray-900 rounded-full relative overflow-hidden border border-gray-800">
        {/* Center Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white opacity-30 transform -translate-y-1/2 z-10"></div>
        
        {/* The Bar */}
        <div 
            className={`absolute w-full transition-all duration-300 ease-out ${isClimbing ? 'bg-lime-400 bottom-1/2' : 'bg-red-500 top-1/2'}`}
            style={{ height: `${heightPercent}%` }}
        />

        {/* Ticks */}
        {[1, 2, 3, 4].map((tick) => (
            <React.Fragment key={tick}>
                {/* Upper Ticks */}
                <div className="absolute w-2 h-px bg-gray-600 right-0" style={{ top: `${50 - (tick/5)*50}%` }} />
                {/* Lower Ticks */}
                <div className="absolute w-2 h-px bg-gray-600 right-0" style={{ top: `${50 + (tick/5)*50}%` }} />
            </React.Fragment>
        ))}
    </div>
  );
};

export default VarioBar;
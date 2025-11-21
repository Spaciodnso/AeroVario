import React from 'react';
import { FlightData } from '../types';
import VarioBar from './VarioBar';
import { Volume2, VolumeX, RotateCcw, Settings, StopCircle } from 'lucide-react';

interface Props {
  data: FlightData;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetAlt: () => void;
  onStopFlight: () => void;
  onOpenSettings: () => void;
  activeAlert: string | null; // Message to display if alert is active
}

const InstrumentPanel: React.FC<Props> = ({ 
    data, 
    isMuted, 
    onToggleMute, 
    onResetAlt,
    onStopFlight,
    onOpenSettings,
    activeAlert
}) => {
  const isClimbing = data.vario > 0;
  const isSinking = data.vario < -0.5;
  
  let varioColor = "text-white";
  if (data.vario > 0.1) varioColor = "text-lime-400";
  if (data.vario < -0.1) varioColor = "text-red-500";

  return (
    <div className="flex flex-col h-full w-full p-4 gap-4 relative">
      
      {/* Alert Overlay */}
      {activeAlert && (
          <div className="absolute top-20 left-0 w-full z-50 px-4">
              <div className="bg-red-500 text-black font-bold p-3 rounded-xl text-center animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.6)] border-2 border-red-400">
                  ⚠️ {activeAlert}
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <button onClick={onOpenSettings} className="p-2 rounded-full bg-gray-900 active:bg-gray-800 border border-gray-700">
             <Settings size={20} className="text-gray-400" />
        </button>
        
        <div className="flex items-center gap-2">
            <span className={data.accuracy < 15 ? "text-green-500" : "text-yellow-500"}>
                GPS ±{data.accuracy}m
            </span>
        </div>
        
        <button onClick={onToggleMute} className="p-2 rounded-full bg-gray-900 active:bg-gray-800 border border-gray-700">
            {isMuted ? <VolumeX size={20} className="text-gray-400" /> : <Volume2 size={20} className="text-lime-400" />}
        </button>
      </div>

      {/* Main Vario Display */}
      <div className="flex flex-1 gap-4">
        <div className="w-10 py-2">
            <VarioBar value={data.vario} />
        </div>

        <div className="flex-1 flex flex-col justify-center items-center bg-gray-900/50 rounded-xl border border-gray-800/50 relative overflow-hidden">
            <span className="text-gray-400 text-sm uppercase tracking-widest absolute top-4">Vario m/s</span>
            <span className={`text-8xl font-bold font-mono tracking-tighter z-10 ${varioColor}`}>
                {data.vario > 0 ? '+' : ''}{data.vario.toFixed(1)}
            </span>
            {isClimbing && <div className="absolute inset-0 bg-lime-500/10 blur-2xl"></div>}
            {isSinking && <div className="absolute inset-0 bg-red-500/10 blur-2xl"></div>}
        </div>
      </div>

      {/* Secondary Instruments */}
      <div className="grid grid-cols-2 gap-4 h-1/3">
        <div className="bg-gray-900 rounded-xl p-4 flex flex-col justify-between border border-gray-800 relative group">
            <div className="flex justify-between items-start">
                <span className="text-gray-400 text-xs uppercase">Alt MSL</span>
                <button onClick={onResetAlt} className="text-gray-600 active:text-white">
                    <RotateCcw size={14} />
                </button>
            </div>
            <div className="text-right">
                <div className="text-4xl font-mono font-bold text-white">{data.altitude}</div>
                <div className="text-xs text-gray-500">m</div>
            </div>
            <div className="absolute bottom-4 left-4 text-gray-500 text-xs font-mono">
               Rel: {data.relativeAltitude}m
            </div>
        </div>

        <div className="flex flex-col gap-4">
            <div className="bg-gray-900 rounded-xl p-3 flex-1 flex flex-col justify-between border border-gray-800">
                <span className="text-gray-400 text-xs uppercase">Speed (km/h)</span>
                <div className="text-right text-3xl font-mono font-bold text-white">
                    {data.speed}
                </div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-3 flex-1 flex flex-col justify-between border border-gray-800">
                <span className="text-gray-400 text-xs uppercase">Glide (L/D)</span>
                <div className="text-right text-3xl font-mono font-bold text-white">
                    {isFinite(data.glideRatio) && data.glideRatio > 0 ? data.glideRatio : '--'}
                </div>
            </div>
        </div>
      </div>
      
      {/* Stop Flight Button */}
      <button 
        onClick={onStopFlight}
        className="w-full py-3 bg-red-900/30 border border-red-900/50 text-red-400 rounded-xl flex items-center justify-center gap-2 font-bold text-sm active:scale-95 transition-transform"
      >
          <StopCircle size={18} />
          END FLIGHT
      </button>
      
    </div>
  );
};

export default InstrumentPanel;


import React, { useState } from 'react';
import { FlightLog } from '../types';
import { X, Calendar, Clock, ArrowUp, ArrowDown, Map } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logs: FlightLog[];
}

const LogbookModal: React.FC<Props> = ({ isOpen, onClose, logs }) => {
  const [selectedLog, setSelectedLog] = useState<FlightLog | null>(null);

  if (!isOpen) return null;

  // Format date helper
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  // Format duration helper
  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60); // Ensure integer
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col safe-area-inset">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar size={20} className="text-lime-400" />
          Flight Logbook
        </h2>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-full">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <p>No flights recorded yet.</p>
            <p className="text-xs mt-2">Complete a flight to see it here.</p>
          </div>
        ) : selectedLog ? (
          // Detail View
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button 
                onClick={() => setSelectedLog(null)}
                className="text-sm text-lime-400 mb-4 flex items-center gap-1"
            >
                ← Back to list
            </button>
            
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <div className="text-2xl font-bold text-white mb-1">{formatDate(selectedLog.date)}</div>
                <div className="text-gray-400 text-sm mb-6">ID: {selectedLog.id.slice(0, 8)}</div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                        <div className="text-gray-500 text-xs uppercase mb-1 flex items-center gap-1"><Clock size={12}/> Duration</div>
                        <div className="text-xl font-mono text-white">{formatDuration(selectedLog.durationSeconds)}</div>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                        <div className="text-gray-500 text-xs uppercase mb-1 flex items-center gap-1"><Map size={12}/> Distance</div>
                        <div className="text-xl font-mono text-white">{selectedLog.distanceKm.toFixed(1)} km</div>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                        <div className="text-gray-500 text-xs uppercase mb-1 flex items-center gap-1"><ArrowUp size={12}/> Max Alt</div>
                        <div className="text-xl font-mono text-white">{selectedLog.maxAltitude} m</div>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                        <div className="text-gray-500 text-xs uppercase mb-1 flex items-center gap-1"><ArrowDown size={12}/> Max Sink</div>
                        <div className="text-xl font-mono text-red-400">{selectedLog.maxSink.toFixed(1)} m/s</div>
                    </div>
                </div>
            </div>
          </div>
        ) : (
          // List View
          <div className="space-y-3">
            {logs.slice().reverse().map(log => (
              <div 
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="bg-gray-900 hover:bg-gray-800 active:bg-gray-800 p-4 rounded-xl border border-gray-800 flex justify-between items-center cursor-pointer transition-colors"
              >
                <div>
                    <div className="font-bold text-white">{formatDate(log.date)}</div>
                    <div className="text-xs text-gray-500 mt-1 flex gap-3">
                        <span>{formatDuration(log.durationSeconds)}</span>
                        <span>Max: {log.maxAltitude}m</span>
                    </div>
                </div>
                <div className="text-lime-400">
                    →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogbookModal;

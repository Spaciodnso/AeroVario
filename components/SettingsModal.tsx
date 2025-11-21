
import React from 'react';
import { AlertConfig } from '../types';
import { X, Bell, AlertTriangle, Music } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertConfig[];
  onUpdateAlert: (id: string, updates: Partial<AlertConfig>) => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, alerts, onUpdateAlert }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell size={20} className="text-lime-400" />
            Alert Settings
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className={alert.enabled ? "text-lime-400" : "text-gray-500"} />
                  <span className="font-medium text-gray-200">
                    {alert.type === 'ALTITUDE_LOW' ? 'Low Altitude' : 'Severe Sink'}
                  </span>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input 
                        type="checkbox" 
                        name="toggle" 
                        id={alert.id} 
                        checked={alert.enabled}
                        onChange={(e) => onUpdateAlert(alert.id, { enabled: e.target.checked })}
                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-lime-400"
                    />
                    <label 
                        htmlFor={alert.id} 
                        className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${alert.enabled ? 'bg-lime-400' : 'bg-gray-600'}`}
                    ></label>
                </div>
              </div>

              <div className="space-y-4">
                {alert.type === 'ALTITUDE_LOW' && (
                   <div>
                     <label className="text-xs text-gray-400 uppercase block mb-1">Trigger below (meters)</label>
                     <input 
                        type="number" 
                        value={alert.threshold}
                        onChange={(e) => onUpdateAlert(alert.id, { threshold: Number(e.target.value) })}
                        className="w-full bg-black border border-gray-600 rounded-lg p-2 text-white font-mono focus:border-lime-400 outline-none"
                     />
                   </div>
                )}

                {alert.type === 'SINK_RATE' && (
                    <>
                       <div>
                        <label className="text-xs text-gray-400 uppercase block mb-1">Trigger sink rate (m/s)</label>
                        <input 
                            type="number" 
                            step="0.1"
                            max="0"
                            value={alert.threshold}
                            onChange={(e) => onUpdateAlert(alert.id, { threshold: Number(e.target.value) })}
                            className="w-full bg-black border border-gray-600 rounded-lg p-2 text-white font-mono focus:border-lime-400 outline-none"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Use negative values (e.g. -3.0)</p>
                       </div>
                       <div>
                        <label className="text-xs text-gray-400 uppercase block mb-1">Duration Threshold (seconds)</label>
                        <input 
                            type="number" 
                            min="1"
                            value={alert.duration}
                            onChange={(e) => onUpdateAlert(alert.id, { duration: Number(e.target.value) })}
                            className="w-full bg-black border border-gray-600 rounded-lg p-2 text-white font-mono focus:border-lime-400 outline-none"
                        />
                       </div>
                    </>
                )}

                {/* Sound Selection */}
                <div>
                   <label className="text-xs text-gray-400 uppercase block mb-1 flex items-center gap-1">
                      <Music size={10} /> Alert Sound
                   </label>
                   <select 
                      value={alert.sound} 
                      onChange={(e) => onUpdateAlert(alert.id, { sound: e.target.value as any })}
                      className="w-full bg-black border border-gray-600 rounded-lg p-2 text-white text-sm focus:border-lime-400 outline-none appearance-none cursor-pointer"
                   >
                      <option value="siren">Siren</option>
                      <option value="beep">Double Beep</option>
                      <option value="whoop">Whoop</option>
                      <option value="flatline">Flatline</option>
                   </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

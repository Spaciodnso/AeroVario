
import React, { useState, useEffect, useRef } from 'react';
import { FlightData, FlightState, AlertConfig, FlightLog, ActiveFlightStats, AlertSoundType } from './types';
import { FlightComputer } from './services/flightComputer';
import { AudioSynthesizer } from './services/audioSynthesizer';
import InstrumentPanel from './components/InstrumentPanel';
import SettingsModal from './components/SettingsModal';
import LogbookModal from './components/LogbookModal';
import { Play, History } from 'lucide-react';

const flightComputer = new FlightComputer();
const audioSynth = new AudioSynthesizer();

// Default Alerts
const DEFAULT_ALERTS: AlertConfig[] = [
  { id: 'low_alt', enabled: false, type: 'ALTITUDE_LOW', threshold: 1000, sound: 'beep' },
  { id: 'sink_alarm', enabled: true, type: 'SINK_RATE', threshold: -2.5, duration: 5, sound: 'siren' }
];

const App: React.FC = () => {
  // --- State ---
  const [flightState, setFlightState] = useState<FlightState>(FlightState.IDLE);
  const [data, setData] = useState<FlightData>({
    altitude: 0,
    relativeAltitude: 0,
    vario: 0,
    speed: 0,
    heading: 0,
    glideRatio: 0,
    accuracy: 0
  });
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Features State
  const [showSettings, setShowSettings] = useState(false);
  const [showLogbook, setShowLogbook] = useState(false);
  const [alerts, setAlerts] = useState<AlertConfig[]>(() => {
      const saved = localStorage.getItem('aero_alerts');
      if (saved) {
        // Migration for old saved settings without sound
        const parsed = JSON.parse(saved);
        return parsed.map((a: any) => ({ ...a, sound: a.sound || 'siren' }));
      }
      return DEFAULT_ALERTS;
  });
  const [flightLogs, setFlightLogs] = useState<FlightLog[]>(() => {
      const saved = localStorage.getItem('aero_flight_logs');
      return saved ? JSON.parse(saved) : [];
  });
  const [activeAlertMsg, setActiveAlertMsg] = useState<string | null>(null);

  // --- Refs for Logic ---
  const watchId = useRef<number | null>(null);
  const alertStateRef = useRef<{ sinkStartTime: number | null, lastAlertTime: number }>({
      sinkStartTime: null,
      lastAlertTime: 0
  });
  const activeFlightStats = useRef<ActiveFlightStats | null>(null);

  // --- Effects ---

  // Persist settings
  useEffect(() => {
      localStorage.setItem('aero_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Persist logs
  useEffect(() => {
      localStorage.setItem('aero_flight_logs', JSON.stringify(flightLogs));
  }, [flightLogs]);

  // Audio Loop & Alert Logic
  useEffect(() => {
    if (flightState === FlightState.FLYING) {
      audioSynth.setMute(isMuted);
      
      // Check Alerts
      const alertResult = checkAlerts(data);
      setActiveAlertMsg(alertResult?.msg || null);

      if (alertResult) {
          // Throttled alert sound
          const now = Date.now();
          if (now - alertStateRef.current.lastAlertTime > 2000) { // every 2s
              audioSynth.playAlert(alertResult.sound);
              alertStateRef.current.lastAlertTime = now;
          }
      } else {
          audioSynth.update(data.vario);
      }

      // Record Stats
      updateFlightStats(data);

    } else {
      audioSynth.stopTone();
      setActiveAlertMsg(null);
    }
  }, [data, isMuted, flightState, alerts]);

  // --- Logic Methods ---

  const checkAlerts = (d: FlightData): { msg: string, sound: AlertSoundType } | null => {
      const now = Date.now();

      for (const alert of alerts) {
          if (!alert.enabled) continue;

          if (alert.type === 'ALTITUDE_LOW') {
              if (d.altitude < alert.threshold && d.altitude > 0) { 
                  return { msg: `LOW ALTITUDE (< ${alert.threshold}m)`, sound: alert.sound };
              }
          }

          if (alert.type === 'SINK_RATE') {
              if (d.vario < alert.threshold) { // Threshold is negative e.g. -3
                  if (!alertStateRef.current.sinkStartTime) {
                      alertStateRef.current.sinkStartTime = now;
                  } else {
                      const duration = (now - alertStateRef.current.sinkStartTime) / 1000;
                      if (duration > (alert.duration || 0)) {
                          return { msg: `SINK ALARM (${d.vario.toFixed(1)} m/s)`, sound: alert.sound };
                      }
                  }
              } else {
                  if (d.vario > alert.threshold) { 
                     alertStateRef.current.sinkStartTime = null;
                  }
              }
          }
      }
      return null;
  };

  const updateFlightStats = (d: FlightData) => {
      if (!activeFlightStats.current) return;
      
      const stats = activeFlightStats.current;
      stats.maxAltitude = Math.max(stats.maxAltitude, d.altitude);
      stats.maxClimb = Math.max(stats.maxClimb, d.vario);
      stats.maxSink = Math.min(stats.maxSink, d.vario);
      
      // Add position point every 5 seconds to save space
      if (d.latitude && d.longitude) {
          const lastPos = stats.positions[stats.positions.length - 1];
          if (!lastPos || (Math.abs(lastPos.lat - d.latitude) + Math.abs(lastPos.lon - d.longitude) > 0.0001)) {
              stats.positions.push({ lat: d.latitude, lon: d.longitude });
          }
      }
  };

  const startFlight = async () => {
    setErrorMsg(null);
    
    // Permission request wrapper
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const ps = await (DeviceMotionEvent as any).requestPermission();
        if (ps !== 'granted') setErrorMsg("Motion denied. Vario lagging.");
      } catch (e) { console.error(e); }
    }

    try { await audioSynth.init(); } catch (e) { console.error(e); }

    if ('geolocation' in navigator) {
      // Init Stats
      activeFlightStats.current = {
          startTime: Date.now(),
          maxAltitude: -9999,
          maxClimb: 0,
          maxSink: 0,
          positions: []
      };

      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newData = flightComputer.process(pos.coords, pos.timestamp);
          // Inject raw lat/lon for recording
          newData.latitude = pos.coords.latitude;
          newData.longitude = pos.coords.longitude;
          setData(newData);
        },
        (err) => setErrorMsg("GPS Lost"),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
      setFlightState(FlightState.FLYING);
    } else {
      setErrorMsg("No Geolocation support.");
    }
  };

  const stopFlight = () => {
      if (watchId.current !== null) {
          navigator.geolocation.clearWatch(watchId.current);
          watchId.current = null;
      }
      setFlightState(FlightState.IDLE);
      
      // Save Log
      if (activeFlightStats.current) {
          const s = activeFlightStats.current;
          const duration = (Date.now() - s.startTime) / 1000;
          
          // Basic distance approx from points
          const dist = s.positions.length > 1 ? s.positions.length * 0.05 : 0; 

          const newLog: FlightLog = {
              id: crypto.randomUUID(),
              date: s.startTime,
              durationSeconds: duration,
              maxAltitude: s.maxAltitude,
              maxClimb: s.maxClimb,
              maxSink: s.maxSink,
              distanceKm: dist 
          };
          
          if (duration > 60) { // Only save flights longer than 1 min
            setFlightLogs(prev => [...prev, newLog]);
          }
      }
      activeFlightStats.current = null;
  };

  // --- Handlers ---
  const handleUpdateAlert = (id: string, updates: Partial<AlertConfig>) => {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  if (flightState === FlightState.IDLE) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-lime-500/10 rounded-b-full blur-3xl"></div>
        
        <div className="z-10 text-center space-y-8 w-full max-w-sm">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold text-white tracking-tighter">AERO<span className="text-lime-400">VARIO</span></h1>
                <p className="text-gray-400 text-sm uppercase tracking-widest">Pro Flight Instrument</p>
            </div>

            <div className="space-y-4">
                <button 
                    onClick={startFlight}
                    className="w-full py-4 bg-lime-500 hover:bg-lime-400 active:scale-95 transition-all text-black font-bold text-lg rounded-xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(132,204,22,0.3)]"
                >
                    <Play fill="black" size={20} />
                    START FLIGHT
                </button>

                <button 
                    onClick={() => setShowLogbook(true)}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded-xl flex items-center justify-center gap-2 font-medium"
                >
                    <History size={18} />
                    Flight Logbook
                </button>
            </div>
            
            <p className="text-xs text-gray-600">
                {flightLogs.length} flights recorded locally.
            </p>
        </div>

        <LogbookModal 
            isOpen={showLogbook} 
            onClose={() => setShowLogbook(false)} 
            logs={flightLogs} 
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative font-sans select-none">
        {errorMsg && (
            <div className="absolute top-0 left-0 w-full bg-red-500/90 text-white text-xs p-2 text-center z-50 font-bold animate-pulse">
                ⚠️ {errorMsg}
            </div>
        )}
        
        <InstrumentPanel 
            data={data} 
            isMuted={isMuted} 
            onToggleMute={() => setIsMuted(!isMuted)}
            onResetAlt={() => flightComputer.resetTakeoff()}
            onStopFlight={stopFlight}
            onOpenSettings={() => setShowSettings(true)}
            activeAlert={activeAlertMsg}
        />

        <SettingsModal 
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            alerts={alerts}
            onUpdateAlert={handleUpdateAlert}
        />
    </div>
  );
};

export default App;

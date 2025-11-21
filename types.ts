
export interface FlightData {
  altitude: number; // MSL in meters
  relativeAltitude: number; // Above takeoff in meters
  vario: number; // Vertical speed in m/s
  speed: number; // Ground speed in km/h
  heading: number; // Compass heading 0-360
  glideRatio: number; // Calculated L/D
  accuracy: number; // GPS Accuracy in meters
  latitude?: number;
  longitude?: number;
}

export enum FlightState {
  IDLE = 'IDLE',
  FLYING = 'FLYING',
  ERROR = 'ERROR',
}

export interface SensorPermissions {
  geolocation: PermissionState | 'prompt' | 'unknown';
  motion: PermissionState | 'prompt' | 'unknown';
}

// --- New Types for Alerts & History ---

export type AlertSoundType = 'siren' | 'beep' | 'whoop' | 'flatline';

export interface AlertConfig {
  id: string;
  enabled: boolean;
  type: 'ALTITUDE_LOW' | 'SINK_RATE';
  threshold: number; // meters for altitude, m/s (negative) for sink
  duration?: number; // seconds (only for sink rate)
  sound: AlertSoundType;
}

export interface FlightLog {
  id: string;
  date: number; // timestamp
  durationSeconds: number;
  maxAltitude: number;
  maxClimb: number;
  maxSink: number;
  distanceKm: number; // Approximation
}

export interface ActiveFlightStats {
  startTime: number;
  maxAltitude: number;
  maxClimb: number;
  maxSink: number;
  positions: {lat: number, lon: number}[]; // simplified track
}

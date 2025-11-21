import { FlightData } from '../types';
import { KalmanFilter } from './kalmanFilter';

export class FlightComputer {
  private kalmanAlt: KalmanFilter;
  private takeoffAltitude: number | null = null;
  private lastTimestamp: number = 0;
  private lastLatitude: number | null = null;
  private lastLongitude: number | null = null;
  
  // History for smoothing Vario
  private altitudeHistory: { time: number; alt: number }[] = [];
  
  constructor() {
    // Kalman setup: 
    // R (Process Noise) - fairly low, we assume physics holds
    // Q (Measurement Noise) - High for GPS Altitude (it jumps +/- 10m)
    this.kalmanAlt = new KalmanFilter(1, 30); 
  }

  public process(
    coords: GeolocationCoordinates,
    timestamp: number
  ): FlightData {
    const rawAlt = coords.altitude || 0;
    const speedKmh = (coords.speed || 0) * 3.6; // m/s to km/h
    const heading = coords.heading || 0;
    const accuracy = coords.accuracy || 0;

    // 1. Filter Altitude
    // We treat time diff as our 'u' input if we had vertical accel, 
    // but for now we just filter the raw position.
    const filteredAlt = this.kalmanAlt.filter(rawAlt);

    // 2. Initialize Takeoff
    if (this.takeoffAltitude === null && accuracy < 20 && rawAlt !== 0) {
      this.takeoffAltitude = filteredAlt;
    }

    // 3. Calculate Vario (Vertical Speed)
    // We use Linear Regression over the last 2 seconds of data for stability
    this.pruneHistory(timestamp);
    this.altitudeHistory.push({ time: timestamp, alt: filteredAlt });
    
    const vario = this.calculateVarioRegression();

    // 4. Glide Ratio (Ground Speed / Sink Rate)
    // Avoid division by zero and positive vario
    let glide = 0;
    if (vario < -0.5 && speedKmh > 5) {
      const speedMs = speedKmh / 3.6;
      glide = Math.abs(speedMs / vario);
    }

    this.lastTimestamp = timestamp;
    this.lastLatitude = coords.latitude;
    this.lastLongitude = coords.longitude;

    return {
      altitude: Math.round(filteredAlt),
      relativeAltitude: this.takeoffAltitude ? Math.round(filteredAlt - this.takeoffAltitude) : 0,
      vario: parseFloat(vario.toFixed(1)),
      speed: Math.round(speedKmh),
      heading: Math.round(heading),
      glideRatio: parseFloat(glide.toFixed(1)),
      accuracy: Math.round(accuracy)
    };
  }

  private pruneHistory(currentTimestamp: number) {
    const WINDOW_MS = 2000; // 2 seconds window
    this.altitudeHistory = this.altitudeHistory.filter(
      p => currentTimestamp - p.time < WINDOW_MS
    );
  }

  private calculateVarioRegression(): number {
    if (this.altitudeHistory.length < 2) return 0;

    const n = this.altitudeHistory.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    // Normalize time to seconds relative to start of window to avoid huge numbers
    const t0 = this.altitudeHistory[0].time;

    for (let i = 0; i < n; i++) {
      const p = this.altitudeHistory[i];
      const x = (p.time - t0) / 1000; // Seconds
      const y = p.alt;
      
      sumX += x;
      sumY += y;
      sumXY += (x * y);
      sumXX += (x * x);
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  public resetTakeoff() {
    this.takeoffAltitude = this.kalmanAlt.filter(this.altitudeHistory[this.altitudeHistory.length - 1]?.alt || 0);
  }
}
/**
 * A specialized 1D Kalman Filter for sensor fusion.
 * Used to fuse noisy GPS altitude data with potential acceleration hints.
 */
export class KalmanFilter {
  private R: number; // Process noise covariance
  private Q: number; // Measurement noise covariance
  private A: number; // State vector
  private B: number; // Control vector
  private C: number; // Measurement vector

  private cov: number; // Covariance
  private x: number; // Value (State)

  constructor(R = 1, Q = 1, A = 1, B = 0, C = 1) {
    this.R = R; // Noise in the system
    this.Q = Q; // Noise in the measurement (GPS inaccuracy)
    this.A = A;
    this.B = B;
    this.C = C;

    this.cov = NaN;
    this.x = NaN;
  }

  /**
   * Filters a measurement
   * @param z The measurement value (e.g., raw GPS altitude)
   * @param u The control value (e.g., acceleration * dt, optional)
   * @returns The filtered value
   */
  filter(z: number, u: number = 0): number {
    if (isNaN(this.x)) {
      this.x = (1 / this.C) * z;
      this.cov = (1 / this.C) * this.Q * (1 / this.C);
    } else {
      // Prediction
      const predX = this.A * this.x + this.B * u;
      const predCov = this.A * this.cov * this.A + this.R;

      // Update
      const K = predCov * this.C * (1 / (this.C * predCov * this.C + this.Q));
      this.x = predX + K * (z - this.C * predX);
      this.cov = predCov - K * this.C * predCov;
    }
    return this.x;
  }

  /**
   * Reset the filter state
   */
  reset() {
    this.x = NaN;
    this.cov = NaN;
  }
}
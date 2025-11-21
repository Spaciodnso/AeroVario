
import { AlertSoundType } from "../types";

export class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private isMuted: boolean = false;
  private beepInterval: any = null;
  private isPlaying: boolean = false;

  constructor() {}

  public async init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
      this.gainNode.gain.value = 0;
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (mute) {
      this.stopTone();
    }
  }

  public playAlert(soundType: AlertSoundType = 'siren') {
    if (this.isMuted || !this.ctx || !this.gainNode) return;
    
    // Interrupt vario for alert
    this.stopTone(); 

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    gain.connect(this.ctx.destination);
    osc.connect(gain);

    if (soundType === 'siren') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
        osc.frequency.linearRampToValueAtTime(800, now + 0.6);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);

        osc.start(now);
        osc.stop(now + 0.6);
    } else if (soundType === 'beep') {
        osc.type = 'square';
        osc.frequency.value = 1500;
        
        // Double Beep pattern
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.setValueAtTime(0, now + 0.1);
        gain.gain.setValueAtTime(0.3, now + 0.2);
        gain.gain.setValueAtTime(0, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (soundType === 'whoop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
        
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        osc.start(now);
        osc.stop(now + 0.4);
    } else if (soundType === 'flatline') {
        osc.type = 'sawtooth';
        osc.frequency.value = 150;
        
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.8);
        
        osc.start(now);
        osc.stop(now + 0.8);
    }
  }

  public update(vario: number) {
    if (this.isMuted || !this.ctx) return;

    // Thresholds
    const CLIMB_THRESHOLD = 0.2; // m/s
    const SINK_THRESHOLD = -2.0; // m/s

    if (vario > CLIMB_THRESHOLD) {
      this.playClimbTone(vario);
    } else if (vario < SINK_THRESHOLD) {
      this.playSinkTone();
    } else {
      this.stopTone();
    }
  }

  private playClimbTone(vario: number) {
    if (this.beepInterval) return; // Already looping

    // Calculate physics for beep
    // Higher vario = Higher pitch, Faster cadence, Shorter duration
    const baseFreq = 400;
    const frequency = Math.min(baseFreq + (vario * 100), 1200);
    
    // Cadence (ms between beeps)
    const intervalDuration = Math.max(600 - (vario * 100), 120);
    const beepLength = intervalDuration * 0.5; // 50% duty cycle

    const loop = () => {
        if(this.isMuted) return;
        // Re-calculate freq based on latest vario would happen here in a full loop
        this.beep(frequency, beepLength / 1000);
    };
    
    this.stopTone(); // Clear previous
    this.isPlaying = true;
    this.triggerBeepSequence(frequency, intervalDuration);
  }

  private triggerBeepSequence(freq: number, durationMs: number) {
      if(this.beepInterval) clearInterval(this.beepInterval);

      const pulse = () => {
          this.beep(freq, (durationMs * 0.6) / 1000); 
      }
      
      pulse(); // First one
      this.beepInterval = setInterval(pulse, durationMs);
  }

  private playSinkTone() {
    if (this.isPlaying && !this.beepInterval) return; // Already playing sink tone

    this.stopTone();
    this.isPlaying = true;
    
    if (!this.ctx || !this.gainNode) return;

    this.oscillator = this.ctx.createOscillator();
    this.oscillator.type = 'sawtooth';
    this.oscillator.frequency.setValueAtTime(200, this.ctx.currentTime); // Low pitch
    
    // Modulation for "Alarm" feel
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 5; // 5Hz wobble
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 50;
    lfo.connect(lfoGain);
    lfoGain.connect(this.oscillator.frequency);
    lfo.start();

    this.oscillator.connect(this.gainNode);
    this.oscillator.start();
    
    this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.1);
  }

  private beep(freq: number, duration: number) {
    if (!this.ctx || !this.gainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = freq;
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
    gain.gain.linearRampToValueAtTime(0, now + duration); // Decay

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  public stopTone() {
    if (this.beepInterval) {
      clearInterval(this.beepInterval);
      this.beepInterval = null;
    }
    
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (e) { /* ignore */ }
      this.oscillator = null;
    }
    
    if (this.gainNode && this.ctx) {
        this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.gainNode.gain.value = 0;
    }

    this.isPlaying = false;
  }
}

/**
 * Sound Effects System - Cyber Beeps for UI Actions
 * Generates synthetic cyber sounds using Web Audio API
 */

class SoundSystem {
  private context: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3; // 30% volume for subtlety

  constructor() {
    if (typeof window !== 'undefined') {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Enable or disable sounds
   */
  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sounds_enabled', JSON.stringify(enabled));
    }
  }

  /**
   * Set volume (0 to 1)
   */
  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Check if sounds are enabled
   */
  public isEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    
    const stored = localStorage.getItem('sounds_enabled');
    if (stored !== null) {
      this.enabled = JSON.parse(stored);
    }
    return this.enabled;
  }

  /**
   * Play a cyber beep sound
   */
  private playBeep(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.context || !this.enabled) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume, this.context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  }

  /**
   * Click sound - subtle cyber click
   */
  public click() {
    this.playBeep(800, 0.05, 'square');
  }

  /**
   * Success sound - ascending beeps
   */
  public success() {
    if (!this.context || !this.enabled) return;
    
    this.playBeep(600, 0.08, 'sine');
    setTimeout(() => this.playBeep(800, 0.08, 'sine'), 50);
    setTimeout(() => this.playBeep(1000, 0.12, 'sine'), 100);
  }

  /**
   * Error sound - descending beeps
   */
  public error() {
    if (!this.context || !this.enabled) return;
    
    this.playBeep(400, 0.1, 'sawtooth');
    setTimeout(() => this.playBeep(300, 0.15, 'sawtooth'), 80);
  }

  /**
   * Notification sound - attention grabber
   */
  public notify() {
    if (!this.context || !this.enabled) return;
    
    this.playBeep(1000, 0.1, 'sine');
    setTimeout(() => this.playBeep(1200, 0.1, 'sine'), 100);
  }

  /**
   * Hover sound - very subtle
   */
  public hover() {
    this.playBeep(1200, 0.03, 'sine');
  }

  /**
   * Toggle sound - switch on/off
   */
  public toggle() {
    this.playBeep(900, 0.08, 'square');
  }

  /**
   * Whoosh sound - for page transitions
   */
  public whoosh() {
    if (!this.context || !this.enabled) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    oscillator.frequency.setValueAtTime(2000, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.3);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(this.volume * 0.5, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.3);
  }

  /**
   * Confetti sound - celebration
   */
  public confetti() {
    if (!this.context || !this.enabled) return;
    
    // Multiple quick beeps for celebration effect
    const frequencies = [800, 1000, 1200, 1400, 1600];
    frequencies.forEach((freq, index) => {
      setTimeout(() => this.playBeep(freq, 0.06, 'sine'), index * 40);
    });
  }
}

// Export singleton instance
export const sounds = new SoundSystem();

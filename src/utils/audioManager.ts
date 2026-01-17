class AudioManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private musicVolume = 0.3;
  private sfxVolume = 0.5;
  private musicEnabled = true;
  private sfxEnabled = true;

  constructor() {
    this.initializeSounds();
  }

  private initializeSounds() {
    // Используем Web Audio API для генерации звуков
    this.createSound('move', [440, 550], 0.1);
    this.createSound('capture', [220, 180, 140], 0.15);
    this.createSound('teleport', [800, 600, 400, 600, 800], 0.12);
    this.createSound('victory', [523, 659, 784, 1047], 0.2);
    this.createSound('defeat', [330, 294, 262, 220], 0.2);
    this.createSound('achievement', [659, 784, 988, 1175], 0.15);
    this.createSound('dragon', [200, 150, 100], 0.2);
    this.createSound('magic', [700, 900, 1100], 0.1);
  }

  private createSound(name: string, frequencies: number[], duration: number) {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const createTone = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const currentTime = audioContext.currentTime;
      const stepDuration = duration / frequencies.length;
      
      frequencies.forEach((freq, index) => {
        oscillator.frequency.setValueAtTime(freq, currentTime + index * stepDuration);
      });
      
      gainNode.gain.setValueAtTime(this.sfxVolume, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
      
      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);
      
      return { oscillator, gainNode };
    };

    this.sounds[name] = { play: createTone } as any;
  }

  playSound(soundName: string) {
    if (!this.sfxEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sound = this.sounds[soundName];
      
      if (sound && typeof sound.play === 'function') {
        sound.play();
      }
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }

  setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    return this.musicEnabled;
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  isMusicEnabled() {
    return this.musicEnabled;
  }

  isSFXEnabled() {
    return this.sfxEnabled;
  }
}

export const audioManager = new AudioManager();

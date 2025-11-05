// Sound Effects Manager for SupaQuiz

class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement } = {}
  private music: HTMLAudioElement | null = null
  private isMuted: boolean = false
  private musicVolume: number = 0.3
  private sfxVolume: number = 0.5

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSounds()
    }
  }

  private initSounds() {
    // Sound URLs (using free sound libraries)
    const soundUrls = {
      correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Success
      wrong: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3', // Error
      tick: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Clock tick
      join: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Player join
      start: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Game start
      celebrate: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', // Victory
      lobby: 'https://assets.mixkit.co/active_storage/sfx/2489/2489-preview.mp3', // Lobby music
    }

    // Preload sounds
    Object.entries(soundUrls).forEach(([key, url]) => {
      const audio = new Audio(url)
      audio.preload = 'auto'
      audio.volume = this.sfxVolume
      this.sounds[key] = audio
    })

    // Load music from localStorage
    const savedMute = localStorage.getItem('supaquiz_muted')
    this.isMuted = savedMute === 'true'
  }

  // Play sound effect
  play(soundName: string) {
    if (this.isMuted) return

    const sound = this.sounds[soundName]
    if (sound) {
      sound.currentTime = 0
      sound.play().catch((e) => console.log('Sound play failed:', e))
    }
  }

  // Play background music (looping)
  playMusic(musicName: string = 'lobby') {
    if (this.isMuted) return

    const music = this.sounds[musicName]
    if (music) {
      music.loop = true
      music.volume = this.musicVolume
      music.play().catch((e) => console.log('Music play failed:', e))
      this.music = music
    }
  }

  // Stop background music
  stopMusic() {
    if (this.music) {
      this.music.pause()
      this.music.currentTime = 0
      this.music = null
    }
  }

  // Countdown tick (repeating)
  startCountdownTick(duration: number) {
    if (this.isMuted) return

    const tickSound = this.sounds['tick']
    if (!tickSound) return

    let ticks = 0
    const maxTicks = Math.floor(duration)

    const interval = setInterval(() => {
      if (ticks >= maxTicks) {
        clearInterval(interval)
        return
      }
      this.play('tick')
      ticks++
    }, 1000)

    return interval
  }

  // Toggle mute
  toggleMute() {
    this.isMuted = !this.isMuted
    localStorage.setItem('supaquiz_muted', String(this.isMuted))

    if (this.isMuted) {
      this.stopMusic()
    }

    return this.isMuted
  }

  // Get mute state
  isSoundMuted() {
    return this.isMuted
  }

  // Set volume
  setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    Object.values(this.sounds).forEach((sound) => {
      sound.volume = this.sfxVolume
    })
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.music) {
      this.music.volume = this.musicVolume
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager()

// Convenience functions
export const playSound = (sound: string) => soundManager.play(sound)
export const playMusic = (music?: string) => soundManager.playMusic(music)
export const stopMusic = () => soundManager.stopMusic()
export const toggleMute = () => soundManager.toggleMute()
export const isMuted = () => soundManager.isSoundMuted()

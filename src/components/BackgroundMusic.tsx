'use client'

import { useEffect, useRef, useState } from 'react'

interface BackgroundMusicProps {
  src?: string
  volume?: number
}

export default function BackgroundMusic({
  src = '/bg-music.mp3',
  volume = 0.3
}: BackgroundMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    // Create audio element
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = volume
    audioRef.current = audio

    // Try to autoplay (may be blocked by browser)
    const playAudio = async () => {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (error) {
        // Autoplay blocked, wait for user interaction
        console.log('Autoplay blocked, waiting for user interaction')

        const handleInteraction = async () => {
          try {
            await audio.play()
            setIsPlaying(true)
            document.removeEventListener('click', handleInteraction)
            document.removeEventListener('keydown', handleInteraction)
          } catch (e) {
            console.error('Failed to play audio:', e)
          }
        }

        document.addEventListener('click', handleInteraction)
        document.addEventListener('keydown', handleInteraction)
      }
    }

    playAudio()

    // Cleanup
    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [src, volume])

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted
      setIsMuted(!isMuted)
    }
  }

  const togglePlay = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        try {
          await audioRef.current.play()
          setIsPlaying(true)
        } catch (e) {
          console.error('Failed to play audio:', e)
        }
      }
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      <button
        onClick={togglePlay}
        className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all hover:scale-110"
        title={isPlaying ? 'หยุดเพลง' : 'เล่นเพลง'}
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
      <button
        onClick={toggleMute}
        className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all hover:scale-110"
        title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>
    </div>
  )
}

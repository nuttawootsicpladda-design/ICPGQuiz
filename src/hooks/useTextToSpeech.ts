'use client'

import { useState, useEffect, useRef } from 'react'

interface UseTextToSpeechOptions {
  lang?: string
  rate?: number // 0.1 to 10 (default 1)
  pitch?: number // 0 to 2 (default 1)
  volume?: number // 0 to 1 (default 1)
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const {
    lang = 'th-TH', // Thai by default, will fallback to en-US if not available
    rate = 1,
    pitch = 1,
    volume = 1,
  } = options

  useEffect(() => {
    // Check if speech synthesis is supported
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)

      // Load available voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)
      }

      loadVoices()

      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    }

    return () => {
      // Cleanup: stop speaking if component unmounts
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speak = (text: string, customLang?: string) => {
    if (!isSupported || !text.trim()) {
      console.warn('Text-to-speech not supported or text is empty')
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    // Set language
    const targetLang = customLang || lang
    utterance.lang = targetLang

    // Try to find a voice for the specified language
    const selectedVoice = voices.find(voice => voice.lang.startsWith(targetLang.split('-')[0]))
    if (selectedVoice) {
      utterance.voice = selectedVoice
    } else {
      // Fallback to English if target language not found
      const englishVoice = voices.find(voice => voice.lang.startsWith('en'))
      if (englishVoice) {
        utterance.voice = englishVoice
        utterance.lang = 'en-US'
      }
    }

    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    utterance.onstart = () => {
      setIsSpeaking(true)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      setIsSpeaking(false)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const stop = () => {
    if (isSupported) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const pause = () => {
    if (isSupported && isSpeaking) {
      window.speechSynthesis.pause()
    }
  }

  const resume = () => {
    if (isSupported) {
      window.speechSynthesis.resume()
    }
  }

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
    voices,
  }
}

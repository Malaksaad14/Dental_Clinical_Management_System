import { useEffect, useRef, useState } from 'react'
import './VoiceTextarea.css'

type RecognizedResult = {
  isFinal: boolean
  [index: number]: { transcript: string }
}

type RecognitionEvent = { results: ArrayLike<RecognizedResult> }
type RecognitionError = { error: string }

type RecognitionEngine = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: RecognitionError) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type RecognitionConstructor = new () => RecognitionEngine
type BrowserSpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor
  webkitSpeechRecognition?: RecognitionConstructor
}

export type VoiceTextareaProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onRecordingChange?: (recording: boolean) => void
  placeholder?: string
  maxLength?: number
  required?: boolean
  disabled?: boolean
}

// Only one browser speech recognizer can reliably use the microphone at a time.
let activeDictation: RecognitionEngine | null = null

export default function VoiceTextarea({
  id, label, value, onChange, onRecordingChange,
  placeholder, maxLength, required = false, disabled = false,
}: VoiceTextareaProps) {
  const [language, setLanguage] = useState('ar-EG')
  const [recording, setRecording] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef<RecognitionEngine | null>(null)
  const baseTextRef = useRef('')
  const onChangeRef = useRef(onChange)
  const onRecordingChangeRef = useRef(onRecordingChange)
  const mountedRef = useRef(true)

  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { onRecordingChangeRef.current = onRecordingChange }, [onRecordingChange])
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      const recognition = recognitionRef.current
      if (recognition) {
        recognition.onresult = null
        recognition.onerror = null
        recognition.onend = null
        recognition.abort()
        if (activeDictation === recognition) activeDictation = null
        recognitionRef.current = null
      }
    }
  }, [])

  const speechWindow = typeof window === 'undefined' ? undefined : window as BrowserSpeechWindow
  const Recognition = speechWindow?.SpeechRecognition || speechWindow?.webkitSpeechRecognition
  const supported = Boolean(Recognition)

  function finish(recognition: RecognitionEngine) {
    if (activeDictation === recognition) activeDictation = null
    if (recognitionRef.current === recognition) recognitionRef.current = null
    if (mountedRef.current) {
      setRecording(false)
      setInterim('')
      onRecordingChangeRef.current?.(false)
    }
  }

  function stop() {
    recognitionRef.current?.stop()
  }

  function start() {
    if (disabled || !Recognition || recognitionRef.current) return
    setError('')
    setInterim('')
    // Keep existing typed text and append the completed transcript to it.
    baseTextRef.current = value.trim()
    if (activeDictation) activeDictation.abort()

    const recognition = new Recognition()
    recognitionRef.current = recognition
    activeDictation = recognition
    recognition.lang = language
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let finalText = ''
      let temporaryText = ''
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result?.[0]?.transcript?.trim() || ''
        if (!text) continue
        if (result.isFinal) finalText += `${text} `
        else temporaryText += `${text} `
      }
      const completed = [baseTextRef.current, finalText.trim()].filter(Boolean).join(' ')
      onChangeRef.current(maxLength ? completed.slice(0, maxLength) : completed)
      setInterim(temporaryText.trim())
    }
    recognition.onerror = (event) => {
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone permission was denied. Allow microphone access in your browser.',
        'service-not-allowed': 'Speech recognition is blocked in this browser.',
        'no-speech': 'No speech was detected. Try again and speak clearly.',
        'audio-capture': 'No microphone was found or it is unavailable.',
        network: 'Speech recognition could not reach its service. Check your connection.',
      }
      setError(messages[event.error] || `Dictation error: ${event.error}`)
    }
    recognition.onend = () => finish(recognition)
    try {
      recognition.start()
      setRecording(true)
      onRecordingChangeRef.current?.(true)
    } catch {
      setError('Could not start the microphone. Check browser microphone permission.')
      finish(recognition)
    }
  }

  return <div className="voice-field">
    <label htmlFor={id}>{label}</label>
    <textarea
      id={id}
      required={required}
      disabled={disabled}
      readOnly={recording}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={4}
      aria-describedby={`${id}-voice-status`}
    />
    <div className="voice-toolbar">
      <button
        className={`voice-toggle ${recording ? 'voice-toggle-active' : ''}`}
        type="button"
        disabled={disabled || !supported}
        onClick={recording ? stop : start}
        aria-pressed={recording}
      >
        <span aria-hidden="true">{recording ? '■' : '🎙'}</span>
        {recording ? 'Stop dictation' : 'Start dictation'}
      </button>
      <label className="voice-language-label" htmlFor={`${id}-language`}>Language</label>
      <select
        id={`${id}-language`}
        className="voice-language"
        disabled={disabled || recording}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
      >
        <option value="en-US">English</option>
        <option value="ar-EG">العربية (مصر)</option>
      </select>
    </div>
    <p id={`${id}-voice-status`} className="voice-status" aria-live="polite">
      {recording ? '● Listening… Click Stop dictation, then review the text before saving.' :
        !supported ? 'Voice typing is not supported in this browser. You can still type normally.' :
        'Dictation fills in text, not an audio recording. Review for clinical accuracy.'}
    </p>
    {interim && <p className="voice-interim" aria-live="polite">Hearing: {interim}</p>}
    {error && <p className="voice-error" role="alert">{error}</p>}
  </div>
}

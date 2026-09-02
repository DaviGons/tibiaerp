import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Audio generation ─────────────────────────────────────────────────────────

/**
 * Generates a short alarm beep pattern as a WAV blob URL.
 * Pattern over 1.2 s: beep → silence → beep → silence → higher beep → silence
 * Then loops via Audio.loop = true for a continuous alarm.
 */
function generateBeepWav() {
  const sampleRate = 44100
  const duration = 1.2 // seconds — the loop period
  const numSamples = Math.floor(sampleRate * duration)
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  // WAV header
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)   // PCM chunk size
  view.setUint16(20, 1, true)    // PCM format
  view.setUint16(22, 1, true)    // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true)    // block align
  view.setUint16(34, 16, true)   // bits per sample
  writeStr(36, 'data')
  view.setUint32(40, numSamples * 2, true)

  // Generate PCM samples
  const freq1 = 880  // A5
  const freq2 = 1320 // E6 (higher accent)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const phase = t % duration
    let amplitude = 0

    // Beep 1: 0.00 – 0.15 s
    if (phase < 0.15) {
      amplitude = Math.sin(2 * Math.PI * freq1 * t) * 0.9
    }
    // Beep 2: 0.25 – 0.40 s
    else if (phase >= 0.25 && phase < 0.4) {
      amplitude = Math.sin(2 * Math.PI * freq1 * t) * 0.9
    }
    // Beep 3 (higher): 0.50 – 0.65 s
    else if (phase >= 0.5 && phase < 0.65) {
      amplitude = Math.sin(2 * Math.PI * freq2 * t) * 0.9
    }
    // Silence: 0.65 – 1.20 s

    view.setInt16(44 + i * 2, amplitude * 32767, true)
  }

  const blob = new Blob([buffer], { type: 'audio/wav' })
  return URL.createObjectURL(blob)
}

// Singleton — generated once for the entire app lifetime
let _beepUrl = null
function getBeepUrl() {
  if (!_beepUrl) _beepUrl = generateBeepWav()
  return _beepUrl
}

// ─── Timer state helpers ──────────────────────────────────────────────────────

let _nextId = 1

function createTimer(name = '') {
  return {
    id: _nextId++,
    name,
    minutes: '',
    deadline: null,  // timestamp (ms) when the timer should ring
    totalMs: 0,      // original duration in ms (for progress calc)
    isRunning: false,
    isFinished: false,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages multiple independent hunt timers.
 *
 * Deadline-based counting: each timer stores `deadline = Date.now() + mins*60*1000`.
 * A single tick loop (rAF + setInterval fallback) checks all timers against the
 * real system clock, avoiding browser background-tab throttling issues.
 *
 * Alarm: HTML Audio element with loop=true, volume=1.0.
 * Autoplay: the beep URL is "unlocked" by playing a silent Audio in the
 *           user-gesture context of the "Iniciar" button click.
 */
export function useHuntTimers() {
  const [timers, setTimers] = useState(() => [createTimer()])
  // Incrementing counter that forces re-renders so the countdown display updates.
  // We avoid storing `timeLeft` in state to keep the tick callback allocation-free.
  const [, setRenderTick] = useState(0)

  // Refs survive across renders without re-triggering effects
  const timersRef = useRef(timers)
  const audioMapRef = useRef(new Map())        // timer-id → Audio element
  const alarmFiredRef = useRef(new Set())       // ids that already triggered alarm
  const loopActiveRef = useRef(false)
  const rafRef = useRef(null)
  const intervalRef = useRef(null)

  // Keep timersRef in sync so the tick callback always sees latest state
  timersRef.current = timers

  // ── Alarm audio ───────────────────────────────────────────────────────────

  /**
   * Unlock autoplay during a user gesture by playing + immediately pausing
   * a silent Audio element. Called inside startTimer's click handler.
   */
  const warmUpAudio = useCallback(() => {
    const audio = new Audio(getBeepUrl())
    audio.volume = 0
    audio.play()
      .then(() => { audio.pause(); audio.currentTime = 0 })
      .catch(() => {})
  }, [])

  const playAlarm = useCallback((timerId) => {
    if (audioMapRef.current.has(timerId)) return // already playing
    const audio = new Audio(getBeepUrl())
    audio.loop = true
    audio.volume = 1.0
    audio.play().catch(() => {})
    audioMapRef.current.set(timerId, audio)
  }, [])

  const stopAlarmAudio = useCallback((timerId) => {
    const audio = audioMapRef.current.get(timerId)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      audioMapRef.current.delete(timerId)
    }
  }, [])

  // ── Tick loop ─────────────────────────────────────────────────────────────

  const tick = useCallback(() => {
    const current = timersRef.current
    let needsStateUpdate = false

    for (const timer of current) {
      if (timer.isRunning && timer.deadline && Date.now() >= timer.deadline) {
        if (!alarmFiredRef.current.has(timer.id)) {
          alarmFiredRef.current.add(timer.id)
          playAlarm(timer.id)
          needsStateUpdate = true
        }
      }
    }

    if (needsStateUpdate) {
      setTimers(prev =>
        prev.map(t =>
          t.isRunning && t.deadline && Date.now() >= t.deadline
            ? { ...t, isRunning: false, isFinished: true, deadline: null }
            : t
        )
      )
    }

    // Force display update
    setRenderTick(n => n + 1)
  }, [playAlarm])

  const startLoop = useCallback(() => {
    if (loopActiveRef.current) return
    loopActiveRef.current = true

    const raf = () => {
      tick()
      if (loopActiveRef.current) {
        rafRef.current = requestAnimationFrame(raf)
      }
    }
    rafRef.current = requestAnimationFrame(raf)
    // Fallback for background tabs (browsers throttle rAF but keep setInterval ~1 s)
    intervalRef.current = setInterval(tick, 500)
  }, [tick])

  const stopLoop = useCallback(() => {
    loopActiveRef.current = false
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  // Start or stop the loop whenever the set of running timers changes
  useEffect(() => {
    const anyRunning = timers.some(t => t.isRunning)
    if (anyRunning) {
      startLoop()
    } else {
      stopLoop()
    }
    return stopLoop
  }, [timers.some(t => t.isRunning), startLoop, stopLoop]) // boolean dep — stable

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLoop()
      for (const audio of audioMapRef.current.values()) {
        audio.pause()
      }
      audioMapRef.current.clear()
    }
  }, [stopLoop])

  // ── Public API ────────────────────────────────────────────────────────────

  const addTimer = useCallback((name = '') => {
    setTimers(prev => [...prev, createTimer(name)])
  }, [])

  const removeTimer = useCallback((id) => {
    stopAlarmAudio(id)
    alarmFiredRef.current.delete(id)
    setTimers(prev => {
      const next = prev.filter(t => t.id !== id)
      // Always keep at least one timer
      return next.length > 0 ? next : [createTimer()]
    })
  }, [stopAlarmAudio])

  const updateField = useCallback((id, field, value) => {
    setTimers(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
    )
  }, [])

  /**
   * Start a specific timer.
   * MUST be called from a click handler (user gesture) so we can unlock audio.
   */
  const startTimer = useCallback((id) => {
    // Warm up audio during user gesture
    warmUpAudio()

    setTimers(prev =>
      prev.map(t => {
        if (t.id !== id) return t
        const mins = Number(t.minutes)
        if (!mins || mins <= 0) return t
        const totalMs = mins * 60 * 1000
        return {
          ...t,
          deadline: Date.now() + totalMs,
          totalMs,
          isRunning: true,
          isFinished: false,
        }
      })
    )
  }, [warmUpAudio])

  const cancelTimer = useCallback((id) => {
    stopAlarmAudio(id)
    alarmFiredRef.current.delete(id)
    setTimers(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, deadline: null, totalMs: 0, isRunning: false, isFinished: false }
          : t
      )
    )
  }, [stopAlarmAudio])

  /**
   * Stop the alarm sound and reset a finished timer so it can be reused.
   */
  const stopAlarm = useCallback((id) => {
    stopAlarmAudio(id)
    alarmFiredRef.current.delete(id)
    setTimers(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, deadline: null, totalMs: 0, isRunning: false, isFinished: false, minutes: t.minutes }
          : t
      )
    )
  }, [stopAlarmAudio])

  // ── Derived helpers (computed at render time from real clock) ──────────────

  const getTimeLeft = useCallback((timer) => {
    if (!timer.isRunning || !timer.deadline) return null
    return Math.max(0, timer.deadline - Date.now())
  }, [])

  const getFormattedTime = useCallback((timer) => {
    if (timer.isFinished) return '00:00'
    const ms = getTimeLeft(timer)
    if (ms === null) return '--:--'
    const totalSecs = Math.max(0, Math.ceil(ms / 1000))
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [getTimeLeft])

  const getProgress = useCallback((timer) => {
    if (timer.isFinished) return 1
    if (!timer.isRunning || !timer.deadline || !timer.totalMs) return 0
    const remaining = Math.max(0, timer.deadline - Date.now())
    return 1 - remaining / timer.totalMs
  }, [])

  return {
    timers,
    addTimer,
    removeTimer,
    updateField,
    startTimer,
    cancelTimer,
    stopAlarm,
    getTimeLeft,
    getFormattedTime,
    getProgress,
  }
}

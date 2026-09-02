import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Generates a beep sound using the Web Audio API.
 * Must be called from a user-gesture context (click handler) to satisfy
 * browser autoplay restrictions. The AudioContext is created/resumed on
 * the first call and reused thereafter.
 */
function createBeepPlayer() {
  let audioCtx = null

  return function playBeep() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }

    // Resume context if suspended (autoplay policy)
    const play = () => {
      // Play 3 consecutive beeps
      for (let i = 0; i < 3; i++) {
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime) // A5 note

        const startTime = audioCtx.currentTime + i * 0.35
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.6, startTime + 0.01)
        gainNode.gain.setValueAtTime(0.6, startTime + 0.12)
        gainNode.gain.linearRampToValueAtTime(0, startTime + 0.2)

        oscillator.start(startTime)
        oscillator.stop(startTime + 0.25)
      }
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(play)
    } else {
      play()
    }
  }
}

/**
 * Hunt timer hook.
 *
 * Instead of counting elapsed seconds with setInterval (which the browser
 * throttles when the tab is in the background), we store a *deadline*
 * timestamp (Date.now() + minutes*60*1000). A rapid requestAnimationFrame
 * loop (with setInterval fallback for background) continuously computes
 * the remaining time from the real system clock.
 *
 * Returns:
 *  - minutes / setMinutes: controlled input
 *  - timeLeft: remaining ms (null when idle)
 *  - isRunning: boolean
 *  - isFinished: boolean — true once the timer has rung
 *  - start(): begin countdown
 *  - cancel(): abort countdown
 *  - formattedTime: "MM:SS" string
 */
export function useHuntTimer() {
  const [minutes, setMinutes] = useState('')
  const [timeLeft, setTimeLeft] = useState(null)   // ms remaining, null = idle
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const deadlineRef = useRef(null)
  const rafRef = useRef(null)
  const intervalRef = useRef(null)
  const playBeepRef = useRef(null)
  const hasPlayedRef = useRef(false)

  // Lazily initialise the beep player
  const getBeepPlayer = useCallback(() => {
    if (!playBeepRef.current) {
      playBeepRef.current = createBeepPlayer()
    }
    return playBeepRef.current
  }, [])

  // Core tick — called by both rAF and setInterval
  const tick = useCallback(() => {
    if (deadlineRef.current === null) return

    const remaining = deadlineRef.current - Date.now()

    if (remaining <= 0) {
      setTimeLeft(0)
      setIsRunning(false)
      setIsFinished(true)
      deadlineRef.current = null

      // Play beep only once
      if (!hasPlayedRef.current) {
        hasPlayedRef.current = true
        getBeepPlayer()()
      }

      // Clean up loops
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
      rafRef.current = null
      intervalRef.current = null
      return
    }

    setTimeLeft(remaining)
  }, [getBeepPlayer])

  // rAF loop for foreground precision
  const rafLoop = useCallback(() => {
    tick()
    if (deadlineRef.current !== null) {
      rafRef.current = requestAnimationFrame(rafLoop)
    }
  }, [tick])

  /**
   * Start the timer.
   * Called from button onClick → satisfies autoplay user-gesture requirement.
   */
  const start = useCallback(() => {
    const mins = Number(minutes)
    if (!mins || mins <= 0) return

    // Warm-up AudioContext during user gesture
    getBeepPlayer()

    const deadline = Date.now() + mins * 60 * 1000
    deadlineRef.current = deadline
    hasPlayedRef.current = false

    setTimeLeft(mins * 60 * 1000)
    setIsRunning(true)
    setIsFinished(false)

    // Start rAF (foreground) + setInterval (background fallback every 500ms)
    rafRef.current = requestAnimationFrame(rafLoop)
    intervalRef.current = setInterval(tick, 500)
  }, [minutes, rafLoop, tick, getBeepPlayer])

  const cancel = useCallback(() => {
    deadlineRef.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    rafRef.current = null
    intervalRef.current = null

    setTimeLeft(null)
    setIsRunning(false)
    setIsFinished(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Format remaining time as MM:SS
  const formattedTime = (() => {
    if (timeLeft === null) return '--:--'
    const totalSecs = Math.max(0, Math.ceil(timeLeft / 1000))
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })()

  // Progress percentage (0 → 1)
  const progress = (() => {
    if (timeLeft === null || !minutes) return 0
    const totalMs = Number(minutes) * 60 * 1000
    if (totalMs <= 0) return 0
    return 1 - Math.max(0, Math.min(1, timeLeft / totalMs))
  })()

  return {
    minutes,
    setMinutes,
    timeLeft,
    isRunning,
    isFinished,
    start,
    cancel,
    formattedTime,
    progress,
  }
}

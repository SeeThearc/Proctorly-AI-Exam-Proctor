import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for countdown timer
 * @param {number} initialTime - Initial time in seconds
 * @param {Function} onTimeUp - Callback when timer reaches 0
 */
const useTimer = (initialTime, onTimeUp) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const onTimeUpRef = useRef(onTimeUp);

  // Update callback ref
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  /**
   * Start timer
   */
  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  /**
   * Pause timer
   */
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  /**
   * Reset timer
   */
  const reset = useCallback((newTime) => {
    setIsRunning(false);
    setTimeRemaining(newTime || initialTime);
  }, [initialTime]);

  /**
   * Timer countdown logic
   */
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onTimeUpRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  /**
   * Format time as MM:SS
   */
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeRemaining,
    isRunning,
    formattedTime: formatTime(timeRemaining),
    start,
    pause,
    reset
  };
};

export default useTimer;
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage fullscreen mode and detect violations
 * @param {Function} onViolation - Callback when fullscreen violation occurs
 */
const useFullscreen = (onViolation) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const violationCallbackRef = useRef(onViolation);

  // Update callback ref when it changes
  useEffect(() => {
    violationCallbackRef. current = onViolation;
  }, [onViolation]);

  /**
   * Check if fullscreen is supported
   */
  useEffect(() => {
    const supported = ! !(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document. msFullscreenEnabled
    );
    setIsSupported(supported);
  }, []);

  /**
   * Enter fullscreen mode
   */
  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document. documentElement;
      
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { // Safari
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) { // Firefox
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) { // IE/Edge
        await elem.msRequestFullscreen();
      }

      setIsFullscreen(true);
      console.log('✅ Entered fullscreen mode');
      return true;
    } catch (error) {
      console.error('❌ Error entering fullscreen:', error);
      return false;
    }
  }, []);

  /**
   * Exit fullscreen mode
   */
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document. msExitFullscreen) {
        await document.msExitFullscreen();
      }

      setIsFullscreen(false);
      console.log('✅ Exited fullscreen mode');
    } catch (error) {
      console.error('❌ Error exiting fullscreen:', error);
    }
  }, []);

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  /**
   * Handle fullscreen change events
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = 
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      const wasFullscreen = isFullscreen;
      const nowFullscreen = !!fullscreenElement;

      setIsFullscreen(nowFullscreen);

      // Detect unauthorized exit from fullscreen
      if (wasFullscreen && !nowFullscreen && violationCallbackRef.current) {
        console.log('⚠️ Fullscreen exit detected');
        violationCallbackRef.current('fullscreen-exit');
      }
    };

    // Add event listeners for all browsers
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  /**
   * Detect tab/window visibility changes
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && violationCallbackRef.current) {
        console.log('⚠️ Tab/window hidden detected');
        violationCallbackRef.current('tab-switch');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  /**
   * Detect window blur (clicking outside)
   */
  useEffect(() => {
    const handleWindowBlur = () => {
      if (violationCallbackRef. current) {
        console.log('⚠️ Window blur detected');
        violationCallbackRef.current('window-blur');
      }
    };

    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  /**
   * Prevent right-click context menu
   */
  useEffect(() => {
    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', preventContextMenu);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);

  /**
   * Prevent keyboard shortcuts (DevTools, etc.)
   */
  useEffect(() => {
    const preventKeyShortcuts = (e) => {
      // Prevent F12 (DevTools)
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+S (Save)
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+P (Print)
      if (e.ctrlKey && e.keyCode === 80) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('keydown', preventKeyShortcuts);

    return () => {
      document.removeEventListener('keydown', preventKeyShortcuts);
    };
  }, []);

  /**
   * Prevent copy, cut, paste
   */
  useEffect(() => {
    const preventCopyPaste = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);

    return () => {
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
    };
  }, []);

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  };
};

export default useFullscreen;
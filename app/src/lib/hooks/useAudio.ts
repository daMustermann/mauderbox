import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '@/lib/tauri';
import { convertToWav } from '@/lib/utils/audio';

// ============================================================================
// Recording Type Options
// ============================================================================

type RecordingMode = 'microphone' | 'system-audio' | 'none';

interface UseAudioOptions {
  maxDurationSeconds?: number;
  onRecordingComplete?: (blob: Blob, duration?: number) => void;
}

// ============================================================================
// Microphone Recording
// ============================================================================

function useMicrophoneRecording({
  maxDurationSeconds = 29,
  onRecordingComplete,
}: UseAudioOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      chunksRef.current = [];
      setDuration(0);

      if (typeof navigator === 'undefined') {
        const errorMsg = 'Navigator API is not available. This might be a Tauri configuration issue.';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const isTauriEnv = isTauri();
          console.error('MediaDevices check:', {
            hasNavigator: typeof navigator !== 'undefined',
            hasMediaDevices: !!navigator?.mediaDevices,
            hasGetUserMedia: !!navigator?.mediaDevices?.getUserMedia,
            isTauri: isTauriEnv,
          });

          const errorMsg = isTauriEnv
            ? 'Microphone access is not available. Please ensure:\n1. The app has microphone permissions in System Settings\n2. You restart the app after granting permissions\n3. You are using Tauri v2 with a webview that supports getUserMedia'
            : 'Microphone access is not available. Please ensure you are using a secure context (HTTPS or localhost).';
          setError(errorMsg);
          throw new Error(errorMsg);
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
      };

      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        delete options.mimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

        try {
          const wavBlob = await convertToWav(webmBlob);
          const recordedDuration = startTimeRef.current
            ? (Date.now() - startTimeRef.current) / 1000
            : undefined;
          onRecordingComplete?.(wavBlob, recordedDuration);
        } catch (err) {
          console.error('Error converting audio to WAV:', err);
          const recordedDuration = startTimeRef.current
            ? (Date.now() - startTimeRef.current) / 1000
            : undefined;
          onRecordingComplete?.(webmBlob, recordedDuration);
        }

        streamRef.current?.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      };

      mediaRecorder.onerror = (event) => {
        setError('Recording error occurred');
        console.error('MediaRecorder error:', event);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      startTimeRef.current = Date.now();

      timerRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setDuration(elapsed);

          if (elapsed >= maxDurationSeconds) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
              setIsRecording(false);
              if (timerRef.current !== null) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
            }
          }
        }
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone.';
      setError(errorMessage);
      setIsRecording(false);
    }
  }, [maxDurationSeconds, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      chunksRef.current = [];
      setDuration(0);
    }

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;

    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, []);

  return { isRecording, duration, error, startRecording, stopRecording, cancelRecording };
}

// ============================================================================
// System Audio Capture (Tauri only)
// ============================================================================

function useSystemAudioCapture({
  maxDurationSeconds = 29,
  onRecordingComplete,
}: UseAudioOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const stopRecordingRef = useRef<(() => Promise<void>) | null>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    if (!isTauri()) {
      setIsSupported(false);
      return;
    }

    invoke<boolean>('is_system_audio_supported')
      .then((supported) => {
        setIsSupported(supported);
      })
      .catch(() => {
        setIsSupported(false);
      });
  }, []);

  const startRecording = useCallback(async () => {
    if (!isTauri()) {
      const errorMsg = 'System audio capture is only available in the desktop app.';
      setError(errorMsg);
      return;
    }

    if (!isSupported) {
      const errorMsg = 'System audio capture is not supported on this platform.';
      setError(errorMsg);
      return;
    }

    try {
      setError(null);
      setDuration(0);

      await invoke('start_system_audio_capture', {
        maxDurationSecs: maxDurationSeconds,
      });

      setIsRecording(true);
      isRecordingRef.current = true;
      startTimeRef.current = Date.now();

      timerRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setDuration(elapsed);

          if (elapsed >= maxDurationSeconds && stopRecordingRef.current) {
            void stopRecordingRef.current();
          }
        }
      }, 100);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start system audio capture.';
      setError(errorMessage);
      setIsRecording(false);
    }
  }, [maxDurationSeconds, isSupported]);

  const stopRecording = useCallback(async () => {
    if (!isRecording || !isTauri()) {
      return;
    }

    try {
      setIsRecording(false);
      isRecordingRef.current = false;

      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const base64Data = await invoke<string>('stop_system_audio_capture');

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'audio/wav' });
      const recordedDuration = startTimeRef.current
        ? (Date.now() - startTimeRef.current) / 1000
        : undefined;
      onRecordingComplete?.(blob, recordedDuration);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to stop system audio capture.';
      setError(errorMessage);
    }
  }, [isRecording, onRecordingComplete]);

  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  const cancelRecording = useCallback(async () => {
    if (isRecordingRef.current) {
      await stopRecording();
    }

    setIsRecording(false);
    isRecordingRef.current = false;
    setDuration(0);

    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (isRecordingRef.current && isTauri()) {
        invoke('stop_system_audio_capture').catch((err) => {
          console.error('Error stopping audio capture on unmount:', err);
        });
      }
    };
  }, []);

  return { isRecording, duration, error, isSupported, startRecording, stopRecording, cancelRecording };
}

// ============================================================================
// Combined Audio Hook - Choose Recording Mode
// ============================================================================

export function useAudio(mode: RecordingMode = 'microphone', options?: UseAudioOptions) {
  const microphone = useMicrophoneRecording(options);
  const systemAudio = useSystemAudioCapture(options);

  if (mode === 'system-audio') {
    return {
      ...systemAudio,
      mode: 'system-audio' as const,
    };
  }

  if (mode === 'microphone') {
    return {
      ...microphone,
      mode: 'microphone' as const,
      isSupported: true,
    };
  }

  return {
    isRecording: false,
    duration: 0,
    error: null,
    isSupported: false,
    startRecording: () => {},
    stopRecording: () => {},
    cancelRecording: () => {},
    mode: 'none' as const,
  };
}

// ============================================================================
// Export Individual Hooks for Backwards Compatibility
// ============================================================================

export function useAudioRecording(options?: UseAudioOptions) {
  return useMicrophoneRecording(options);
}

export function useSystemAudioCaptureDeprecated(options?: UseAudioOptions) {
  return useSystemAudioCapture(options);
}

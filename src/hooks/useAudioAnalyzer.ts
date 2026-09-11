import { useState, useEffect, useRef, useCallback } from 'react';

export function useAudioAnalyzer(isListening: boolean, deviceId?: string) {
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [audioDevices, setAudioDevices] = useState<{ deviceId: string; label: string }[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Enumerate input microphones
  useEffect(() => {
    async function fetchDevices() {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const mics = devices
            .filter((d) => d.kind === 'audioinput')
            .map((d, index) => ({
              deviceId: d.deviceId,
              label: d.label || `Microphone ${index + 1}`
            }));
          setAudioDevices(mics);
        } catch (e) {
          console.warn('[useAudioAnalyzer] Error enumerating devices:', e);
        }
      }
    }
    fetchDevices();
  }, []);

  const stopAnalyzer = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setVolumeLevel(0);
  }, []);

  useEffect(() => {
    if (!isListening) {
      stopAnalyzer();
      return;
    }

    let isSubscribed = true;

    async function startAnalyzer() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true
          }
        });

        if (!isSubscribed) return;
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        // Biquad highpass filter to suppress mechanical keyboard clacks & hums
        const highpassFilter = ctx.createBiquadFilter();
        highpassFilter.type = 'highpass';
        highpassFilter.frequency.value = 85;

        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;

        source.connect(highpassFilter);
        highpassFilter.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateVolume = () => {
          if (!isListening || !analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          // Scale volume between 0 and 100
          const level = Math.min(100, Math.round((average / 128) * 100));
          setVolumeLevel(level);

          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      } catch (err) {
        console.warn('[useAudioAnalyzer] Mic stream analyzer error:', err);
      }
    }

    startAnalyzer();

    return () => {
      isSubscribed = false;
      stopAnalyzer();
    };
  }, [isListening, deviceId, stopAnalyzer]);

  return { volumeLevel, audioDevices };
}

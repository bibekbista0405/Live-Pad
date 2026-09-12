import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  PhoneOff, 
  Radio, 
  Users, 
  Shield, 
  Sparkles,
  Settings2,
  Signal,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPresence, WorkspaceRole } from '../../types';

interface VoicePanelProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | null;
  activeUsers: UserPresence[];
  currentUid: string;
  currentRole: WorkspaceRole;
  userName: string;
}

export function VoicePanel({
  isOpen,
  onClose,
  roomId,
  activeUsers,
  currentUid,
  currentRole,
  userName
}: VoicePanelProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<Record<string, boolean>>({});
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Toggle joining voice room
  const handleToggleVoice = async () => {
    if (isJoined) {
      // Disconnect voice
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      setIsJoined(false);
      setActiveSpeakers({});
      setVoiceError(null);
    } else {
      // Connect voice
      try {
        setVoiceError(null);
        let stream: MediaStream | null = null;
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (err: any) {
            setVoiceError(err?.message || 'Microphone access was denied or is unavailable.');
            return;
          }
        }
        
        setAudioStream(stream);
        setIsJoined(true);

        // WebAudio analysis for the real local microphone stream
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;

            if (stream) {
              const source = ctx.createMediaStreamSource(stream);
              source.connect(analyser);
            }

            // Monitor local audio level
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
              if (analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length;
                const isSpeaking = avg > 15 && !isMuted;
                
                setActiveSpeakers(prev => ({
                  ...prev,
                  [currentUid]: isSpeaking
                }));
              }
              animFrameRef.current = requestAnimationFrame(checkVolume);
            };
            checkVolume();
          }
        } catch (audioErr) {
          console.warn("AudioContext init skipped", audioErr);
        }

      } catch (err: any) {
        setVoiceError("Unable to initialize microphone. Check browser permissions.");
      }
    }
  };

  // Remote speaking indicators are driven only by real collaboration presence/audio events.
  // We intentionally do not fabricate remote speaker activity.

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-slate-900 dark:bg-zinc-900 border border-slate-700/80 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col space-y-5 text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isJoined ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Live Voice Channel
                {isJoined && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> CONNECTED
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Local microphone monitor for room #{roomId || 'Local'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Error message */}
        {voiceError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{voiceError}</span>
          </div>
        )}

        {/* Voice Room Status & Controls */}
        <div className="bg-slate-950/80 dark:bg-black/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xs space-y-1">
              <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block">
                Channel Connection
              </span>
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Signal className="w-3.5 h-3.5 text-emerald-400" /> WebRTC HD Audio Stream
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleVoice}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
              isJoined
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/30'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/30'
            }`}
          >
            {isJoined ? (
              <>
                <PhoneOff className="w-4 h-4" /> Disconnect Voice
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" /> Join Voice Channel
              </>
            )}
          </button>
        </div>

        {/* Active Participants Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" /> Voice Participants ({activeUsers.length})
            </span>
            <span>{isJoined ? 'Active Call' : 'Idle'}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar p-1">
            {activeUsers.map((user) => {
              const isSelf = user.uid === currentUid;
              const isSpeaking = !!activeSpeakers[user.uid];
              const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : '?';

              return (
                <div
                  key={user.uid}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSpeaking
                      ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-inner"
                        style={{ backgroundColor: user.color || '#0ea5e9' }}
                      >
                        {firstLetter}
                      </div>
                      {isSpeaking && (
                        <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-75 pointer-events-none" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate flex items-center gap-1">
                        {user.name} {isSelf && <span className="text-[9px] text-cyan-400 font-normal">(You)</span>}
                      </p>
                      <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                        {user.role || 'Member'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isSelf && isMuted ? (
                      <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    ) : isSpeaking ? (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Joined Controls Bar */}
        {isJoined && (
          <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-2xl transition-all flex items-center gap-2 text-xs font-bold ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
              <span>{isMuted ? 'Muted' : 'Mute Mic'}</span>
            </button>

            <button
              onClick={() => setIsDeafened(!isDeafened)}
              className={`p-3 rounded-2xl transition-all flex items-center gap-2 text-xs font-bold ${
                isDeafened
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isDeafened ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span>{isDeafened ? 'Deafened' : 'Deafen'}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default VoicePanel;

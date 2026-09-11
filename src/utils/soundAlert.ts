/**
 * Utility for playing synthesized audio chime and notification alerts for @ mentions
 */

export function playMentionChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    // First note (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second note (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    gain2.gain.setValueAtTime(0.18, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.38);
  } catch {
    // Audio context may be restricted before user interaction
  }
}

/**
 * Checks if a text string or message mentions a given user name or uid or @all/@everyone
 */
export function isUserMentioned(text: string, currentUid?: string, userName?: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('@all') || lowerText.includes('@everyone')) {
    return true;
  }

  if (userName && userName.trim()) {
    const cleanName = userName.trim().toLowerCase();
    // match @Name or @Firstname or @Full Name
    if (lowerText.includes(`@${cleanName}`)) return true;
    const firstName = cleanName.split(/\s+/)[0];
    if (firstName && firstName.length > 1 && lowerText.includes(`@${firstName}`)) return true;
  }

  if (currentUid && lowerText.includes(`@${currentUid.toLowerCase()}`)) {
    return true;
  }

  return false;
}

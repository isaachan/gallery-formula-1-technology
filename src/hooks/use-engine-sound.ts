"use client";

import { useCallback, useRef } from "react";

/**
 * Synthesizes a short engine-revving sound with WebAudio: two sawtooth
 * oscillators swept 65 -> 520 -> 140Hz through a lowpass filter, matching
 * the prototype's "🔊 引擎声" button (design/F1 赛道年代记.dc.html README).
 * No audio files are shipped; this is pure synthesis. Safe no-op if
 * AudioContext is unavailable.
 */
export function useEngineSound() {
  const contextRef = useRef<AudioContext | null>(null);

  const play = useCallback(() => {
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const context = contextRef.current ?? new AudioContextCtor();
    contextRef.current = context;
    if (context.state === "suspended") {
      void context.resume();
    }

    const now = context.currentTime;
    const duration = 1.7;

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    filter.connect(context.destination);

    const masterGain = context.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    masterGain.gain.linearRampToValueAtTime(0, now + duration);
    masterGain.connect(filter);

    for (const detune of [0, 6]) {
      const oscillator = context.createOscillator();
      oscillator.type = "sawtooth";
      oscillator.detune.value = detune;
      oscillator.frequency.setValueAtTime(65, now);
      oscillator.frequency.linearRampToValueAtTime(520, now + duration * 0.55);
      oscillator.frequency.linearRampToValueAtTime(140, now + duration);
      oscillator.connect(masterGain);
      oscillator.start(now);
      oscillator.stop(now + duration);
    }
  }, []);

  return play;
}

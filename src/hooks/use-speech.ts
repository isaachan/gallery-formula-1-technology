"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wraps window.speechSynthesis for the prototype's "🎧 语音讲解" narration
 * button (design/F1 赛道年代记.dc.html README): zh-CN, rate 0.95. Cancels
 * on unmount so audio never survives a navigation. No-ops safely if the
 * Web Speech API is unavailable.
 */
export function useSpeech(text: string) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    [],
  );

  const toggle = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth) {
      return;
    }

    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    synth.speak(utterance);
    setSpeaking(true);
  }, [speaking, text]);

  return { speaking, toggle };
}

"use client";

import { useEngineSound } from "@/hooks/use-engine-sound";

export function EngineSoundButton({ className }: { className?: string }) {
  const play = useEngineSound();

  return (
    <button type="button" className={className} onClick={play}>
      🔊 引擎声
    </button>
  );
}

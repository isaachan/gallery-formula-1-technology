"use client";

import { useSpeech } from "@/hooks/use-speech";

export function NarrationButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const { speaking, toggle } = useSpeech(text);

  return (
    <button type="button" className={className} onClick={toggle}>
      {speaking ? "⏹ 停止" : "🎧 语音讲解"}
    </button>
  );
}

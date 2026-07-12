"use client";

import { useRef, useState } from "react";

const ROTATION_CLAMP = 45;
const DRAG_SENSITIVITY = 0.35;

/**
 * Pseudo-3D drag-to-rotate interaction matching the prototype's heroDown/
 * heroMove/heroUp behavior (design/F1 赛道年代记.dc.html README):
 * pointerdown/move/up + setPointerCapture, rotateY = initial + dx*0.35,
 * clamped to +-45deg. Returns pointer handlers for the drag-capturing
 * surface and a CSS transform for just the rotating element, since the
 * prototype rotates only the car/model illustration - badges and captions
 * layered on the same stage stay fixed.
 */
export function useRotatableDrag(initialRotation = -16) {
  const [rotation, setRotation] = useState(initialRotation);
  const dragRef = useRef<{ startX: number; startRotation: number } | null>(
    null,
  );

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    dragRef.current = { startX: event.clientX, startRotation: rotation };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can fail for synthetic/non-standard pointer
      // sessions (e.g. some automated test harnesses); the drag still
      // works via the move/up listeners below, capture is just an
      // enhancement that keeps the drag alive if the pointer leaves the
      // element's bounds.
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current) {
      return;
    }
    const dx = event.clientX - dragRef.current.startX;
    const next = dragRef.current.startRotation + dx * DRAG_SENSITIVITY;
    setRotation(Math.max(-ROTATION_CLAMP, Math.min(ROTATION_CLAMP, next)));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // See onPointerDown - capture may never have been established.
    }
    dragRef.current = null;
  };

  return {
    rotation,
    dragHandlers: { onPointerDown, onPointerMove, onPointerUp },
    transform: `perspective(700px) rotateY(${rotation}deg)`,
  };
}

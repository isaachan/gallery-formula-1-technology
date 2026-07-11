"use client";

import { Suspense, useEffect, useMemo, useRef, type ComponentRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

type OrbitControlsImpl = ComponentRef<typeof OrbitControls>;

const CAMERA_PRESETS: Record<string, [number, number, number]> = {
  front: [0, 0.4, 2.4],
  "three-quarter": [1.6, 1.1, 1.8],
  exploded: [1.9, 1.4, 1.9],
};

function Model({ modelSrc }: { modelSrc: string }) {
  const { scene } = useGLTF(modelSrc);
  return <primitive object={scene} />;
}

function FrameCamera({ initialCamera }: { initialCamera: string }) {
  const { camera } = useThree();

  useEffect(() => {
    const position = CAMERA_PRESETS[initialCamera] ?? CAMERA_PRESETS.front;
    camera.position.set(...position);
    camera.lookAt(0, 0, 0);
    // Runs once on mount to frame the initial shot; interaction owns the camera after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function Model3DCanvas({
  modelSrc,
  initialCamera = "front",
  autoRotate = false,
  paused = false,
  onLoaded,
}: {
  modelSrc: string;
  initialCamera?: string;
  autoRotate?: boolean;
  paused?: boolean;
  onLoaded?: () => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const handleKeyDown = useMemo(
    () => (event: React.KeyboardEvent<HTMLDivElement>) => {
      const controls = controlsRef.current;
      if (!controls) {
        return;
      }

      const step = 0.12;
      switch (event.key) {
        case "ArrowLeft":
          controls.setAzimuthalAngle(controls.getAzimuthalAngle() - step);
          event.preventDefault();
          break;
        case "ArrowRight":
          controls.setAzimuthalAngle(controls.getAzimuthalAngle() + step);
          event.preventDefault();
          break;
        case "ArrowUp":
          controls.setPolarAngle(
            Math.max(0.1, controls.getPolarAngle() - step),
          );
          event.preventDefault();
          break;
        case "ArrowDown":
          controls.setPolarAngle(
            Math.min(Math.PI - 0.1, controls.getPolarAngle() + step),
          );
          event.preventDefault();
          break;
        default:
          return;
      }
      controls.update();
    },
    [],
  );

  return (
    <div
      className="model3d-canvas-frame"
      role="group"
      aria-label="3D model viewer, use arrow keys to rotate"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Canvas
        dpr={[1, 1.5]}
        frameloop={paused ? "never" : "always"}
        onCreated={() => onLoaded?.()}
      >
        <hemisphereLight args={[0xffffff, 0x3a3532, 1.2]} />
        <directionalLight position={[3, 4, 2]} intensity={0.6} />
        <Suspense fallback={null}>
          <Model modelSrc={modelSrc} />
        </Suspense>
        <FrameCamera initialCamera={initialCamera} />
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          autoRotate={autoRotate && !paused}
          autoRotateSpeed={1.2}
        />
      </Canvas>
    </div>
  );
}

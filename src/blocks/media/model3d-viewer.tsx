"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { getLocalizedText, type LocaleText } from "../locale-text";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useWebglSupport } from "./webgl-support";
import { useSaveDataPreference } from "./use-save-data";
import { Model3DErrorBoundary } from "./model3d-error-boundary";

export type Model3DMedia = {
  id: string;
  alt: LocaleText;
  modelSrc: string;
  posterSrc: string;
  credit?: string;
};

const Model3DCanvas = dynamic(() => import("./model3d-canvas"), {
  ssr: false,
  loading: () => <div className="model3d-loading">正在加载 3D 模型…</div>,
});

type ViewerStatus = "poster" | "data-warning" | "loading" | "active" | "error";

export function Model3DViewer({
  media,
  locale = "zh",
  initialCamera = "front",
  interaction = "orbit",
}: {
  media: Model3DMedia;
  locale?: keyof LocaleText;
  initialCamera?: "front" | "three-quarter" | "exploded";
  interaction?: "orbit" | "turntable";
}) {
  const alt = getLocalizedText(media.alt, locale) ?? "";
  const prefersReducedMotion = useReducedMotion();
  const prefersSaveData = useSaveDataPreference();
  const [status, setStatus] = useState<ViewerStatus>("poster");
  const [isVisible, setIsVisible] = useState(true);
  const webglSupported = useWebglSupport();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || status === "poster") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [status]);

  if (!webglSupported) {
    return (
      <div className="model3d-figure" data-media-id={media.id}>
        <img
          className="media-frame model3d-poster"
          src={media.posterSrc}
          alt={alt}
        />
        <p className="media-fallback-copy">
          此设备不支持 3D 查看，已显示静态预览图。
        </p>
        {media.credit ? (
          <span className="media-credit">{media.credit}</span>
        ) : null}
      </div>
    );
  }

  if (status === "poster") {
    return (
      <div className="model3d-figure" data-media-id={media.id}>
        <div className="model3d-poster-frame">
          <img
            className="media-frame model3d-poster"
            src={media.posterSrc}
            alt={alt}
          />
          <button
            type="button"
            className="model3d-launch tap-target"
            onClick={() =>
              setStatus(prefersSaveData ? "data-warning" : "loading")
            }
          >
            查看 3D 模型
          </button>
        </div>
        {media.credit ? (
          <span className="media-credit">{media.credit}</span>
        ) : null}
      </div>
    );
  }

  if (status === "data-warning") {
    return (
      <div className="model3d-figure" data-media-id={media.id}>
        <div className="model3d-poster-frame">
          <img
            className="media-frame model3d-poster"
            src={media.posterSrc}
            alt={alt}
          />
          <div className="model3d-data-warning" role="alert">
            <p className="model3d-data-warning-copy">
              检测到您的设备已开启省流量模式，加载 3D 模型会产生额外流量。
            </p>
            <button
              type="button"
              className="model3d-data-warning-button tap-target"
              onClick={() => setStatus("loading")}
            >
              仍要加载 3D 模型
            </button>
          </div>
        </div>
        {media.credit ? (
          <span className="media-credit">{media.credit}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="model3d-figure" data-media-id={media.id} ref={containerRef}>
      <Model3DErrorBoundary
        mediaId={media.id}
        fallback={
          <div
            className="media-frame media-frame-error"
            role="img"
            aria-label={alt}
          >
            <p className="media-fallback-copy">
              {alt ? `3D 模型暂时无法加载：${alt}` : "3D 模型暂时无法加载"}
            </p>
          </div>
        }
      >
        <Model3DCanvas
          modelSrc={media.modelSrc}
          initialCamera={initialCamera}
          autoRotate={interaction === "turntable" && !prefersReducedMotion}
          paused={!isVisible}
          onLoaded={() => setStatus("active")}
        />
      </Model3DErrorBoundary>
      {media.credit ? (
        <span className="media-credit">{media.credit}</span>
      ) : null}
    </div>
  );
}

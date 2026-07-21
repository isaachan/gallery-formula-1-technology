"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

/**
 * A photo that expands into a fullscreen lightbox when activated.
 *
 * The trigger renders as a wrapping `<button>` around an `<img>` so the
 * existing per-page image CSS (`.car-hero-photo`, `.person-photo`, …) keeps
 * applying to the inner image unchanged; callers pass that class via
 * `imgClassName`. The lightbox itself is portaled to `document.body` and
 * follows the WAI-ARIA dialog pattern: focus moves to the close button on
 * open, the dialog traps Escape/backdrop/✕ to close, and focus is restored
 * to the trigger button on close. Background scrolling is locked while open.
 *
 * `prefers-reduced-motion` is honored via the global motion override in
 * globals.css rather than a dedicated branch, so the fade-in simply
 * collapses to ~1ms there.
 */
export function ExpandablePhoto({
  src,
  alt,
  credit,
  imgClassName,
  openLabel = "查看大图",
  closeLabel = "关闭大图",
}: {
  src: string;
  alt: string;
  credit?: string;
  /** Class applied to the inner <img> so existing per-page CSS still works. */
  imgClassName?: string;
  /** Accessible name for the lightbox dialog and trigger's hint. */
  openLabel?: string;
  /** Accessible name for the close button. */
  closeLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  // createPortal targets document.body, which only exists in the browser.
  // Render the portal after mount so SSR / static export stays deterministic.
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    // The button's native Enter/Space handling already toggles, but a plain
    // <img>-only button is occasionally announced without a clear hint that
    // it opens something; aria-haspopup below carries that signal instead.
    if (event.key === "Escape" && open) {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="expandable-photo-trigger tap-target"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${openLabel}：${alt}`}
        onClick={() => setOpen(true)}
        onKeyDown={onTriggerKeyDown}
      >
        <img
          className={imgClassName}
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
        />
      </button>
      {mounted && open
        ? createPortal(
            <div
              className="photo-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={openLabel}
              // Close when the click lands on the backdrop itself, not its
              // children (image / close button handle their own clicks).
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setOpen(false);
                }
              }}
            >
              <button
                ref={closeRef}
                type="button"
                className="photo-lightbox-close tap-target"
                aria-label={closeLabel}
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
              <figure className="photo-lightbox-figure">
                <img
                  className="photo-lightbox-img"
                  src={src}
                  alt={alt}
                  decoding="async"
                />
                {credit ? (
                  <figcaption className="photo-lightbox-credit">
                    {credit}
                  </figcaption>
                ) : null}
              </figure>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

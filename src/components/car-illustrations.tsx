/**
 * Illustrated car SVGs ported directly from the prototype's inline markup
 * (design/F1 赛道年代记.dc.html, hero stage ~line 158 and gallery card
 * ~line 182). These are exact visual assets, not layout decisions.
 */

export function HeroCarSvg({ color = "#e0527e" }: { color?: string }) {
  return (
    <svg width="230" height="96" viewBox="0 0 230 96" aria-hidden="true">
      <ellipse cx="115" cy="88" rx="88" ry="7" fill="#a8c8e2" opacity="0.5" />
      <path
        d="M22 62c0-14 19-24 52-26l17-16h37l9 18c25 2 48 10 52 22l-9 10H30z"
        fill={color}
      />
      <path d="M113 20h15l9 18-26 4z" fill="#ffffff" opacity="0.85" />
      <rect x="152" y="18" width="38" height="9" rx="4" fill="#3a3532" />
      <rect x="166" y="25" width="8" height="37" fill="#3a3532" />
      <circle cx="58" cy="74" r="17" fill="#3a3532" />
      <circle cx="58" cy="74" r="8" fill="#fff" />
      <circle cx="58" cy="74" r="3" fill="#ffd23e" />
      <circle cx="164" cy="74" r="17" fill="#3a3532" />
      <circle cx="164" cy="74" r="8" fill="#fff" />
      <circle cx="164" cy="74" r="3" fill="#ffd23e" />
      <circle cx="106" cy="30" r="11" fill="#ffd23e" />
      <rect x="96" y="26" width="20" height="7" rx="3.5" fill="#3a3532" />
    </svg>
  );
}

export function GalleryCarSvg({ color = "#e0527e" }: { color?: string }) {
  return (
    <svg
      width="86"
      height="38"
      viewBox="0 0 86 38"
      aria-hidden="true"
      style={{ display: "block", margin: "2px auto 0" }}
    >
      <path
        d="M8 26c0-6 8-10 19-11l6-6h14l4 7c9 1 17 4 20 9l-4 4H11z"
        fill={color}
      />
      <rect x="56" y="6" width="13" height="4" rx="2" fill="#3a3532" />
      <rect x="61" y="9" width="3.4" height="14" fill="#3a3532" />
      <circle cx="24" cy="28" r="6.4" fill="#3a3532" />
      <circle cx="24" cy="28" r="2.6" fill="#fff" />
      <circle cx="62" cy="28" r="6.4" fill="#3a3532" />
      <circle cx="62" cy="28" r="2.6" fill="#fff" />
      <circle cx="41" cy="11" r="4.4" fill="#ffd23e" />
    </svg>
  );
}

// A small, deterministic palette keyed by team/constructor slug so the same
// team always renders the same car color across pages. Falls back to the
// prototype's default pink accent for anything not in the table.
const TEAM_COLORS: Record<string, string> = {
  ferrari: "#c8102e",
  mclaren: "#ff8000",
  williams: "#00a3e0",
  mercedes: "#00d2be",
  "red-bull": "#1e41ff",
  renault: "#ffd23e",
  lotus: "#f5c800",
  brabham: "#1a3e6f",
  tyrrell: "#0a5c36",
  benetton: "#1a8f4c",
  brm: "#0a5c36",
  cooper: "#1a8f4c",
  matra: "#0a2f8f",
  vanwall: "#1a8f4c",
  "alfa-romeo": "#a6051a",
  maserati: "#a6051a",
};

export function colorForTeamSlug(slug: string | undefined): string {
  if (!slug) {
    return "#e0527e";
  }
  return TEAM_COLORS[slug] ?? "#e0527e";
}

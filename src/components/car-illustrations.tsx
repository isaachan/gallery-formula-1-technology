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

export type GalleryCarProfile =
  | "front-engine"
  | "cigar"
  | "wedge"
  | "ground-effect"
  | "turbo"
  | "raised-nose"
  | "grooved-tyre"
  | "narrow-wing"
  | "wide-hybrid"
  | "ground-effect-return";

type GalleryCarLivery = {
  primary: string;
  accent: string;
  pattern: "solid" | "speedmark" | "centre-stripe" | "nose-band" | "two-tone";
};

const GALLERY_CAR_PROFILES: Array<{
  startsAt: number;
  profile: GalleryCarProfile;
  label: string;
}> = [
  { startsAt: 1950, profile: "front-engine", label: "前置引擎" },
  { startsAt: 1958, profile: "cigar", label: "中置雪茄型" },
  { startsAt: 1968, profile: "wedge", label: "楔形大翼" },
  { startsAt: 1977, profile: "ground-effect", label: "初代地效" },
  { startsAt: 1983, profile: "turbo", label: "涡轮时代" },
  { startsAt: 1991, profile: "raised-nose", label: "高鼻翼" },
  { startsAt: 1998, profile: "grooved-tyre", label: "沟槽胎" },
  { startsAt: 2009, profile: "narrow-wing", label: "窄尾翼" },
  { startsAt: 2017, profile: "wide-hybrid", label: "宽体混动" },
  { startsAt: 2022, profile: "ground-effect-return", label: "新地效" },
];

export function galleryCarProfileForSeason(year: number): GalleryCarProfile {
  return GALLERY_CAR_PROFILES.reduce(
    (active, candidate) => (year >= candidate.startsAt ? candidate : active),
    GALLERY_CAR_PROFILES[0],
  ).profile;
}

export function galleryCarProfileLabel(profile: GalleryCarProfile): string {
  return (
    GALLERY_CAR_PROFILES.find((candidate) => candidate.profile === profile)
      ?.label ?? "赛车轮廓"
  );
}

function galleryCarLiveryForTeam(
  teamSlug: string | undefined,
  seasonYear: number,
  fallbackColor: string,
): GalleryCarLivery {
  switch (teamSlug) {
    case "ferrari":
      return { primary: "#c8102e", accent: "#ffd23e", pattern: "solid" };
    case "mclaren":
      return seasonYear < 1997
        ? { primary: "#f8f5ed", accent: "#d71920", pattern: "speedmark" }
        : { primary: "#ff8000", accent: "#15213a", pattern: "speedmark" };
    case "williams":
      return {
        primary: "#00a3e0",
        accent: "#ffd23e",
        pattern: "centre-stripe",
      };
    case "lotus":
      return seasonYear >= 1972 && seasonYear <= 1986
        ? { primary: "#1c1b1a", accent: "#d9ae3d", pattern: "centre-stripe" }
        : { primary: "#1a8f4c", accent: "#f5c800", pattern: "nose-band" };
    case "benetton":
      return { primary: "#1a8f4c", accent: "#f6d542", pattern: "two-tone" };
    case "brabham":
    case "tyrrell":
    case "matra":
      return {
        primary: fallbackColor,
        accent: "#ffffff",
        pattern: "nose-band",
      };
    case "mercedes":
    case "renault":
    case "red-bull":
    case "alfa-romeo":
    case "maserati":
      return { primary: fallbackColor, accent: "#ffffff", pattern: "two-tone" };
    default:
      return {
        primary: fallbackColor,
        accent: "#ffffff",
        pattern: "centre-stripe",
      };
  }
}

function GalleryCarBody({
  profile,
  color,
}: {
  profile: GalleryCarProfile;
  color: string;
}) {
  switch (profile) {
    case "front-engine":
      return <path d="M11 24h11l8-7h26l12 5v5H14z" fill={color} />;
    case "cigar":
      return <path d="M10 25c3-6 13-9 26-9h22l12 7-4 4H13z" fill={color} />;
    case "wedge":
      return <path d="M9 26h16l10-12h18l6 8 14 2-4 5H12z" fill={color} />;
    case "ground-effect":
      return <path d="M8 26h16l7-12h21l8 8 13 2-4 5H11z" fill={color} />;
    case "turbo":
      return <path d="M8 26h17l7-11h18l7 7 16 2-5 5H11z" fill={color} />;
    case "raised-nose":
      return <path d="M8 25h18l7-11h18l6 7 16 2-5 5H11z" fill={color} />;
    case "grooved-tyre":
      return <path d="M8 26h18l8-10h17l7 6 15 2-5 5H11z" fill={color} />;
    case "narrow-wing":
      return <path d="M8 25h18l8-11h17l8 8 14 1-5 6H11z" fill={color} />;
    case "wide-hybrid":
      return <path d="M7 26h20l7-12h19l7 8 15 1-5 6H10z" fill={color} />;
    case "ground-effect-return":
      return <path d="M7 26h20l8-12h19l8 8 14 1-5 6H10z" fill={color} />;
  }
}

function GalleryCarLiveryMarks({ livery }: { livery: GalleryCarLivery }) {
  switch (livery.pattern) {
    case "speedmark":
      return <path d="M18 25h19l17-9h8l-17 11H25z" fill={livery.accent} />;
    case "centre-stripe":
      return <path d="M38 15h7l9 13h-7z" fill={livery.accent} />;
    case "nose-band":
      return <path d="M13 23h14l-5 5H10z" fill={livery.accent} />;
    case "two-tone":
      return <path d="M49 17h9l13 8-5 3H52z" fill={livery.accent} />;
    case "solid":
      return <path d="M34 17h16l-3 3H32z" fill={livery.accent} opacity="0.8" />;
  }
}

export function GalleryCarSvg({
  seasonYear = 2022,
  teamSlug,
  color = "#e0527e",
}: {
  seasonYear?: number;
  teamSlug?: string;
  color?: string;
}) {
  const profile = galleryCarProfileForSeason(seasonYear);
  const livery = galleryCarLiveryForTeam(teamSlug, seasonYear, color);

  return (
    <svg
      width="86"
      height="38"
      viewBox="0 0 86 38"
      aria-hidden="true"
      data-livery={livery.pattern}
      data-profile={profile}
      style={{ display: "block", margin: "2px auto 0" }}
    >
      <rect x="57" y="7" width="14" height="3.8" rx="1.9" fill="#3a3532" />
      <rect x="61" y="10" width="3.2" height="12" fill="#3a3532" />
      <GalleryCarBody profile={profile} color={livery.primary} />
      <GalleryCarLiveryMarks livery={livery} />
      <circle cx="24" cy="28" r="6.4" fill="#3a3532" />
      <circle cx="24" cy="28" r="2.6" fill="#fff" />
      <circle cx="62" cy="28" r="6.4" fill="#3a3532" />
      <circle cx="62" cy="28" r="2.6" fill="#fff" />
      {profile === "grooved-tyre" ? (
        <>
          <path
            d="M20 25v6M23 24v7M58 25v6M61 24v7"
            stroke="#a8c8e2"
            strokeWidth="0.8"
          />
        </>
      ) : null}
      {profile === "turbo" ? (
        <path d="M38 15h8l2-6h-9z" fill="#ffd23e" />
      ) : null}
      {profile === "front-engine" ? (
        <circle cx="48" cy="20" r="3.2" fill="#ffd23e" />
      ) : null}
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

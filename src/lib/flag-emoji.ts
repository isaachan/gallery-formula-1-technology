// ISO 3166-1 alpha-3 -> flag emoji for every country code actually present
// in content/circuits/*.json's countryCode field. Alpha-3 codes have no
// algorithmic mapping to regional-indicator flag emoji (unlike alpha-2), so
// this is a direct lookup table rather than a derived transform.
const ALPHA3_TO_FLAG: Record<string, string> = {
  ARE: "🇦🇪",
  ARG: "🇦🇷",
  AUS: "🇦🇺",
  AUT: "🇦🇹",
  AZE: "🇦🇿",
  BEL: "🇧🇪",
  BHR: "🇧🇭",
  BRA: "🇧🇷",
  CAN: "🇨🇦",
  CHE: "🇨🇭",
  CHN: "🇨🇳",
  DEU: "🇩🇪",
  ESP: "🇪🇸",
  FRA: "🇫🇷",
  GBR: "🇬🇧",
  HUN: "🇭🇺",
  IND: "🇮🇳",
  ITA: "🇮🇹",
  JPN: "🇯🇵",
  KOR: "🇰🇷",
  MAR: "🇲🇦",
  MCO: "🇲🇨",
  MEX: "🇲🇽",
  MYS: "🇲🇾",
  NLD: "🇳🇱",
  PRT: "🇵🇹",
  QAT: "🇶🇦",
  RUS: "🇷🇺",
  SAU: "🇸🇦",
  SGP: "🇸🇬",
  SWE: "🇸🇪",
  TUR: "🇹🇷",
  USA: "🇺🇸",
  ZAF: "🇿🇦",
};

export function flagEmojiForCountryCode(
  countryCode: string | undefined,
): string {
  if (!countryCode) {
    return "🏁";
  }
  return ALPHA3_TO_FLAG[countryCode] ?? "🏁";
}

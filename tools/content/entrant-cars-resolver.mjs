// Entity resolution for the entrant-cars pipeline.
//
// resolveConstructorId({ link, display, year }) -> teamId | null
//   Maps a Wikipedia constructor link/display + season year to a repository team id.
//   Returns null when no verifiable match exists (obscure privateer constructors that
//   have no team document); the caller logs these rather than guessing.
//
// resolveDriverIds(driverNames, { personsByNormalized }) -> { ids, unresolved }
//   Maps Wikipedia driver display names to person ids via normalized exact match.

// Ordered rules. First match wins. Each rule may constrain link (string equality),
// linkRegex, displayRegex, and year range. Same-name-different-organization cases
// (Team Lotus 1980s vs 2010s, Honda 1960s vs 2000s, Mercedes-Benz 1950s vs 2010s+,
// Alfa Romeo works vs Sauber-run, Sauber lineage through Alfa/Kick rebrands) are all
// encoded explicitly here, extending the precedents set by US-G03.1–US-G03.5.
const RULES = [
  // --- Same-name-different-organization (year-scoped) ---
  {
    link: "Team Lotus (2010–11)",
    teamId: "team-lotus-f1-team",
  },
  {
    link: "Team Lotus (2010–2011)",
    teamId: "team-lotus-f1-team",
  },
  {
    linkRegex: /^Lotus F1$/,
    teamId: "team-lotus-f1-team",
  },
  {
    link: "Team Lotus",
    yearMin: 2010,
    yearMax: 2011,
    teamId: "team-lotus-f1-team",
  },
  {
    link: "Team Lotus",
    teamId: "team-lotus",
  },
  {
    link: "Honda in Formula One",
    yearMin: 1960,
    yearMax: 1968,
    teamId: "team-honda-rd-1960s",
  },
  {
    linkRegex: /^Honda F1$/,
    yearMin: 1960,
    yearMax: 1968,
    teamId: "team-honda-rd-1960s",
  },
  {
    link: "Honda Racing F1",
    yearMin: 1960,
    yearMax: 1968,
    teamId: "team-honda-rd-1960s",
  },
  {
    linkRegex: /^Honda( in Formula One| F1| Racing F1)?$/,
    yearMin: 2000,
    yearMax: 2008,
    teamId: "team-honda",
  },
  {
    link: "Mercedes-Benz in Formula One",
    yearMin: 1950,
    yearMax: 1955,
    teamId: "team-mercedes-benz-1950s",
  },
  {
    link: "Mercedes-Benz in Formula One",
    yearMin: 2010,
    teamId: "team-mercedes",
  },
  {
    // Alfa Romeo marqueship on the Sauber-run team (2019–2023).
    link: "Alfa Romeo in Formula One",
    yearMin: 2019,
    yearMax: 2023,
    teamId: "team-alfa-romeo-racing",
  },
  {
    // 1950s works Alfa + any earlier-era Alfa constructor use the works team record.
    link: "Alfa Romeo in Formula One",
    teamId: "team-alfa-romeo",
  },
  // Sauber lineage through rebrands.
  {
    link: "Sauber Motorsport",
    yearMin: 2024,
    teamId: "team-kick-sauber",
  },
  {
    link: "Sauber",
    yearMin: 1993,
    yearMax: 2018,
    teamId: "team-sauber",
  },
  // Red Bull family / sister-team renames.
  { link: "Racing Bulls", teamId: "team-racing-bulls" },
  { link: "RB Formula One Team", teamId: "team-rb" },
  { link: "Red Bull Racing", teamId: "team-red-bull" },
  { link: "Scuderia AlphaTauri", teamId: "team-alphatauri" },
  { link: "Scuderia Toro Rosso", teamId: "team-toro-rosso" },
  // Racing Point / Aston Martin lineage.
  { link: "Aston Martin in Formula One", teamId: "team-aston-martin" },
  { link: "Racing Point F1 Team", teamId: "team-racing-point" },
  // Jordan → Midland → Spyker → Force India → Racing Point → Aston Martin chain.
  { link: "Midland F1 Racing", teamId: "team-mf1" },
  { link: "Spyker F1", teamId: "team-spyker" },
  { linkRegex: /^Force(&nbsp;| )India$/, teamId: "team-force-india" },
  // Honda → BAR lineage (BAR 1999–2005, then Honda 2006–2008).
  { link: "British American Racing", teamId: "team-bar" },
  // Toleman → Benetton → Renault chain.
  { link: "Toleman", teamId: "team-toleman" },
  // Stewart → Jaguar → Red Bull chain.
  { link: "Stewart Grand Prix", teamId: "team-stewart" },
  { link: "Jaguar Racing", teamId: "team-jaguar" },
  // Wolf / Wolf-Williams lineage (Walter Wolf progressively bought Frank Williams).
  { linkRegex: /^Wolf-Williams Racing$/, teamId: "team-wolf" },
  { link: "Walter Wolf Racing", teamId: "team-wolf" },
  // Virgin → Marussia → Manor chain.
  {
    link: "Virgin Racing",
    yearMin: 2010,
    yearMax: 2011,
    teamId: "team-virgin",
  },
  { link: "Marussia F1", teamId: "team-marussia" },
  { link: "Manor Racing", teamId: "team-manor" },
  // Brawn (2009 one-off, ex-Honda).
  { link: "Brawn GP", teamId: "team-brawn" },
  // Toyota works.
  {
    linkRegex: /^Toyota( in Formula One| Racing \(Formula One team\))?$/,
    teamId: "team-toyota",
  },
  // Renault works (constructor link varies by year).
  { linkRegex: /^Renault( in Formula One| F1)?$/, teamId: "team-renault" },

  // --- Unambiguous direct link → team ---
  { link: "Scuderia Ferrari", teamId: "team-ferrari" },
  { link: "McLaren", teamId: "team-mclaren" },
  {
    linkRegex: /^Williams( F1| Grand Prix Engineering| Racing)?$/,
    teamId: "team-williams",
  },
  { link: "Benetton Formula", teamId: "team-benetton" },
  { link: "Brabham", teamId: "team-brabham" },
  { link: "Tyrrell Racing", teamId: "team-tyrrell" },
  { link: "Minardi", teamId: "team-minardi" },
  { link: "Arrows Grand Prix International", teamId: "team-arrows" },
  { link: "Footwork Arrows", teamId: "team-footwork" },
  { link: "Leyton House Racing", teamId: "team-leyton-house" },
  { link: "March Engineering", teamId: "team-march" },
  { link: "Larrousse", teamId: "team-larrousse" },
  { link: "Ligier", teamId: "team-ligier" },
  { link: "Equipe Ligier", teamId: "team-ligier" },
  { link: "Équipe Ligier", teamId: "team-ligier" },
  { link: "Equipe Matra Sports", teamId: "team-matra" },
  { link: "Osella", teamId: "team-osella" },
  { link: "Scuderia Coloni", teamId: "team-coloni" },
  { link: "Enzo Coloni Racing Car Systems", teamId: "team-coloni" },
  { link: "EuroBrun", teamId: "team-eurobrun" },
  { link: "Rial Racing", teamId: "team-rial" },
  { link: "Zakspeed", teamId: "team-zakspeed" },
  { link: "Dallara", teamId: "team-dallara" },
  { link: "BMS Scuderia Italia", teamId: "team-dallara" },
  { link: "Automobiles Gonfaronnages Sportives", teamId: "team-ags" },
  { link: "Ensign Racing", teamId: "team-ensign" },
  { link: "Fittipaldi Automotive", teamId: "team-fittipaldi" },
  { link: "Shadow Racing Cars", teamId: "team-shadow" },
  { link: "Surtees Racing Organisation", teamId: "team-surtees" },
  { link: "Hesketh Racing", teamId: "team-hesketh" },
  { link: "Embassy Hill", teamId: "team-hill" },
  { link: "BRM", teamId: "team-brm" },
  { link: "British Racing Motors", teamId: "team-brm" },
  { link: "British Racing Partnership", teamId: "team-brp" },
  { link: "Cooper Car Company", teamId: "team-cooper" },
  { link: "Connaught Engineering", teamId: "team-connaught" },
  { link: "Vanwall", teamId: "team-vanwall" },
  { link: "Gordini", teamId: "team-gordini" },
  { link: "Simca-Gordini", teamId: "team-gordini" },
  { link: "Maserati in motorsport", teamId: "team-maserati" },
  { link: "Talbot-Lago", teamId: "team-talbot-lago" },
  { link: "Lancia", teamId: "team-lancia" },
  { link: "Porsche", teamId: "team-porsche" },
  {
    linkRegex: /^Porsche in motorsport(#Formula One)?$/,
    teamId: "team-porsche",
  },
  { link: "Penske Racing", teamId: "team-penske" },
  { link: "Vel's Parnelli Jones Racing", teamId: "team-parnelli" },
  { link: "Parnelli", teamId: "team-parnelli" },
  { link: "Anglo American Racers", teamId: "team-eagle" },
  { link: "Kurtis Kraft", teamId: "team-kurtis-kraft" },
  { link: "Scuderia Milano", teamId: "team-milano-speluzzi" },
  // English Racing Automobiles (ERA): no dedicated team record in the repository;
  // intentionally omitted so it falls through to null and is logged for review.
  { link: "Tecno (motorsport)", teamId: "team-tecno" },
  { link: "Theodore Racing", teamId: "team-theodore" },
  { link: "Venturi Automobiles", teamId: "team-venturi" },
  { link: "Prost Grand Prix", teamId: "team-prost" },
  { link: "Jordan Grand Prix", teamId: "team-jordan" },
  { link: "Caterham F1", teamId: "team-caterham" },
  { link: "HRT Formula 1 Team", teamId: "team-hrt" },
  { link: "Haas F1 Team", teamId: "team-haas" },
  { link: "Super Aguri F1", teamId: "team-super-aguri" },
  { link: "Alpine F1 Team", teamId: "team-alpine" },
  { link: "Onyx Grand Prix", teamId: "team-onyx" },
  // Lola: two distinct operations. 1960s works Lola → team-lola-cars-1960s; the
  // 1988+ Larrousse-Lola entrant uses the existing team-lola record. Year-scoped.
  {
    linkRegex: /^Lola( Cars| Racing Cars)$/,
    yearMin: 1960,
    yearMax: 1969,
    teamId: "team-lola-cars-1960s",
  },
  {
    link: "MasterCard Lola",
    teamId: "team-lola",
  },
  {
    linkRegex: /^Lola( Cars| Racing Cars)?$/,
    teamId: "team-lola",
  },
];

export function resolveConstructorId({ link, display, year }) {
  const linkStr = link || "";
  const displayStr = display || "";
  for (const rule of RULES) {
    if (rule.link !== undefined && rule.link !== linkStr) continue;
    if (rule.linkRegex !== undefined && !rule.linkRegex.test(linkStr)) continue;
    if (rule.displayRegex !== undefined && !rule.displayRegex.test(displayStr))
      continue;
    if (
      rule.yearMin !== undefined &&
      (year === undefined || year < rule.yearMin)
    )
      continue;
    if (
      rule.yearMax !== undefined &&
      (year === undefined || year > rule.yearMax)
    )
      continue;
    return rule.teamId;
  }
  return null;
}

// Normalize a driver name for matching: lowercase, strip accents, collapse spaces
// and punctuation. Wikipedia display names like "Carlos Sainz Jr." should match a
// person record titled "Carlos Sainz Jr.".
export function normalizeName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Build a lookup index from person documents: normalized title.en -> person id.
// Falls back to normalized slug if title.en is missing.
export function buildPersonIndex(persons) {
  const index = new Map();
  for (const p of persons) {
    const en = p.title?.en;
    if (en) {
      const key = normalizeName(en);
      if (key && !index.has(key)) index.set(key, p.id);
    }
  }
  return index;
}

// Resolve a list of Wikipedia driver display names to person ids.
// Returns { ids, unresolved }. Unresolved names are surfaced for review rather
// than silently dropped or guessed. Resolution passes:
//   1. Exact normalized match against the global person index.
//   2. Generational suffix (Jr./Sr.) stripped — "Carlos Sainz Jr." -> "Carlos Sainz".
//   3. Surname fallback against the season's standings-derived surname index, but
//      ONLY when that surname uniquely identifies one driver in the season (so
//      "Hill" in a year with both Graham and Phil Hill stays unresolved). This is
//      how "Giuseppe Farina" safely resolves to the record titled "Nino Farina".
export function resolveDriverIds(driverNames, personIndex, surnameIndex) {
  const ids = [];
  const unresolved = [];
  const seen = new Set();
  for (const name of driverNames) {
    const key = normalizeName(name);
    let id = personIndex.get(key);
    if (!id) {
      const stripped = key.replace(/\s+(jr|sr)$/i, "").trim();
      if (stripped !== key) id = personIndex.get(stripped);
    }
    if (!id && surnameIndex) {
      const surname = key.split(" ").pop();
      const hit = surnameIndex.get(surname);
      if (hit && hit.count === 1) id = hit.id;
    }
    if (id) {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    } else {
      unresolved.push(name);
    }
  }
  return { ids, unresolved };
}

// Build a per-season surname index from driver-standings entries.
// Maps normalized surname -> { id, count }. Callers should only use entries where
// count === 1 (unique surname in that season) to avoid ambiguous matches.
export function buildSeasonSurnameIndex(standingEntries, personsById) {
  const tally = new Map();
  for (const entry of standingEntries || []) {
    const person = personsById.get(entry.competitorId);
    if (!person || !person.title?.en) continue;
    const surname = normalizeName(person.title.en).split(" ").pop();
    if (!surname) continue;
    const existing = tally.get(surname);
    if (existing) {
      existing.count += 1;
      if (existing.id !== person.id) existing.count += 1; // ensure distinct-person collision raises count
    } else {
      tally.set(surname, { id: person.id, count: 1 });
    }
  }
  return tally;
}

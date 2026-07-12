function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'");
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " "));
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function extractLinkedText(cellHtml) {
  const anchorMatch = cellHtml.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i);

  if (!anchorMatch) {
    return null;
  }

  const withoutSvg = anchorMatch[1].replace(/<svg[\s\S]*?<\/svg>/gi, " ");
  return normalizeWhitespace(stripTags(withoutSvg));
}

function cleanFlagPrefix(value) {
  return value.replace(/^Flag of [A-Za-z' .-]+ /, "").trim();
}

function cleanDriverAbbreviation(value) {
  return value.replace(/\s+[A-Z]{3}$/, "").trim();
}

function extractTable(html) {
  const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);

  if (!tableMatch) {
    throw new Error("Could not find a results table in the supplied HTML.");
  }

  return tableMatch[1];
}

function extractHeaders(tableHtml) {
  return [...tableHtml.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(
    ([, cellHtml]) => normalizeWhitespace(stripTags(cellHtml)),
  );
}

function extractRows(tableHtml) {
  const bodyMatch = tableHtml.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : tableHtml;

  return [...bodyHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(
    ([, rowHtml]) =>
      [...rowHtml.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi)].map(
        ([, attrs, cellHtml]) => {
          const linkMatch = cellHtml.match(/<a\b[^>]*href="([^"]+)"/i);
          const linkedText = extractLinkedText(cellHtml);

          return {
            text: linkedText ?? normalizeWhitespace(stripTags(cellHtml)),
            href: linkMatch?.[1] ?? null,
            attrs,
          };
        },
      ),
  );
}

export function parseResultsTable(html) {
  const tableHtml = extractTable(html);
  const headers = extractHeaders(tableHtml);
  const rows = extractRows(tableHtml);

  return { headers, rows };
}

function findColumnIndex(headers, expected) {
  const index = headers.findIndex((header) => header === expected);

  if (index === -1) {
    throw new Error(`Could not find required "${expected}" column.`);
  }

  return index;
}

export function parseRaceResultsPage(html) {
  const { headers, rows } = parseResultsTable(html);
  const grandPrixIndex = findColumnIndex(headers, "Grand Prix");
  const dateIndex = findColumnIndex(headers, "Date");
  const winnerIndex = findColumnIndex(headers, "Winner");
  const teamIndex = findColumnIndex(headers, "Team");
  const lapsIndex = findColumnIndex(headers, "Laps");
  const timeIndex = findColumnIndex(headers, "Time");

  return rows.map((cells) => ({
    grandPrix: cleanFlagPrefix(cells[grandPrixIndex]?.text ?? ""),
    raceHref: cells[grandPrixIndex]?.href ?? null,
    date: cells[dateIndex]?.text ?? "",
    winner: cleanDriverAbbreviation(cells[winnerIndex]?.text ?? ""),
    team: cells[teamIndex]?.text ?? "",
    laps: cells[lapsIndex]?.text ?? "",
    time: cells[timeIndex]?.text ?? "",
  }));
}

function parseStandingPosition(value) {
  const normalized = value.trim();

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  return normalized;
}

export function parseDriverStandingsPage(html) {
  const { headers, rows } = parseResultsTable(html);
  const positionIndex = findColumnIndex(headers, "Pos.");
  const driverIndex = findColumnIndex(headers, "Driver");
  const nationalityIndex = findColumnIndex(headers, "Nationality");
  const teamIndex = findColumnIndex(headers, "Team");
  const pointsIndex = findColumnIndex(headers, "Pts.");

  return rows.map((cells) => ({
    position: parseStandingPosition(cells[positionIndex]?.text ?? ""),
    driver: cleanDriverAbbreviation(cells[driverIndex]?.text ?? ""),
    driverHref: cells[driverIndex]?.href ?? null,
    nationality: cells[nationalityIndex]?.text ?? "",
    team: cells[teamIndex]?.text ?? "",
    points: Number(cells[pointsIndex]?.text ?? "0"),
  }));
}

export function parseConstructorStandingsPage(html) {
  const { headers, rows } = parseResultsTable(html);
  const positionIndex = findColumnIndex(headers, "Pos.");
  const teamIndex = findColumnIndex(headers, "Team");
  const pointsIndex = findColumnIndex(headers, "Pts.");

  return rows.map((cells) => ({
    position: parseStandingPosition(cells[positionIndex]?.text ?? ""),
    team: cells[teamIndex]?.text ?? "",
    teamHref: cells[teamIndex]?.href ?? null,
    points: Number(cells[pointsIndex]?.text ?? "0"),
  }));
}

export function parseRaceWeekendHeader(html) {
  const headingMatch = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const detailsMatch = html.match(
    /<p\b[^>]*>\s*(\d{2} [A-Za-z]{3} \d{4})\s*<\/p>\s*<p\b[^>]*>([\s\S]*?)<\/p>/i,
  );

  if (!headingMatch || !detailsMatch) {
    throw new Error("Could not find the race-weekend heading metadata.");
  }

  return {
    heading: normalizeWhitespace(stripTags(headingMatch[1])),
    date: detailsMatch[1],
    circuit: normalizeWhitespace(stripTags(detailsMatch[2])),
  };
}

export async function fetchSeasonResultsPage(year, pageType) {
  const response = await fetch(
    `https://www.formula1.com/en/results/${year}/${pageType}`,
  );

  if (!response.ok) {
    throw new Error(
      `Formula1.com request failed for ${year}/${pageType}: ${response.status}`,
    );
  }

  return response.text();
}

async function main() {
  const [year, pageType = "races"] = process.argv.slice(2);

  if (!year) {
    console.error(
      "Usage: node tools/content/f1-results-parser.mjs <year> [races|drivers|team]",
    );
    process.exitCode = 1;
    return;
  }

  const html = await fetchSeasonResultsPage(year, pageType);
  let payload;

  if (pageType === "races") {
    payload = parseRaceResultsPage(html);
  } else if (pageType === "drivers") {
    payload = parseDriverStandingsPage(html);
  } else if (pageType === "team") {
    payload = parseConstructorStandingsPage(html);
  } else {
    throw new Error(`Unsupported page type "${pageType}".`);
  }

  console.log(JSON.stringify(payload, null, 2));
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  await main();
}

// Parses the "Teams and drivers" wikitext table from a Formula One season article.
//
// Usage:
//   import { fetchSeasonWikitext, parseEntrantTable } from "./entrant-cars-parser.mjs";
//   const wikitext = await fetchSeasonWikitext(1988);
//   const rows = parseEntrantTable(wikitext);
//
// Each returned row has the resolved (entrant, constructor, chassis, engine, drivers)
// for a single driver line in the source table. rowspan-aware: when the source uses
// rowspan=N to repeat constructor/chassis/engine across N driver rows, those values
// are carried forward into the subsequent rows so the caller can group by
// (constructor, chassis) without re-implementing the wikitext model.

import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";

const CACHE_DIR = path.join(os.tmpdir(), "f1-entrant-cache");

export async function ensureCacheDir() {
  await mkdir(CACHE_DIR, { recursive: true });
}

export async function fetchSeasonWikitext(year, { force = false } = {}) {
  await ensureCacheDir();
  const cachePath = path.join(CACHE_DIR, `season-${year}.txt`);
  if (!force) {
    try {
      return await readFile(cachePath, "utf8");
    } catch {
      // fall through to network fetch
    }
  }

  const title = seasonArticleTitle(year);
  const url = `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(title)}&action=raw`;
  // Node's native fetch ignores proxy env vars, but the execution environment
  // requires a proxy for egress. Use curl (which honors https_proxy) instead.
  const text = execFileSync(
    "curl",
    ["-s", "--max-time", "30", "-A", "Mozilla/5.0", url],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  if (!text || text.length < 500) {
    throw new Error(
      `Wikipedia fetch returned empty/short body for ${year} (${url})`,
    );
  }
  await writeFile(cachePath, text, "utf8");
  return text;
}

function seasonArticleTitle(year) {
  // Wikipedia's F1 season article naming boundary: 1950–1980 use "season",
  // 1981+ use "World Championship". Verified by probing action=raw across the
  // 1950–2025 range (the alternative title returns a Wikimedia error HTML page).
  if (year <= 1980) {
    return `${year} Formula One season`;
  }
  return `${year} Formula One World Championship`;
}

// Scan `s` for `{{name|...}}` invocations (with brace-balanced content) and replace
// each with its content minus the leading `name|`. Repeat until stable so nested
// same-named templates resolve. Templates that wrap display text (nowrap, small,
// italic) need their content preserved; stripping them outright would delete it.
function unwrapNamedTemplates(s, names) {
  const nameSet = new Set(names.map((n) => n.toLowerCase()));
  let prev;
  do {
    prev = s;
    s = unwrapNamedTemplatesOnce(s, nameSet);
  } while (s !== prev);
  return s;
}

function unwrapNamedTemplatesOnce(s, nameSet) {
  let out = "";
  let i = 0;
  while (i < s.length) {
    if (s[i] === "{" && s[i + 1] === "{") {
      // Try to parse a template starting here.
      const parsed = parseTemplateAt(s, i);
      if (parsed && nameSet.has(parsed.name.toLowerCase())) {
        // Replace with the content after the first pipe (the unnamed first param).
        out += parsed.content;
        i = parsed.end;
        continue;
      }
    }
    out += s[i];
    i++;
  }
  return out;
}

// Parse a template beginning at index `start` (where s[start..start+1] === "{{").
// Returns { name, content, end } where `content` is everything after the first pipe
// (or the whole inner text if no pipe) and `end` is the index just past `}}`.
// Returns null if the braces do not balance within a reasonable window.
function parseTemplateAt(s, start) {
  let i = start + 2;
  let depth = 1;
  let nameEnd = -1;
  // First, read the template name up to the first `|` or the closing `}}`.
  while (i < s.length && depth > 0) {
    if (s[i] === "{" && s[i + 1] === "{") {
      depth++;
      i += 2;
    } else if (s[i] === "}" && s[i + 1] === "}") {
      depth--;
      i += 2;
      if (depth === 0) break;
    } else if (s[i] === "[" && s[i + 1] === "[") {
      // Skip over a wikilink so its contents don't confuse brace counting.
      i += 2;
      let ldepth = 1;
      while (i < s.length && ldepth > 0) {
        if (s[i] === "[" && s[i + 1] === "[") {
          ldepth++;
          i += 2;
        } else if (s[i] === "]" && s[i + 1] === "]") {
          ldepth--;
          i += 2;
        } else {
          i++;
        }
      }
    } else if (s[i] === "|" && depth === 1 && nameEnd === -1) {
      nameEnd = i;
      i++;
    } else {
      i++;
    }
  }
  if (depth !== 0) return null;
  const end = i; // just past the final }}
  const inner = s.slice(start + 2, end - 2);
  const namePart = nameEnd === -1 ? inner : s.slice(start + 2, nameEnd);
  const name = namePart.trim();
  // content = everything after the first pipe (the unnamed first parameter for
  // nowrap/small/italic). If no pipe, content is empty.
  const content = nameEnd === -1 ? "" : s.slice(nameEnd + 1, end - 2);
  return { name, content, end };
}

// Strip wikitext markup from a cell's raw text and return a readable string.
// Keeps the structure (e.g. <br> line breaks become \n) so the caller can split.
function stripWiki(value) {
  if (value == null) return "";
  let s = String(value);

  // 1. Remove HTML comments <!-- ... -->.
  s = s.replace(/<!--[\s\S]*?-->/g, "");

  // 2. Remove ref tags and their content (may span lines, may contain links).
  s = s.replace(/<ref\b[^>]*\/>/gi, "");
  s = s.replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, "");

  // 3. Remove media/file links entirely (these are flag/image icons, not content).
  s = s.replace(/\[\[(?:File|Image|Media):[^\]]*\]\]/gi, "");

  // 4. Unwrap templates whose content IS meaningful (they wrap display text).
  //    {{nowrap|X}} -> X , {{Tooltip|X|Y}} -> X , {{H:title|X|Y}} -> X.
  //    Use a brace-balanced scanner so nesting (e.g. {{nowrap|{{flagg|..}}X}}) is
  //    handled correctly — a simple regex would fail when inner templates are later
  //    stripped and the outer nowrap suddenly becomes brace-free.
  s = unwrapNamedTemplates(s, ["nowrap", "italic", "small"]);

  // 5. Strip all remaining templates {{...}} iteratively (handles nesting + multiline).
  let prev;
  let cur = s;
  let iterations = 0;
  do {
    prev = cur;
    cur = cur.replace(/\{\{[^{}]*\}\}/g, "");
    iterations += 1;
  } while (cur !== prev && iterations < 30);
  // Catch leftover multiline templates that survived (no nested braces).
  cur = cur.replace(/\{\{[\s\S]*?\}\}/g, "");
  s = cur;

  // 5. Replace <br> (and variants) with newline so callers can split drivers.
  s = s.replace(/<br\s*\/?>/gi, "\n");

  // 6. Resolve wiki links: [[Target|Display]] -> Display ; [[Target]] -> Target.
  s = s.replace(/\[\[([^\[\]\|]*)\|([^\[\]]*)\]\]/g, "$2");
  s = s.replace(/\[\[([^\[\]\|]*)\]\]/g, "$1");
  // Remove any leftover wikilink brackets.
  s = s.replace(/\[\[|\]\]/g, "");

  // 7. Strip remaining HTML tags.
  s = s.replace(/<[^>]+>/g, "");

  // 8. Decode common HTML entities.
  s = decodeEntities(s);

  // 9. Remove any leftover unclosed template/link fragments. When a ref or cite
  //    template spans a line break that the cell tokenizer cut, we may be left
  //    with a dangling `{{...` (no closing braces). Strip from the first unclosed
  //    brace to end of string — driver/constructor names never legitimately
  //    contain `{` or `[`.
  s = s.replace(/\{\{[\s\S]*$/g, ""); // dangling template opener
  s = s.replace(/\[\[[\s\S]*$/g, ""); // dangling link opener

  // 10. Collapse horizontal whitespace; trim each line; drop empty lines.
  s = s
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return s;
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&mdash;/g, "\u2014");
}

// Extract the raw wikitext link target of the FIRST [[...]] in the cell.
// Used to identify the constructor (e.g. "Scuderia Ferrari" from "[[Scuderia Ferrari|Ferrari]]").
function firstLinkTarget(value) {
  if (value == null) return null;
  const m = String(value).match(/\[\[([^\[\]\|]+)/);
  if (!m) return null;
  return m[1].trim();
}

// Split a wikitext table into a matrix of raw cell strings, honoring rowspan.
// Returns { headers: string[], rows: { raw: string, isHeader: boolean }[][] }.
// Each "row" in the result corresponds to one logical table row, with carried-down
// cells already populated.
export function tokenizeTable(tableText) {
  // Normalize line endings, drop leading/trailing table braces.
  const lines = tableText.replace(/\r\n/g, "\n").split("\n");

  // Collect logical rows. A row starts at `|-` (or the first content after `{|`).
  // Each row's cells may span multiple physical lines OR be inline.
  const logicalRows = [];
  let currentCells = [];

  const flushRow = () => {
    if (currentCells.length > 0) {
      logicalRows.push(currentCells);
    }
    currentCells = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("{|") || line.startsWith("|}")) continue;
    if (line.startsWith("|+")) continue; // caption
    if (line.startsWith("|-")) {
      flushRow();
      continue;
    }
    // A line that starts with `|` or `!` begins one or more new cells. A line
    // that starts with anything else (e.g. a `{{template}}` or bare text on the
    // line after a cell opener) is a continuation of the previous cell's content
    // — wikitext cells can span multiple physical lines.
    if (line.startsWith("|") || line.startsWith("!")) {
      currentCells.push(...splitCellLine(line));
    } else if (currentCells.length > 0) {
      const last = currentCells[currentCells.length - 1];
      last.raw += `\n${line}`;
    }
  }
  flushRow();

  return logicalRows;
}

function splitCellLine(line) {
  // Determine the delimiter and prefix.
  const isHeader = line.startsWith("!");
  const prefix = isHeader ? "!" : "|";
  // Strip the leading `|` or `!` (just one).
  const body = line.slice(1);

  // Inline separator: `||` for data cells, `!!` for header cells. A line can mix.
  // Simplest: split on `||` and `!!` (greedy, but cells rarely contain these).
  const parts = body.split(/\|\||!!/);

  return parts.map((part) => ({ raw: part.trim(), isHeader }));
}

// Parse `raw` cell text into { attrs, text }.
// Forms: "value", "attrs|value", "attrs=value|value".
function parseCell(rawCell) {
  const raw = rawCell.raw;
  // The first `|` (not inside [[ ]] or {{ }}) separates attributes from content.
  const depth = trackDepth(raw);
  let splitIndex = -1;
  let brackets = 0;
  let braces = 0;
  for (let i = 0; i < depth.length; i++) {
    if (depth[i] === "[") brackets++;
    else if (depth[i] === "]") brackets--;
    else if (depth[i] === "{") braces++;
    else if (depth[i] === "}") braces--;
    if (raw[i] === "|" && brackets === 0 && braces === 0) {
      splitIndex = i;
      break;
    }
  }

  if (splitIndex === -1) {
    return { attrs: "", text: raw, rowspan: 1, colspan: 1 };
  }

  const attrs = raw.slice(0, splitIndex).trim();
  const text = raw.slice(splitIndex + 1).trim();
  const rowspanMatch = attrs.match(/rowspan\s*=\s*"?(\d+)"?/i);
  const colspanMatch = attrs.match(/colspan\s*=\s*"?(\d+)"?/i);
  const rowspan = rowspanMatch ? Number(rowspanMatch[1]) : 1;
  const colspan = colspanMatch ? Number(colspanMatch[1]) : 1;
  return { attrs, text, rowspan, colspan };
}

function trackDepth(s) {
  // Returns an array marking each bracket open/close position with its type.
  const out = new Array(s.length).fill("");
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "[" && s[i + 1] === "[") {
      out[i] = "[";
      i++;
    } else if (s[i] === "]" && s[i + 1] === "]") {
      out[i] = "]";
      i++;
    } else if (s[i] === "{" && s[i + 1] === "{") {
      out[i] = "{";
      i++;
    } else if (s[i] === "}" && s[i + 1] === "}") {
      out[i] = "}";
      i++;
    }
  }
  return out;
}

// Find the entrant table block in the article. Wikipedia F1 season articles name
// the section differently across years ("Teams and drivers", "Drivers and constructors",
// "Entries", "Entrants"), so instead of anchoring on a header we scan every `{| ... |}`
// block (including those nested inside outer layout tables, as some years wrap the
// grid in a multi-column wrapper) and return the first whose header row contains a
// Constructor-like AND a Chassis-like AND a Driver-like column.
export function findEntrantTableBlock(wikitext) {
  // Try every `{|` start position so nested tables are found too.
  let pos = 0;
  while (true) {
    const openIdx = wikitext.indexOf("{|", pos);
    if (openIdx === -1) return null;
    const endIdx = findTableEnd(wikitext, openIdx);
    if (endIdx === -1) return null;
    const block = wikitext.slice(openIdx, endIdx);
    if (isEntrantTable(block)) return block;
    pos = openIdx + 2; // advance past this opener; nested tables inside will still be
    // reached on subsequent iterations because we only advance by 2.
  }
}

function findTableEnd(wikitext, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < wikitext.length - 1; i++) {
    if (wikitext.slice(i, i + 2) === "{|") {
      depth++;
      i++;
    } else if (wikitext.slice(i, i + 2) === "|}") {
      depth--;
      i++;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

function isEntrantTable(block) {
  const logicalRows = tokenizeTable(block);
  const resolved = resolveHeaderColumns(logicalRows);
  if (!resolved) return false;
  const { columns } = resolved;
  const hasConstructor = columns.constructor !== undefined;
  const hasChassis = columns.chassis !== undefined;
  const hasDriver = columns.driver !== undefined;
  if (hasConstructor && hasChassis && hasDriver) return true;
  // Some early-era tables omit an explicit Constructor column but have
  // Entrant + Chassis + Driver.
  if (columns.entrant !== undefined && hasChassis && hasDriver) return true;
  return false;
}

// Resolve the header (single- or two-row) of a table into a column map and the
// index of the first data row. Returns null if no plausible header is found.
function resolveHeaderColumns(logicalRows) {
  let headerRowIndex = -1;
  let columns = null;
  for (let i = 0; i < Math.min(logicalRows.length, 4); i++) {
    const candidate = mapColumns(logicalRows[i]);
    // Require at least a chassis column to consider this a header.
    if (
      candidate.chassis !== undefined ||
      candidate.constructor !== undefined
    ) {
      headerRowIndex = i;
      columns = candidate;
      break;
    }
  }
  if (headerRowIndex === -1) return null;

  let dataStartIndex = headerRowIndex + 1;
  const headerRow = logicalRows[headerRowIndex];
  const headerHasRowspan2 = headerRow.some((cell) =>
    /\browspan\s*=\s*"?2"?/i.test(
      typeof cell.raw === "string" ? cell.raw : (cell.raw?.text ?? ""),
    ),
  );
  if (headerHasRowspan2 && dataStartIndex < logicalRows.length) {
    const occupied = new Set();
    let col = 0;
    for (const cell of headerRow) {
      const parsed = parseCell(cell);
      if (parsed.rowspan >= 2) occupied.add(col);
      col += parsed.colspan || 1;
    }
    const subRow = logicalRows[dataStartIndex];
    let assignCol = 0;
    for (const cell of subRow) {
      while (occupied.has(assignCol)) assignCol++;
      const text = cellText(cell).toLowerCase().trim();
      if (/^no\.?$|^no$|^number$|^#$/.test(text) && columns.no === undefined)
        columns.no = assignCol;
      else if (
        /^drivers?$|^driver name$/.test(text) &&
        columns.driver === undefined
      )
        columns.driver = assignCol;
      else if (/^rounds?$/.test(text) && columns.rounds === undefined)
        columns.rounds = assignCol;
      assignCol++;
    }
    dataStartIndex += 1;
  }
  return { columns, dataStartIndex };
}

// Convenience: given a cell from tokenizeTable ({raw, isHeader}), split off any
// wikitext cell attributes and return the stripped human-readable text.
function cellText(cell) {
  const rawStr =
    typeof cell.raw === "string" ? cell.raw : (cell.raw?.text ?? "");
  const parsed = parseCell({ raw: rawStr, isHeader: false });
  return stripWiki(parsed.text);
}

// Determine the column index for each named field based on the header row.
// `headerRow` is an array of `{ raw: string, isHeader }` (output of tokenizeTable).
// Returns a map: { entrant, constructor, chassis, engine, tyre, no, driver, rounds }.
// A header cell with colspan>1 (e.g. "Race drivers" spanning No./Driver/Rounds in
// modern two-row-header tables) is treated as a group parent and does not claim a
// leaf column; the actual leaf names come from the sub-header row.
function mapColumns(headerRow) {
  const map = {};
  headerRow.forEach((cell, index) => {
    const rawStr =
      typeof cell.raw === "string" ? cell.raw : (cell.raw?.text ?? "");
    const text = cellText(cell).toLowerCase().trim();
    const hasColspan = /colspan\s*=\s*"?[2-9]/i.test(rawStr);
    if (hasColspan) return; // group parent — leaf columns come from the sub-header.
    if (/^entrants?$/.test(text) && map.entrant === undefined)
      map.entrant = index;
    else if (/^constructors?$/.test(text)) map.constructor = index;
    else if (/^chassis$/.test(text)) map.chassis = index;
    else if (/^engine$|^power unit$|^powerunit$/.test(text)) map.engine = index;
    else if (/^tyres?$|^tires?$/.test(text)) map.tyre = index;
    else if (/^no\.?$|^no$|^number$|^#$/.test(text)) map.no = index;
    else if (/^drivers?$|^driver name$|^race drivers$/.test(text))
      map.driver = index;
    else if (/^rounds?$/.test(text)) map.rounds = index;
  });
  return map;
}

export function parseEntrantTable(wikitext) {
  const block = findEntrantTableBlock(wikitext);
  if (!block) {
    throw new Error("Could not locate entrant table block.");
  }

  const logicalRows = tokenizeTable(block);
  if (logicalRows.length === 0) {
    throw new Error("Entrant table has no rows.");
  }

  const headerResolved = resolveHeaderColumns(logicalRows);
  if (!headerResolved) {
    throw new Error("Could not identify header row in entrant table.");
  }
  const { columns, dataStartIndex } = headerResolved;

  const dataRows = logicalRows.slice(dataStartIndex);

  // Carry-forward state for rowspan cells, keyed by column index.
  const carry = {}; // col -> { text, raw, remaining }
  const out = [];

  dataRows.forEach((rowCells) => {
    // Build the resolved cell list for this row at each column index.
    // We walk the row's cells in order, filling slots; carried cells occupy their slots.
    const resolved = [];
    let cellIter = 0;
    let col = 0;

    // First, determine the maximum column we might need to fill = carry keys + row cells.
    // We'll iterate col from 0 upwards, populating from carry or from the next cell.
    const usedFromCarry = new Set();
    while (cellIter < rowCells.length || Object.keys(carry).length > 0) {
      const carried = carry[col];
      if (carried && carried.remaining > 0) {
        resolved[col] = {
          raw: carried.raw,
          text: carried.text,
          fromCarry: true,
        };
        carried.remaining -= 1;
        if (carried.remaining <= 0) delete carry[col];
        usedFromCarry.add(col);
        col++;
        continue;
      }

      if (cellIter >= rowCells.length) break;

      const parsed = parseCell(rowCells[cellIter]);
      cellIter++;
      resolved[col] = {
        raw: rowCells[cellIter - 1].raw,
        text: parsed.text,
        fromCarry: false,
      };

      if (parsed.rowspan > 1) {
        carry[col] = {
          raw: rowCells[cellIter - 1].raw,
          text: parsed.text,
          remaining: parsed.rowspan - 1,
        };
      }
      col++;
    }

    // Extract fields by mapped column.
    const get = (key) => {
      const idx = columns[key];
      if (idx === undefined) return { raw: "", text: "" };
      const cell = resolved[idx];
      if (!cell) return { raw: "", text: "" };
      return cell;
    };

    const constructorCell = get("constructor");
    const chassisCell = get("chassis");
    const engineCell = get("engine");
    const driverCell = get("driver");
    const entrantCell = get("entrant");

    // Skip rows that have no constructor AND no chassis AND no driver
    // (they're continuation/header/footer noise).
    const constructorText = stripWiki(constructorCell.text);
    const chassisText = stripWiki(chassisCell.text);
    const driverText = stripWiki(driverCell.text);
    const engineText = stripWiki(engineCell.text);
    const entrantText = stripWiki(entrantCell.text);

    if (!constructorText && !chassisText && !driverText) return;

    out.push({
      entrant: entrantText,
      constructor: constructorText,
      constructorLink: firstLinkTarget(constructorCell.raw) || "",
      chassis: chassisText,
      engine: engineText,
      drivers: driverText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  });

  return out;
}

// Group parsed rows by (constructor, chassis), merging driver lists.
// Returns an array of { constructor, constructorLink, chassis, engine, drivers[] }.
export function collapseCars(rows) {
  const map = new Map();
  for (const row of rows) {
    // Some chassis cells contain multiple chassis names separated by newlines
    // (e.g. "BT58\nBT59" when a team used two chassis). Treat each as a separate car.
    const chassisNames = row.chassis
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (chassisNames.length === 0) continue;
    for (const chassisName of chassisNames) {
      const key = `${row.constructor}__${chassisName}`.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        for (const d of row.drivers) {
          if (!existing.drivers.includes(d)) existing.drivers.push(d);
        }
      } else {
        map.set(key, {
          entrant: row.entrant,
          constructor: row.constructor,
          constructorLink: row.constructorLink,
          chassis: chassisName,
          engine: row.engine.split("\n")[0].trim(),
          drivers: [...row.drivers],
        });
      }
    }
  }
  return [...map.values()];
}

// CLI entry: dump parsed rows for one or more years to stdout for inspection.
async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    console.error(
      "Usage: node entrant-cars-parser.mjs <year> [year...] [--collapse]",
    );
    process.exitCode = 1;
    return;
  }
  const collapse = argv.includes("--collapse");
  const years = argv.filter((a) => /^\d{4}$/.test(a)).map(Number);

  for (const year of years) {
    console.log(`\n===== ${year} =====`);
    try {
      const wikitext = await fetchSeasonWikitext(year);
      const rows = parseEntrantTable(wikitext);
      if (collapse) {
        const cars = collapseCars(rows);
        for (const car of cars) {
          console.log(
            `  CONSTRUCTOR="${car.constructor}" (${car.constructorLink}) CHASSIS="${car.chassis}" ENGINE="${car.engine}" DRIVERS=[${car.drivers.join("; ")}]`,
          );
        }
        console.log(`  -> ${cars.length} unique constructor/chassis combos`);
      } else {
        for (const row of rows) {
          console.log(
            `  C="${row.constructor}" (${row.constructorLink}) CHASSIS="${row.chassis}" DRIVERS=[${row.drivers.join("; ")}]`,
          );
        }
      }
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }
}

if (process.argv[1] === path.resolve(new URL(import.meta.url).pathname)) {
  await main();
}

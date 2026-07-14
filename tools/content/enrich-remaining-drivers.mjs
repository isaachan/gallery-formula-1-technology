import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("content");

// Build name resolution indexes.
async function loadIndex(dir, type) {
  const idx = new Map();
  const files = await readDir(path.join(ROOT, dir));
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const d = JSON.parse(await readFile(path.join(ROOT, dir, f), "utf8"));
    idx.set(d.id, d.title?.zh || d.id);
  }
  return idx;
}
import { readdir } from "node:fs/promises";
async function readDir(p) {
  return readdir(p);
}

const teams = await loadIndex("teams");
const seasons = await loadIndex("seasons");

function yearOf(seasonId) {
  const m = /season-(\d{4,})$/.exec(seasonId);
  return m ? parseInt(m[1], 10) : null;
}

// Nationality zh mapping for common ones (fallback to the english nationality word).
const NAT_ZH = {
  British: "英国",
  German: "德国",
  French: "法国",
  Italian: "意大利",
  Brazilian: "巴西",
  Finnish: "芬兰",
  Austrian: "奥地利",
  Australian: "澳大利亚",
  Argentine: "阿根廷",
  Spanish: "西班牙",
  Belgian: "比利时",
  Dutch: "荷兰",
  Swedish: "瑞典",
  Danish: "丹麦",
  Japanese: "日本",
  American: "美国",
  Canadian: "加拿大",
  Mexican: "墨西哥",
  Swiss: "瑞士",
  New: "新西兰",
  Portuguese: "葡萄牙",
  South: "南非",
  Polish: "波兰",
  Russian: "俄罗斯",
  Thai: "泰国",
  Malaysian: "马来西亚",
  Indian: "印度",
  Irish: "爱尔兰",
  Colombian: "哥伦比亚",
  Venezuelan: "委内瑞拉",
  Hungarian: "匈牙利",
  Czech: "捷克",
  Zimbabwean: "津巴布韦",
  Chilean: "智利",
  Uruguayan: "乌拉圭",
  Moroccan: "摩洛哥",
  Monaco: "摩纳哥",
  Liechtensteiner: "列支敦士登",
  Estonian: "爱沙尼亚",
};

function natZh(nat) {
  if (!nat) return null;
  for (const [en, zh] of Object.entries(NAT_ZH)) {
    if (nat.startsWith(en) || nat === en) return zh;
  }
  return null;
}

function teamNamesZh(teamIds) {
  return (teamIds || []).map((t) => teams.get(t)).filter(Boolean);
}

function careerSpan(reps) {
  const years = (reps || [])
    .map(yearOf)
    .filter((y) => y !== null)
    .sort((a, b) => a - b);
  if (years.length === 0) return null;
  const lo = years[0];
  const hi = years[years.length - 1];
  return { lo, hi, years };
}

// Phrase variants for variety.
const OPENERS = [
  (zh) => `${zh}车手，`,
  (zh) => `来自${zh}的车手，`,
  (zh) => `${zh}籍车手，`,
];
const CAREER = [
  (span) => `活跃于 ${span.lo} 至 ${span.hi} 年间`,
  (span) => `职业生涯主要跨越 ${span.lo}–${span.hi} 年`,
  (span) => `在 ${span.lo} 到 ${span.hi} 年间征战 F1`,
];
const SINGLE_SEASON = [(y) => `曾参加 ${y} 赛季`, (y) => `于 ${y} 赛季登场`];
const TEAMS = [
  (names) => `先后效力于${names.join("、")}`,
  (names) => `代表${names.join("、")}出战`,
  (names) => `其 F1 生涯涵盖${names.join("、")}等车队`,
];

function pick(arr, seed) {
  return arr[seed % arr.length];
}

async function enrichDriver(file) {
  const d = JSON.parse(await readFile(file, "utf8"));
  if (d.personKind !== "driver" || (d.blocks || []).length > 0) return false;
  const slug = d.id.replace(/^person-/, "");
  const zhNat = natZh(d.nationality);
  const tnames = teamNamesZh(d.teamIds);
  const span = careerSpan(d.representativeSeasonIds);
  const name = d.title?.zh || d.title?.en || slug;

  let summaryZh = "";
  let proseZh = "";
  const seed =
    slug.length + (d.teamIds?.length || 0) + (span?.years?.length || 0);

  if (zhNat) summaryZh += `${zhNat}车手${name}，`;
  else summaryZh += `车手${name}，`;

  if (span) {
    if (span.lo === span.hi) {
      summaryZh += `活跃于 ${span.lo} 赛季`;
    } else {
      summaryZh += `活跃于 ${span.lo}–${span.hi} 年`;
    }
  } else {
    summaryZh += `曾参加 F1 世界锦标赛`;
  }
  if (tnames.length) summaryZh += `，效力于${tnames.join("、")}`;
  summaryZh += "。";

  // Prose: longer, varied.
  const parts = [];
  parts.push(`${name}是${zhNat ? "一位" + zhNat + "籍" : "一位"}F1 车手。`);
  if (span) {
    if (span.lo === span.hi) {
      parts.push(pick(SINGLE_SEASON, seed)(span.lo) + "的 F1 锦标赛。");
    } else {
      parts.push(pick(CAREER, seed)(span) + "。");
    }
  }
  if (tnames.length) {
    parts.push(
      pick(TEAMS, seed + 1)(tnames) +
        (tnames.length > 1 ? "等车队" : "车队") +
        "。",
    );
  }
  if (d.championshipYears && d.championshipYears.length) {
    parts.push(`他在${d.championshipYears.join("、")}年夺得车手世界冠军。`);
  } else {
    parts.push(
      `虽未夺得世界冠军，但其 ${span ? `${span.years.length} 个赛季的` : ""}参赛经历，仍是 F1 历史拼图的一部分。`,
    );
  }
  proseZh = parts.join("");

  const summaryEn = `${d.nationality || ""} driver ${d.title?.en || name}, active ${span ? (span.lo === span.hi ? `in ${span.lo}` : `${span.lo}–${span.hi}`) : "in F1"}${tnames.length ? `, racing for ${tnames.length > 1 ? "teams including " : ""}${(d.teamIds || []).map((t) => t.replace(/^team-/, "")).join(", ")}` : ""}.`;

  d.summary = { zh: summaryZh, en: summaryEn };
  d.blocks = [
    {
      id: `${slug}-bio`,
      type: "richText",
      heading: { zh: "参赛生涯" },
      content: { zh: proseZh },
    },
  ];
  d.updatedAt = "2026-07-14T12:00:00.000Z";
  await writeFile(file, JSON.stringify(d, null, 2) + "\n", "utf8");
  return true;
}

const peopleDir = path.join(ROOT, "people");
const files = (await readdir(peopleDir)).filter((f) => f.endsWith(".json"));
let count = 0;
for (const f of files) {
  if (await enrichDriver(path.join(peopleDir, f))) count++;
}
console.log(`Enriched ${count} non-champion drivers.`);

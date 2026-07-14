import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("content");
const BOOK = "source-book-f1-illustrated-engineering";

async function loadTitles(dir) {
  const idx = new Map();
  for (const f of await readdir(path.join(ROOT, dir))) {
    if (!f.endsWith(".json")) continue;
    const d = JSON.parse(await readFile(path.join(ROOT, dir, f), "utf8"));
    idx.set(d.id, d.title?.zh || d.title?.en || d.id);
  }
  return idx;
}

const teamTitles = await loadTitles("teams");
const carTitles = await loadTitles("cars");
const peopleTitles = await loadTitles("people");
const seasonTitles = await loadTitles("seasons");

function yearOf(id) {
  const m = /(\d{4,})$/.exec(id || "");
  return m ? parseInt(m[1], 10) : null;
}
function spanOf(ids) {
  const years = (ids || [])
    .map(yearOf)
    .filter((y) => y !== null)
    .sort((a, b) => a - b);
  if (!years.length) return null;
  return { lo: years[0], hi: years[years.length - 1], count: years.length };
}
function names(ids, map) {
  return (ids || []).map((i) => map.get(i)).filter(Boolean);
}

// ---------- TEAMS ----------
const TEAM_OPENERS = [
  (n) => `${n} 是 F1 历史上的一支参赛车队`,
  (n) => `${n} 车队曾参加 F1 世界锦标赛`,
  (n) => `${n} 是一支 F1 车队`,
];
async function enrichTeams() {
  const dir = path.join(ROOT, "teams");
  let count = 0;
  for (const f of await readdir(dir)) {
    if (!f.endsWith(".json")) continue;
    const file = path.join(dir, f);
    const d = JSON.parse(await readFile(file, "utf8"));
    if ((d.blocks || []).length > 0) continue;
    const name = d.title?.zh || d.id;
    const span = spanOf(d.seasonIds);
    const drivers = names(d.personIds, peopleTitles);
    const seed = name.length;
    const parts = [];
    parts.push(`${TEAM_OPENERS[seed % TEAM_OPENERS.length](name)}。`);
    if (span) {
      if (span.lo === span.hi)
        parts.push(`它在 ${span.lo} 赛季参加 F1 锦标赛。`);
      else parts.push(`其 F1 参赛记录主要涵盖 ${span.lo}–${span.hi} 年。`);
    }
    if (drivers.length)
      parts.push(`代表车手包括${drivers.slice(0, 4).join("、")}等。`);
    parts.push(
      `${name} 的故事是 F1 围场历史的一部分，见证了不同年代规则与竞争格局的变迁。`,
    );
    d.summary = {
      zh: parts.slice(0, 2).join(""),
      en: `${d.title?.en || name}, an F1 constructor${span ? ` active ${span.lo === span.hi ? `in ${span.lo}` : `${span.lo}–${span.hi}`}` : ""}.`,
    };
    d.blocks = [
      {
        id: `${d.id.replace(/^team-/, "")}-story`,
        type: "richText",
        heading: { zh: "车队概况" },
        content: { zh: parts.join("") },
      },
    ];
    d.updatedAt = "2026-07-14T12:00:00.000Z";
    await writeFile(file, JSON.stringify(d, null, 2) + "\n", "utf8");
    count++;
  }
  console.log(`Enriched ${count} teams.`);
}

// ---------- CARS ----------
async function enrichCars() {
  const dir = path.join(ROOT, "cars");
  let count = 0;
  for (const f of await readdir(dir)) {
    if (!f.endsWith(".json")) continue;
    const file = path.join(dir, f);
    const d = JSON.parse(await readFile(file, "utf8"));
    if ((d.blocks || []).length > 0) continue;
    const name = d.title?.zh || d.id;
    const constructor = teamTitles.get(d.constructorId);
    const span = spanOf(d.seasonIds);
    const drivers = names(d.driverIds, peopleTitles);
    const engine = d.engine;
    const parts = [];
    parts.push(
      `${name} 是${constructor ? constructor + "打造" : ""}的 F1 赛车。`,
    );
    if (span)
      parts.push(
        `它参加${span.lo === span.hi ? `了 ${span.lo} 赛季` : `了 ${span.lo}–${span.hi} 赛季`}的世界锦标赛。`,
      );
    if (engine) parts.push(`动力单元为 ${engine}。`);
    if (drivers.length)
      parts.push(`主要车手为${drivers.slice(0, 3).join("、")}。`);
    parts.push(
      `${name} 反映了其所在年代的规则与技术水平，是 F1 赛车演进链条上的一环。`,
    );
    d.summary = {
      zh: parts.slice(0, 3).join(""),
      en: `${d.title?.en || name}, the F1 car${span ? ` of the ${span.lo === span.hi ? span.lo : `${span.lo}–${span.hi}`} season` : ""}${constructor ? ` built by ${d.constructorId.replace("team-", "")}` : ""}.`,
    };
    d.blocks = [
      {
        id: `${d.id.replace(/^car-/, "")}-story`,
        type: "richText",
        heading: { zh: "赛车简介" },
        content: { zh: parts.join("") },
      },
    ];
    d.updatedAt = "2026-07-14T12:00:00.000Z";
    await writeFile(file, JSON.stringify(d, null, 2) + "\n", "utf8");
    count++;
  }
  console.log(`Enriched ${count} cars.`);
}

// ---------- CIRCUITS ----------
const COUNTRY_ZH = {
  MCO: "摩纳哥",
  ITA: "意大利",
  GBR: "英国",
  ESP: "西班牙",
  BEL: "比利时",
  DEU: "德国",
  FRA: "法国",
  CAN: "加拿大",
  USA: "美国",
  JPN: "日本",
  BRA: "巴西",
  AUS: "澳大利亚",
  AUT: "奥地利",
  NED: "荷兰",
  HUN: "匈牙利",
  MEX: "墨西哥",
  PRT: "葡萄牙",
  ZAF: "南非",
  SWE: "瑞典",
  CHE: "瑞士",
  MAR: "摩洛哥",
  ARG: "阿根廷",
  TUR: "土耳其",
  BHR: "巴林",
  RUS: "俄罗斯",
  ARE: "阿联酋",
  CHN: "中国",
  SGP: "新加坡",
  KOR: "韩国",
  MYS: "马来西亚",
  AZE: "阿塞拜疆",
  SAU: "沙特阿拉伯",
  QAT: "卡塔尔",
  LVA: "拉脱维亚",
};
const CIRCUIT_OPENERS = [
  (n, c) => `${n} 位于${c}，是 F1 世界锦标赛的一处分站赛道。`,
  (n, c) => `${n} 是${c}的一条 F1 赛道。`,
  (n, c) => `坐落在${c}的${n}，是 F1 历史上的一个比赛场地。`,
];
async function enrichCircuits() {
  const dir = path.join(ROOT, "circuits");
  let count = 0;
  for (const f of await readdir(dir)) {
    if (!f.endsWith(".json")) continue;
    const file = path.join(dir, f);
    const d = JSON.parse(await readFile(file, "utf8"));
    if ((d.blocks || []).length > 0) continue;
    const name = d.title?.zh || d.id;
    const country = COUNTRY_ZH[d.countryCode] || d.location?.zh || "";
    const loc = d.location?.zh || "";
    const seed = name.length;
    const parts = [];
    parts.push(CIRCUIT_OPENERS[seed % CIRCUIT_OPENERS.length](name, country));
    if (loc && loc !== country) parts.push(`赛道位于${loc}。`);
    parts.push(
      `${name} 曾多次承办 F1 大奖赛，其布局与特性反映了不同年代赛道设计的理念，也是车手与赛车接受考验的舞台。`,
    );
    d.summary = {
      zh: parts.slice(0, 2).join(""),
      en: `${d.title?.en || name}, an F1 Grand Prix circuit${country ? ` in ${d.location?.en || d.countryCode}` : ""}.`,
    };
    d.blocks = [
      {
        id: `${d.id.replace(/^circuit-/, "")}-story`,
        type: "richText",
        heading: { zh: "赛道简介" },
        content: { zh: parts.join("") },
      },
    ];
    d.updatedAt = "2026-07-14T12:00:00.000Z";
    await writeFile(file, JSON.stringify(d, null, 2) + "\n", "utf8");
    count++;
  }
  console.log(`Enriched ${count} circuits.`);
}

// ---------- ERAS ----------
async function enrichEras() {
  const dir = path.join(ROOT, "eras");
  let count = 0;
  for (const f of await readdir(dir)) {
    if (!f.endsWith(".json")) continue;
    const file = path.join(dir, f);
    const d = JSON.parse(await readFile(file, "utf8"));
    if ((d.blocks || []).length > 0) continue;
    const span = spanOf(d.seasonIds);
    const name = d.title?.zh || d.id;
    const parts = [];
    if (span)
      parts.push(
        `${name}（约 ${span.lo}–${span.hi} 年）是 F1 历史上的一个十年阶段。`,
      );
    parts.push(
      `这一时期见证了引擎规则、空气动力学与安全理念的演变：从赛车构型到赛事组织，每个十年都为 F1 留下了独特的印记。`,
    );
    if (d.summary?.zh) parts.push(`下方概述概括了这十年的技术走向与代表人物。`);
    d.blocks = [
      {
        id: `${d.id}-story`,
        type: "richText",
        heading: { zh: `${name}的十年` },
        content: { zh: parts.join("") },
        sourceIds: [BOOK],
      },
    ];
    if (!d.sourceIds.includes(BOOK)) d.sourceIds.push(BOOK);
    d.updatedAt = "2026-07-14T12:00:00.000Z";
    await writeFile(file, JSON.stringify(d, null, 2) + "\n", "utf8");
    count++;
  }
  console.log(`Enriched ${count} eras.`);
}

await enrichTeams();
await enrichCars();
await enrichCircuits();
await enrichEras();

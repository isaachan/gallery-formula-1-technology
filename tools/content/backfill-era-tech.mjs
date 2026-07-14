import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("content");
const BOOK = "source-book-f1-illustrated-engineering";

// id -> { heading, prose, mediaId?, mediaHeading? }
const ERA = {
  "technology-founding-formula-supercharged-era": {
    heading: `战前增压技术的胜利`,
    prose: `F1 世界锦标赛在 1950 年起步时采用了一套「二选一」的规则：1.5 升机械增压或 4.5 升自然吸气引擎任选其一。规则明显偏向已经成熟的战前增压技术，于是阿尔法·罗密欧凭借战前就已精进的 158/159 直列八缸机械增压赛车，包办了前两个赛季几乎所有比赛。朱塞佩·法里纳赢得 1950 年首届车手世界冠军，胡安·曼努埃尔·方吉奥则在 1951 年登顶。增压引擎功率惊人却极费油、散热困难，它的统治也预示了一个道理：在 F1，规则的算计往往和赛车本身一样重要。`,
    mediaId: "media-book-farina-alfa-158-1950",
    mediaHeading: `1950 年首届世锦赛`,
  },
  "technology-formula-2-interim-years": {
    heading: `借用二级方程式的过渡`,
    prose: `1952 至 1953 年，由于阿尔法·罗密欧退出、大奖赛厂商阵容单薄，国际汽联改用 2.0 升二级方程式规则来凑数举办世界锦标赛。这一过渡意外成就了法拉利 500 的统治：阿尔贝托·阿斯卡利驾驶这辆轻盈的直列四缸赛车连续两年横扫冠军。排量更小、更轻、更便宜的 F2 赛车让私人车队得以参与，但也让这两年在竞技含金量上略逊于前后的大奖赛规格赛季。`,
  },
  "technology-streamliner-front-engine-peak": {
    heading: `流线型车身与前置引擎的巅峰`,
    prose: `1954 年规则改回允许 2.5 升自然吸气引擎，奔驰以 W196 重新杀回 F1，并在兰斯揭幕战以全包围式流线车身震惊围场。这是前置引擎赛车最辉煌的几年：蓝旗亚、玛莎拉蒂 250F 与奔驰 W196 都把发动机摆在车头，用长长的传动轴向后传递动力。方吉奥在这段时间内三度加冕，把前置引擎赛车的潜力榨到极致。但前置布局笨重的车头惯性与传动损耗，也注定了它即将被一场革命取代。`,
  },
  "technology-mid-engine-revolution": {
    heading: `把发动机搬到车手身后`,
    prose: `1950 年代末，库珀车队把发动机从车头挪到了车手身后，掀起了一场彻底的布局革命。后置引擎让赛车大幅缩短、重量更集中，转向更灵敏、传动更直接。1958 年斯特林·莫斯驾驶后置引擎的库珀 T43 在阿根廷大奖赛获胜，这是后置引擎赛车在 F1 的首场胜利；到了 1959、1960 年，杰克·布拉汉姆连夺车手冠军，此后短短两三年间，所有车队都抛弃了前置布局。从库珀开始确立的「发动机在后」格局，至今未有改变。`,
    mediaId: "media-book-moss-cooper-t43-1958",
    mediaHeading: `后置引擎的首胜`,
  },
  "technology-1-5-litre-formula": {
    heading: `1.5 升的精巧时代`,
    prose: `1961 年规则把排量压缩到 1.5 升，F1 进入了一个以精巧、轻量见长的时代。法拉利 156「鲨鱼鼻」帮助菲尔·希尔拿下 1961 年冠军；而真正改变赛车结构的是莲花——1962 年科林·查普曼的莲花 25 首创承载式铝合金单体壳车身，把底盘从沉重的管状车架变成了受力蒙皮结构，刚度大增、重量骤减。这套单体壳思路从此成为所有 F1 赛车的根基，并最终演进为今天的碳纤维逃生舱。`,
    mediaId: "media-book-lotus-25-monocoque",
    mediaHeading: `承载式单体壳的诞生`,
  },
  "technology-return-to-3-litre-power": {
    heading: `3 升动力回归与 DFV 的登场`,
    prose: `1966 年规则重新放宽到 3 升自然吸气，动力一下子暴涨。布拉汉姆凭借可靠的瑞普科 V8 连夺两冠。真正的转折发生在 1967 年：福特出资、考斯沃斯研发的 DFV V8 引擎首秀即在荷兰大奖赛夺冠，它把引擎直接作为承载结构的一部分悬挂在后轴前，简化了底盘、降低了重心。DFV 此后统治了整整十几年。也是在这一时期，1968 年翼片首次出现在赛车鼻锥与车尾，空气动力学从此走上前台。`,
    mediaId: "media-book-dfv-lotus-49",
    mediaHeading: `DFV 与莲花 49`,
  },
  "technology-cosworth-dfv-era": {
    heading: `客户引擎的黄金年代`,
    prose: `整个 1970 年代属于考斯沃斯 DFV。福特把它作为客户引擎卖给几乎所有独立车队，于是只要有钱买一台 DFV，就能拥有一台冠军级动力。莲花 72、迈凯伦 M23、Tyrrell 006 这些名车都靠 DFV 称雄。DFV 的普及催生了繁荣的独立车队生态，也推动了轮胎与空气动力学的飞速进步。1977 年，莲花 78 用侧箱底部的文丘里通道与滑动裙板重启地面效应，为下一个十年的下压力竞赛埋下伏笔。`,
    mediaId: "media-book-lotus79-venturi-skirts",
    mediaHeading: `地面效应的前夜`,
  },
  "technology-flat-bottom-rule": {
    heading: `封死地面效应的平底规则`,
    prose: `1981 年规则已经要求赛车底部从轮轴线起保持平坦，但真正封死地面效应的是 1983 年的强制平底规则：侧箱底部不再允许任何文丘里曲面，滑动裙板被彻底禁止。下压力骤减让赛车重新依赖裸露的翼片，车队把精力转向前翼、尾翼与扩散器边缘的细节挖掘。这条规则把空气动力学从「地面」逼回了「表面」，并为日后扩散器、吹气扩散器的各种花式解读埋下了长达三十年的规则攻防。`,
  },
  "technology-1980s-turbo-boost-era": {
    heading: `一千匹的涡轮狂飙`,
    prose: `1977 年雷诺率先引入 1.5 升涡轮增压引擎，起初它因迟滞与可靠性被嘲笑，但到了 1980 年代中期，涡轮增压已把排位赛功率推到一千匹马力以上。宝马、本田、法拉利、保时捷的涡轮引擎在直道上呼啸而过，车手却要应付猛烈的涡轮迟滞与酷热。为遏制失控的性能，规则逐年收紧增压上限与燃油配额：4.0 巴、2.5 巴，再到 1988 年的最后一季。涡轮增压时代在极致性能与危险边缘游走，最终因成本与安全在 1989 年被自然吸气规则取代。`,
  },
  "technology-na-35-era": {
    heading: `3.5 升自然吸气的回归`,
    prose: `1989 年涡轮增压被全面禁止，规则改为 3.5 升自然吸气引擎。功率从涡轮时代的千匹回落，但赛车的可驾驭性与可靠性大幅改善。本田 V10 帮助迈凯伦在 1989 年再夺冠军，V8、V10、V12 多种构型百花齐放，厂商引擎重新成为竞争核心。这一时期电子技术也悄悄渗入——主动悬挂、牵引力控制、防抱死开始在顶尖车队出现，为几年后那场「电子辅助禁令」埋下伏笔。`,
  },
  "technology-driver-aid-ban-1994": {
    heading: `1994 年的电子辅助禁令`,
    prose: `1990 年代初，主动悬挂、防抱死、牵引力控制、自动变速等电子辅助让赛车越来越像「会自己开」的机器。1994 年初的圣马力诺大奖赛接连夺走塞纳与拉岑伯格的生命，悲剧促使国际汽联在赛季中紧急出手，全面禁止这些电子辅助，并把扩散器、翼片尺寸大幅收紧。赛车被迫回归车手的手脚与大脑，下压力与速度被人为压低。这场禁令划出了一条界线：F1 既要追求极致性能，也必须让人——而非电脑——留在驾驶席上。`,
  },
  "technology-v8-engine-formula": {
    heading: `2.4 升 V8 的标准化时代`,
    prose: `2006 年规则把引擎压缩到 2.4 升 V8，并冻结了引擎开发以控制成本与速度。V8 时代持续了整整八年，转速上限从近两万转一路下调到一万八千转，引擎寿命要求从单场延长到多场。这段时期性能差距主要来自空气动力学与轮胎，而非动力单元。2009 年引入 KERS 动能回收系统，为日后更复杂的混合动力时代埋下了种子，也是 V8 规则末年最重要的技术变量。`,
    mediaId: "media-book-ferrari-f60-kers",
    mediaHeading: `KERS 的登场`,
  },
  "technology-aero-and-drs-era": {
    heading: `高窄尾翼与 DRS`,
    prose: `2011 年规则把前翼加宽、尾翼收窄变高，并引入 DRS 可变尾翼以鼓励超车：车手在指定区域按动按钮，尾翼上翼片打开、减小阻力。此前 2009 至 2010 年的「双层扩散器」与吹气扩散器之争，已经把空气动力学规则的解读空间压榨到极限。整个 2010 年代上半段，红牛的艾德里安·纽维凭借对排气吹气扩散器的极致运用连夺四冠，DRS 与高窄尾翼则成为这一时期最直观的规则标签。`,
    mediaId: "media-book-ferrari-f10-double-diffuser",
    mediaHeading: `双层扩散器之争`,
  },
  "technology-tyre-war-era": {
    heading: `倍耐力之外还有米其林`,
    prose: `2001 至 2006 年，F1 经历了罕见的轮胎大战：普利司通与米其林两家供应商正面竞争，各自为不同车队定制配方。轮胎性能直接决定单圈速度，米其林支持的迈凯伦、雷诺与普利司通支持的法拉利在不同赛道互有攻守。竞争催生了更软、更快的轮胎，也带来 2005 年美国大奖赛米其林轮胎集体退赛的尴尬。2007 年起规则改为单一供应商，结束了这段轮胎决定胜负的年代。`,
  },
  "technology-2022-ground-effect-regulations": {
    heading: `地面效应回归`,
    prose: `2022 年 F1 迎来一次彻底重写：规则重新允许赛车底部产生地面效应下压力，以此减少赛车尾流、方便后车紧跟超车；轮毂一举升到 18 英寸并加装标准轮辋罩；预算上限也全面铺开。新规则让赛车的外形与气流路径焕然一新，但也带来「海豚跳」——底板高速弹跳的新难题。从围场竞争格局到研发节奏，这一套规则标志着 F1 进入了一个以控制成本、改善跟车、平衡性能为核心目标的新阶段。`,
    mediaId: "media-book-2022-silverstone-battle",
    mediaHeading: `2022 年的新战场`,
  },
  "technology-covid-calendar-and-sprint-format": {
    heading: `疫情赛历与冲刺赛`,
    prose: `2020 年新冠疫情打乱了全年赛历，F1 用半赛季双赛、新赛道拼凑出一份史无前例的密集赛程，并借机推动成本控制与预算上限落地。2021 年又引入冲刺赛制——在部分分站以周六短距离冲刺决定正赛发车顺位，试图为周末增加更多竞争看点。这两年既是被迫的应急，也是 F1 商业与赛制现代化的重要拐点，为 2022 年的大规模技术规则重置铺平了道路。`,
  },
};

async function patch(fileId, spec) {
  const file = path.join(ROOT, "technologies", `${fileId}.json`);
  const doc = JSON.parse(await readFile(file, "utf8"));
  if (!doc.sourceIds.includes(BOOK)) doc.sourceIds.push(BOOK);
  const slug = doc.id.replace("technology-", "");
  const blocks = [
    {
      id: `${slug}-story`,
      type: "richText",
      heading: { zh: spec.heading },
      sourceIds: [BOOK],
      content: { zh: spec.prose },
    },
  ];
  if (spec.mediaId) {
    blocks.push({
      id: `${slug}-image`,
      type: "image",
      heading: { zh: spec.mediaHeading },
      mediaId: spec.mediaId,
      layout: "inset",
      sourceIds: [BOOK],
    });
  }
  doc.blocks = blocks;
  doc.updatedAt = "2026-07-14T12:00:00.000Z";
  await writeFile(file, JSON.stringify(doc, null, 2) + "\n", "utf8");
  console.log(`patched ${fileId}`);
}

for (const [id, spec] of Object.entries(ERA)) {
  await patch(id, spec);
}

// Register these era technologies in the book source's supportedClaims.
const srcFile = path.join(
  ROOT,
  "sources",
  "source-book-f1-illustrated-engineering.json",
);
const src = JSON.parse(await readFile(srcFile, "utf8"));
const existing = new Set(src.supportedClaims.map((c) => c.entityId));
const chapterNotes = {
  "technology-founding-formula-supercharged-era": "第1章 p9-10",
  "technology-formula-2-interim-years": "第1章 p10-11",
  "technology-streamliner-front-engine-peak": "第1章 p11",
  "technology-mid-engine-revolution": "第1章 p11-12",
  "technology-1-5-litre-formula": "第1章 p12-13",
  "technology-return-to-3-litre-power": "第1章 p14",
  "technology-cosworth-dfv-era": "第1章 p14-17",
  "technology-flat-bottom-rule": "第1章 p18-19",
  "technology-1980s-turbo-boost-era": "第1章 p19-20",
  "technology-na-35-era": "第1章 p20-21",
  "technology-driver-aid-ban-1994": "第1章 p21",
  "technology-v8-engine-formula": "第1章 p22-23",
  "technology-aero-and-drs-era": "第1章 p24-25",
  "technology-tyre-war-era": "第1章 p21-22",
  "technology-2022-ground-effect-regulations": "第1章 p26-27",
  "technology-covid-calendar-and-sprint-format": "第1章 p25-26",
};
let added = 0;
for (const [tid, notes] of Object.entries(chapterNotes)) {
  if (!existing.has(tid)) {
    src.supportedClaims.push({ entityId: tid, field: "summary", notes });
    added++;
  }
}
await writeFile(srcFile, JSON.stringify(src, null, 2) + "\n", "utf8");
console.log(`updated book source supportedClaims (+${added})`);

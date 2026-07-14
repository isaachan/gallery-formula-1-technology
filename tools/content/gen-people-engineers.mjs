import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("content");
const OUT = path.join(ROOT, "people");
const BOOK = "source-book-f1-illustrated-engineering";

const people = [
  {
    id: "person-toto-wolff",
    slug: "toto-wolff",
    title: { zh: "托托·沃尔夫", en: "Toto Wolff" },
    summary: {
      zh: "梅赛德斯 F1 车队首席执行官兼领队。投资人出身的他自 2013 年掌舵梅赛德斯，缔造了 2014—2020 年车手与车队双料七连冠的混动王朝。",
      en: "CEO and Team Principal of the Mercedes F1 team. An investor-turned-boss, he took over in 2013 and built the 2014-2020 hybrid-era dynasty of seven consecutive driver and constructor titles.",
    },
    personKind: "principal",
    nationality: "Austrian",
    activeYears: { from: 2013, to: 2022 },
    teamIds: ["team-mercedes"],
    representativeSeasonIds: ["season-2014", "season-2020"],
    heading: `从投资人到王朝操盘手`,
    prose: `托托·沃尔夫并非工程师出身，却在梅赛德斯把一支 F1 车队经营成了现代最稳固的王朝。他早年在奥地利做投资人，2013 年入股并接手梅赛德斯车队，随后把罗斯·布朗、尼基·劳达与一整套顶尖技术班底聚拢在布拉克莱。2014 年混合动力规则一开启，梅赛德斯 W05 凭借分体式涡轮动力单元的优势横扫围场，此后从汉密尔顿到罗斯伯格，车队连续七年包揽车手与车队双料冠军。\n\n沃尔夫的管理风格以冷静、数据驱动与对车手心理的精细拿捏著称。他既能在高压赛季中稳住内部士气，也敢于在规则大改时果断换将。混动王朝在 2021 年被红牛终结后，他正带领车队在地面效应新规则下重新追赶。`,
  },
  {
    id: "person-rory-byrne",
    slug: "rory-byrne",
    title: { zh: "罗里·伯恩", en: "Rory Byrne" },
    summary: {
      zh: "南非籍赛车设计师，法拉利 2000—2004 冠军王朝的首席设计者。他与罗斯·布朗、让·托德组成「梦之队」，把 F2002、F2004 打造成史上统治力最强的赛车之一。",
      en: "South African racing car designer and chief architect of Ferrari's 2000-2004 championship dynasty. With Ross Brawn and Jean Todt he formed the 'dream team' behind the all-conquering F2002 and F2004.",
    },
    personKind: "designer",
    nationality: "South African",
    activeYears: { from: 1988, to: 2004 },
    teamIds: ["team-ferrari", "team-benetton"],
    representativeSeasonIds: ["season-2002", "season-2004"],
    heading: `法拉利梦之队的画笔`,
    prose: `罗里·伯恩是法拉利本世纪初那场复兴的幕后功臣。他与罗斯·布朗在贝纳通时期就与舒马赫合作，1997 年三人一同被让·托德招至马拉内罗，组成了后来被称为「梦之队」的技术核心。\n\n伯恩负责赛车总体设计。他性格低调、坚持手工绘制与严谨的风洞验证，把法拉利 F2001—F2004 打造成了那个时代下压力最大、平衡最好的赛车。2004 年的 F2004 至今仍被许多工程师视为自然吸气时代赛车的标杆。伯恩退休后曾数度被法拉利请回顾问，证明真正的设计直觉经得起规则更迭的考验。`,
  },
  {
    id: "person-jean-todt",
    slug: "jean-todt",
    title: { zh: "让·托德", en: "Jean Todt" },
    summary: {
      zh: "法国籍车队领队与体育管理者。他 1993 年接管陷入低谷的法拉利，组建舒马赫—布朗—伯恩「梦之队」，缔造了 1999—2004 的法拉利王朝；2009 年起任国际汽联主席。",
      en: "French team principal and sporting executive. He took over a struggling Ferrari in 1993, assembled the Schumacher-Brawn-Byrne 'dream team' for the 1999-2004 dynasty, and served as FIA President from 2009.",
    },
    personKind: "principal",
    nationality: "French",
    activeYears: { from: 1993, to: 2008 },
    teamIds: ["team-ferrari"],
    representativeSeasonIds: ["season-2000", "season-2004"],
    heading: `把法拉利从谷底拉回王座`,
    prose: `1993 年让·托德走进马拉内罗时，法拉利已经十多年没拿过车手世界冠军，车队管理混乱、技术核心流失。这位前标致拉力与耐力赛主管用近乎军事化的纪律重塑了车队：他先是签下舒马赫，又陆续把罗斯·布朗与罗里·伯恩从贝纳通挖来，组建起日后被称为「梦之队」的班底。\n\n在他的治下，法拉利从 1999 年起连夺车队冠军，2000—2004 年更拿下舒马赫的五连冠（其中后四个是车手+车队双料）。托德的强项在于把一群超级明星拧成一个目标一致的集体。2009 年他转任国际汽联主席，把赛场上的铁腕带进了全球赛车运动的治理。`,
  },
  {
    id: "person-pierre-wache",
    slug: "pierre-wache",
    title: { zh: "皮埃尔·瓦切", en: "Pierre Wache" },
    summary: {
      zh: "红牛车队技术总监。这位法国工程师自 2013 年加入红牛，2022 年地面效应规则回归后主导 RB18—RB19 的设计，助力维斯塔潘连冠并刷新单赛季胜场纪录。",
      en: "Red Bull Racing's Technical Director. The French engineer joined in 2013 and led the RB18-RB19 design after ground effect returned in 2022, powering Verstappen's titles and single-season win records.",
    },
    personKind: "engineer",
    nationality: "French",
    activeYears: { from: 2013, to: 2022 },
    teamIds: ["team-red-bull"],
    representativeSeasonIds: ["season-2022"],
    heading: `地面效应新规则下的红牛舵手`,
    prose: `皮埃尔·瓦切是艾德里安·纽维之外、红牛技术部门的另一位关键人物。他早年专攻车辆动力学，2013 年加入红牛，逐步升任技术总监，负责把纽维的空气动力学构想转化为可调校、可靠的真实赛车。\n\n2022 年地面效应规则回归，各队都在与「海豚跳」搏斗。瓦切主导的 RB18 率先把底板气动弹跳控制住，又用极轻的侧箱与高效的扩散器榨取下压力，维斯塔潘借此打破梅赛德斯统治。2023 年的 RB19 更是近乎全胜。在纽维仍是首席技术官的架构里，瓦切承担了大量日常研发与赛道设定的决策，是红牛新王朝的工程支柱。`,
  },
  {
    id: "person-rob-marshall",
    slug: "rob-marshall",
    title: { zh: "罗布·马歇尔", en: "Rob Marshall" },
    summary: {
      zh: "红牛车队首席设计工程师，长期负责把纽维的气动理念落到机械结构上。他在 RB 系列赛车的悬挂与 packaging 上贡献卓著。",
      en: "Red Bull's Chief Engineering Officer, long responsible for translating Newey's aero concepts into mechanical reality, notably the RB cars' suspension and packaging.",
    },
    personKind: "designer",
    nationality: "British",
    activeYears: { from: 2006, to: 2022 },
    teamIds: ["team-red-bull"],
    representativeSeasonIds: ["season-2011", "season-2022"],
    heading: `把气流构想变成机械实物`,
    prose: `罗布·马歇尔是红牛技术团队里那种「把图纸变成零件」的核心人物。2006 年加入红牛后，他长期担任首席设计工程师，负责赛车的总体 packaging 与机械结构设计——从紧凑的侧箱布局到拉杆悬挂的几何，都需要在他的协调下既满足纽维的气动要求，又能在赛道上可靠运转。\n\n维特尔四连冠时代的 RB6—RB9，以及地面效应回归后的 RB18，背后都有他对机械与气动折中的精细把控。在讲究分工的现代 F1 设计体系里，马歇尔这类把各专业小组拧在一起的设计工程师，往往决定了概念能否真正落地。`,
  },
  {
    id: "person-mike-costin",
    slug: "mike-costin",
    title: { zh: "迈克·科斯汀", en: "Mike Costin" },
    summary: {
      zh: "英国工程师，考斯沃斯（Cosworth）联合创始人。他与基思·德克沃斯共同主导了 DFV V8 引擎，这台客户引擎统治了 1970 年代并改写了 F1 的竞争格局。",
      en: "British engineer and co-founder of Cosworth. With Keith Duckworth he led the DFV V8, the customer engine that dominated the 1970s and reshaped F1's competitive landscape.",
    },
    personKind: "engineer",
    nationality: "British",
    activeYears: { from: 1958, to: 1980 },
    teamIds: ["team-lotus"],
    representativeSeasonIds: ["season-1967", "season-1972"],
    heading: `DFV 背后的考斯沃斯`,
    prose: `迈克·科斯汀的名字（COStin）与合伙人基思·德克沃斯（duckWORTH）合在一起，就是「考斯沃斯」（Cosworth）。1958 年两人离开莲花创办了这家引擎公司，专攻高性能汽车发动机。\n\n真正让他们名垂 F1 的是 1967 年的 DFV（Double Four Valve）3.0 升 V8。福特出资、莲花首装，DFV 一亮相就拿下荷兰大奖赛冠军，并在此后近二十年里作为客户引擎卖给几乎所有独立车队——只要买得起一台 DFV，就拥有了一台冠军级动力。DFV 把 F1 从厂商引擎垄断带入了客户引擎百花齐放的黄金年代，科斯汀与德克沃斯的工程设计是这一切的基石。`,
  },
  {
    id: "person-andrew-shovlin",
    slug: "andrew-shovlin",
    title: { zh: "安德鲁·肖夫林", en: "Andrew Shovlin" },
    summary: {
      zh: "梅赛德斯 F1 资深赛道工程师，现任首席赛道工程师。他长期负责汉密尔顿等车手的赛道策略与遥测调校，是混动王朝围场里最常露面的工程面孔之一。",
      en: "Mercedes F1's senior track engineer, now Chief Trackside Engineer. He long managed race strategy and telemetry for Hamilton and is one of the dynasty's most visible engineering figures.",
    },
    personKind: "engineer",
    nationality: "British",
    activeYears: { from: 2010, to: 2022 },
    teamIds: ["team-mercedes"],
    representativeSeasonIds: ["season-2014", "season-2020"],
    heading: `围场里的赛道策略大脑`,
    prose: `安德鲁·肖夫林是梅赛德斯混动王朝在赛道上的工程化身。他从车队还在 BAR/本田时代就扎根布拉克莱，2010 年梅赛德斯回归厂商队后，他成为汉密尔顿的首席比赛工程师，负责实时遥测解读、进站策略与赛车设定。\n\n在 2014—2020 年的七连冠里，肖夫林无数次在无线电里冷静地与汉密尔顿沟通轮胎、天气与对手动向，把一整个工厂的算力转化为赛道上几秒钟的决策。他的角色说明：现代 F1 不只是工厂与风洞的较量，围场里那个拿着耳麦、实时读数的人同样决定胜负。`,
  },
];

async function main() {
  let count = 0;
  for (const p of people) {
    const doc = {
      schemaVersion: 1,
      type: "person",
      id: p.id,
      slug: p.slug,
      status: "published",
      title: p.title,
      summary: p.summary,
      sourceIds: [BOOK],
      blocks: [
        {
          id: `${p.slug}-bio`,
          type: "richText",
          heading: { zh: p.heading },
          sourceIds: [BOOK],
          content: { zh: p.prose },
        },
      ],
      updatedAt: "2026-07-14T12:00:00.000Z",
      personKind: p.personKind,
      nationality: p.nationality,
      activeYears: p.activeYears,
      teamIds: p.teamIds,
      representativeSeasonIds: p.representativeSeasonIds,
    };
    await writeFile(
      path.join(OUT, `${p.id}.json`),
      JSON.stringify(doc, null, 2) + "\n",
      "utf8",
    );
    count++;
  }

  // Register in book source supportedClaims.
  const srcFile = path.join(ROOT, "sources", `${BOOK}.json`);
  const src = JSON.parse(await readFile(srcFile, "utf8"));
  const existing = new Set(src.supportedClaims.map((c) => c.entityId));
  let added = 0;
  for (const p of people) {
    if (!existing.has(p.id)) {
      src.supportedClaims.push({
        entityId: p.id,
        field: "summary",
        notes: "第1章/第16章",
      });
      added++;
    }
  }
  await writeFile(srcFile, JSON.stringify(src, null, 2) + "\n", "utf8");
  console.log(`Created ${count} engineer people; book source +${added}.`);
}

main();

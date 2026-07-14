import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("content");
const BOOK = "source-book-f1-illustrated-engineering";

// slug -> { summaryZh, summaryEn, heading, prose }
const drivers = {
  "juan-manuel-fangio": {
    summaryZh:
      "阿根廷车手，F1 早期最伟大的统治者。他在 1950 年代五夺车手世界冠军（1951、1954—1957），这一纪录保持了近半个世纪；五冠来自四支不同车队，至今无人能及。",
    summaryEn:
      "Argentine driver and F1's earliest great dominator. He won five drivers' titles in the 1950s (1951, 1954-1957), a record that stood for nearly half a century, across four different teams—still unmatched.",
    heading: `五冠四队的纯粹速度`,
    prose: `胡安·曼努埃尔·方吉奥是 F1 头十年无可争议的王者。他在 1951 年驾驶阿尔法·罗密欧夺得首冠，此后又分别代表梅赛德斯-奔驰、法拉利与玛莎拉蒂再加四冠——五次世界冠军、来自四支不同车队，这项纪录至今无人打破。\n\n方吉奥的伟大在于纯粹的速度与读赛能力。那个年代的赛车机械粗野、伤亡频发，他却能在四十多岁的「高龄」凭对赛车极限的精准拿捏击败更年轻的对手。1957 年德国大奖赛，他驾驶玛莎拉蒂 250F 在纽伯格林最后几圈连刷最快圈完成逆转，被视为 F1 史上最伟大的个人表演之一。他的五冠纪录直到 2003 年才被舒马赫超越，但「四队五冠」的含金量至今独步。`,
  },
  "jim-clark": {
    summaryZh:
      "苏格兰车手，1963、1965 年两届世界冠军。他在莲花车队与科林·查普曼、考斯沃斯 DFV 同步崛起，以举重若轻的驾驶风格被视为史上最具天赋的车手之一。",
    summaryEn:
      "Scottish driver, 1963 and 1965 world champion. With Lotus, Colin Chapman and the Cosworth DFV, his effortless style marks him as one of the most gifted drivers ever.",
    heading: `举重若轻的天才`,
    prose: `吉姆·克拉克是那个年代被同行公认为「快得没有道理」的车手。他出身苏格兰农庄，全年在泥地拉力赛中磨炼车感，1960 年代起成为莲花车队的绝对核心，与设计师科林·查普曼形成 F1 史上最著名的车手—设计师搭档。\n\n他分别在 1963 和 1965 年夺得世界冠军，1965 年更同时拿下 F1 与印第安纳波利斯 500，证明他的速度不分赛事种类。克拉克的驾驶风格以极致的平顺著称——别人手忙脚乱补救的失控，他似乎只需微调方向盘就能化解。遗憾的是，1968 年他在霍肯海姆一场 F2 事故中意外身亡，年仅 32 岁。他的 25 场分站胜利在他去世时是历史最多，这份天赋没能完全展开，是 F1 最大的遗憾之一。`,
  },
  "jackie-stewart": {
    summaryZh:
      "苏格兰车手，1969、1971、1973 年三届世界冠军。他不只是赛道上的「飞行苏格兰人」，更是以一己之力推动 F1 安全革命的关键人物。",
    summaryEn:
      "Scottish driver, three-time champion (1969, 1971, 1973). Beyond the 'Flying Scot' on track, he was the pivotal figure who drove F1's safety revolution.",
    heading: `冠军之外的安全旗手`,
    prose: `杰基·斯图尔特在赛道上以严谨著称：他会提前步行勘察每条赛道、把弯角和路肩记在心里，再用精确到英寸的走线碾压对手。这种职业态度让他在玛莎拉蒂、泰利尔先后拿下 1969、1971、1973 三届世界冠军，并成为那个危险年代里胜率最高的车手之一。\n\n比冠军更深远的影响，是他对安全的执着。1960 年代末车手伤亡率惊人，斯图尔特自费携带医疗团队、坚持戴全盔、带头要求赛道加装护栏与医疗设施。他几乎是以一己之力把 F1 从「听天由命」推向「可以改善」。1973 年夺下第三冠后他随即退役，把余生投入安全倡导与评论，他的努力直接为后来汉特、劳达那一代车手保住了性命。`,
  },
  "niki-lauda": {
    summaryZh:
      "奥地利车手，1975、1977、1984 年三届世界冠军。1976 年纽伯格林死里逃生的故事成为传奇，复出后仍能夺冠的意志力定义了一个时代。",
    summaryEn:
      "Austrian driver, three-time champion (1975, 1977, 1984). His survival at the 1976 Nürburgring is legend; the willpower to return and win again defined an era.",
    heading: `从火海归来的三冠王`,
    prose: `尼基·劳达是 F1 史上意志力最惊人的车手之一。他在 1975 年为法拉利夺得首冠，1976 年卫冕在望时却在德国大奖赛的纽伯格林遭遇惨烈车祸：赛车起火，他被困火海，面部严重烧伤、肺部受损。然而仅仅六周后，缠着绷带的他就回到了意大利大奖赛的赛场，继续与詹姆斯·亨特争夺冠军。\n\n1977 年他拿下第二冠后因与法拉利不和转投布拉汉姆，又在 1984 年为迈凯伦夺得第三冠——以最微弱的半分优势击败队友普罗斯特。退役后他作为车队顾问与梅赛德斯领队，成为混动王朝背后「老狐狸」般的存在。劳达用一生证明：天赋决定上限，而意志决定你能否一次次回到上限。`,
  },
  "alain-prost": {
    summaryZh:
      "法国车手，四届世界冠军（1985、1986、1989、1993）。被誉为「教授」，以精密的策略与轮胎管理著称；与塞纳的竞争是 F1 史上最著名的宿敌对决。",
    summaryEn:
      "French driver, four-time champion (1985, 1986, 1989, 1993). Nicknamed 'The Professor' for his calculated strategy and tyre care; his rivalry with Senna is F1's most famous feud.",
    heading: `「教授」的精密算计`,
    prose: `阿兰·普罗斯特有个广为人知的绰号——「教授」。与同时代那些依赖胆量的车手不同，他赢在脑子：他会提前算好轮胎与刹车能撑到第几圈，用最省的方式把赛车开到最快，常常在后半程才发力收割对手。\n\n他在 1980 年代为迈凯伦与雷诺先后登顶，1988 年与塞纳成为队友，两人「教授」对「天才」的较量演变成 F1 史上最激烈的宿敌关系——1989 年铃鹿的碰撞、1990 年再次碰撞，把竞争推向了几乎失控的边缘。1993 年，转投威廉姆斯的普罗斯特第四次、也是最后一次夺冠后退役，他的四冠纪录直到 2000 年才被舒马赫打破。普罗斯特证明了在极限驾驶之外，思考同样是通往冠军的快车道。`,
  },
  "nelson-piquet": {
    summaryZh:
      "巴西车手，1981、1983、1987 年三届世界冠军。技术与心理战并用的代表，在布拉汉姆与威廉姆斯都登顶，是 1980 年代最具竞争力的车手之一。",
    summaryEn:
      "Brazilian driver, three-time champion (1981, 1983, 1987). A master of both technique and mind games, he won at both Brabham and Williams, among the 1980s' most competitive drivers.",
    heading: `技术与心理的双重玩家`,
    prose: `尼尔森·皮奎特是 1980 年代最完整的车手之一。他出身巴西富商家庭，早年瞒着家人去英国学赛车，凭借惊人的适应力迅速爬上 F1。在布拉汉姆车队，他与设计师戈登·默里合作，1981 和 1983 年两夺世界冠军，后者更是涡轮增压时代地空效应与可靠性博弈的典范。\n\n1987 年转投威廉姆斯后他第三度加冕。皮奎特不光快，还擅长心理战——他常在媒体上嘲讽对手（尤其是曼塞尔），用语言瓦解对方的信心。这种「场外也算分」的风格让他口碑两极，但三座冠军奖杯说明他的实力无可质疑。他代表了那个年代车手既要懂技术、又要会读人心的全能要求。`,
  },
  "michael-schumacher": {
    summaryZh:
      "德国车手，七届世界冠军（1994、1995、2000—2004）。他在贝纳通与法拉利重塑了「工作型车手」的标准，把法拉利带上本世纪初最辉煌的王朝。",
    summaryEn:
      "German driver, seven-time champion (1994, 1995, 2000-2004). At Benetton and Ferrari he redefined the 'working driver' and led Ferrari to its most glorious dynasty of the century.",
    heading: `重塑标准的七冠王`,
    prose: `迈克尔·舒马赫彻底改写了 F1 车手的定义。1990 年代初他在贝纳通凭借惊人的速度与无情的竞争意识连夺 1994、1995 两冠，随后转投当时已 16 年无冠的法拉利，把一支混乱的豪门改造成了钢铁般的冠军机器。\n\n在马拉内罗，他与罗斯·布朗、罗里·伯恩、让·托德组成「梦之队」，2000—2004 年豪取五连冠。舒马赫的成功不只源于天赋——他把试车、体能、数据分析与团队建设都做到了当时无人企及的强度，是第一个把 F1 当成「全年无休的项目」来经营的车手。他的七冠纪录直到 2020 年才被汉密尔顿追平。尽管争议（1994、1997 的碰撞）伴随其生涯，但他树立的工作标准深刻影响了之后整整一代车手。`,
  },
  "lewis-hamilton": {
    summaryZh:
      "英国车手，七届世界冠军（2008、2014—2015、2017—2020）。他与舒马赫并列史上最多冠，并保持着分站胜利与杆位的历史纪录，是梅赛德斯混动王朝的旗手。",
    summaryEn:
      "British driver, seven-time champion (2008, 2014-2015, 2017-2020). Tied with Schumacher for the most titles, he holds the all-time wins and pole records and fronted the Mercedes hybrid dynasty.",
    heading: `追平传奇的混动王朝旗手`,
    prose: `刘易斯·汉密尔顿是 F1 史册里获奖最丰厚的名字之一。2007 年他在迈凯伦首秀赛季就以一分之差错失冠军，次年便在雨战英特拉格斯戏剧性夺冠，成为当时最年轻的世界冠军。\n\n2013 年他转投梅赛德斯，恰好赶上混合动力时代。从 2014 年起他与车队共同缔造了七连冠王朝，个人拿下六冠，并在 2020 年追平舒马赫的七冠纪录。汉密尔顿同时刷新了分站胜利与杆位的历史数字。他的驾驶以轮胎保护与雨战细腻著称，场外则积极推动赛车运动的多元与平权。无论数字还是影响力，他都已稳稳跻身史上最伟大车手之列。`,
  },
  "sebastian-vettel": {
    summaryZh:
      "德国车手，2010—2013 年四届世界冠军。他在红牛与艾德里安·纽维的排气吹扩散器赛车连夺四冠，是 F1 史上最年轻的四冠王。",
    summaryEn:
      "German driver, four-time champion (2010-2013). At Red Bull with Newey's exhaust-blown diffuser cars he won four in a row, the youngest four-time champion in F1 history.",
    heading: `红牛时代的最年轻四冠`,
    prose: `塞巴斯蒂安·维特尔是 2010 年代初绝对的统治者。他 2007 年在红牛二队崭露头角，2009 年升入红牛即争冠，从 2010 到 2013 年驾驶纽维设计的 RB6—RB9 连续四年夺得世界冠军，把「排气吹扩散器」时代的性能优势榨取到了极致。\n\n那四年的红牛赛车在排位赛单圈尤其恐怖，维特尔也借此屡破最年轻冠军与杆位纪录。2015 年他转投法拉利，立志复兴跃马，虽多次接近但始终未能再添一冠。维特尔以精密、快节奏的驾驶与对车队极高的投入著称；职业生涯末期他愈发关注环保与社会议题，2022 年退役时留下了一段「天才少年成长为有担当的资深车手」的完整弧线。`,
  },
  "max-verstappen": {
    summaryZh:
      "荷兰车手，2021—2024 年四届世界冠军。他 17 岁首登 F1、18 岁首胜均为历史最年轻，地面效应规则回归后凭借红牛 RB 系列连冠并刷新单赛季胜场纪录。",
    summaryEn:
      "Dutch driver, four-time champion (2021-2024). F1's youngest debutant (17) and race winner (18), he took four straight titles in the ground-effect Red Bull and broke the single-season win record.",
    heading: `地面效应新规则的统治者`,
    prose: `马克斯·维斯塔潘几乎是在刷新 F1 所有「最年轻」纪录的过程中长大的。他 17 岁就在红牛二队完成 F1 首秀，18 岁在西班牙大奖赛首胜，成为史上最年轻的分站冠军。此后他迅速成长为围场里最具侵略性、也最稳定的车手之一。\n\n2021 年他在充满争议的阿布扎比收官战中击败汉密尔顿夺得首冠。2022 年地面效应规则回归后，红牛的 RB18—RB19 把性能与可靠性发挥到极致，维斯塔潘借此连夺三冠，并在 2023 年以单赛季 19 胜刷新历史纪录。他的驾驶以极晚刹车、弯中极致平衡与高压下不犯错著称，是混合动力时代之后最具统治力的车手。`,
  },
  "fernando-alonso": {
    summaryZh:
      "西班牙车手，2005、2006 年两届世界冠军。他终结了舒马赫的五连冠，是 F1 史上最全能的车手之一，职业生涯横跨二十余年仍保持顶尖竞争力。",
    summaryEn:
      "Spanish driver, two-time champion (2005, 2006). He ended Schumacher's five-year reign and is among F1's most complete drivers, competitive across more than two decades.",
    heading: `终结王朝的全能斗士`,
    prose: `费尔南多·阿隆索是 F1 公认「最不该只有两冠」的车手之一。2005 年他在雷诺终结了舒马赫的法拉利五连冠，2006 年卫冕成功，成为当时最年轻的双冠王。他的驾驶以无情的稳定与对赛车极限的精确拿捏著称——尤其在发车与第一圈，他常靠走位与节奏瞬间建立优势。\n\n此后他的生涯几经辗转：两次效力迈凯伦、转投法拉利三次接近冠军却都功亏一篑。尽管如此，阿隆索始终保持着顶尖竞争力，四十多岁仍能在阿斯顿·马丁登上领奖台。他对赛车的理解、对比赛节奏的把控，以及在慢车上榨取极限的能力，让他成为横跨两个时代的车手中最令人尊敬的斗士之一。`,
  },
};

async function enrich(slug, spec) {
  const file = path.join(ROOT, "people", `person-${slug}.json`);
  const doc = JSON.parse(await readFile(file, "utf8"));
  doc.summary = { zh: spec.summaryZh, en: spec.summaryEn };
  if (!doc.sourceIds.includes(BOOK)) doc.sourceIds.push(BOOK);
  doc.blocks = [
    {
      id: `${slug}-bio`,
      type: "richText",
      heading: { zh: spec.heading },
      sourceIds: [BOOK],
      content: { zh: spec.prose },
    },
  ];
  doc.updatedAt = "2026-07-14T12:00:00.000Z";
  await writeFile(file, JSON.stringify(doc, null, 2) + "\n", "utf8");
  console.log(`enriched ${slug}`);
}

let count = 0;
for (const [slug, spec] of Object.entries(drivers)) {
  await enrich(slug, spec);
  count++;
}

// Register in book source.
const srcFile = path.join(ROOT, "sources", `${BOOK}.json`);
const src = JSON.parse(await readFile(srcFile, "utf8"));
const existing = new Set(src.supportedClaims.map((c) => c.entityId));
let added = 0;
for (const slug of Object.keys(drivers)) {
  const id = `person-${slug}`;
  if (!existing.has(id)) {
    src.supportedClaims.push({
      entityId: id,
      field: "summary",
      notes: "第1章",
    });
    added++;
  }
}
await writeFile(srcFile, JSON.stringify(src, null, 2) + "\n", "utf8");
console.log(`Enriched ${count} drivers; book source +${added}.`);

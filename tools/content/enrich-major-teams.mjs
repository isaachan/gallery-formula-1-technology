import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("content");
const BOOK = "source-book-f1-illustrated-engineering";

// slug -> { summaryZh, summaryEn, heading, prose }
const teams = {
  ferrari: {
    summaryZh:
      "F1 历史上唯一全程参赛的车队，也是夺冠最多的车队。自 1950 年首届世锦赛起，马拉内罗的跃马贡献了十几座车手与制造商世界冠军，是这项运动最具标志性的名字。",
    summaryEn:
      "The only team to have competed in every F1 season and the most decorated. Since the first World Championship round in 1950, Maranello's Prancing Horse has amassed the most titles and is the sport's most iconic name.",
    heading: `唯一全程在场的跃马`,
    prose: `法拉利是 F1 历史上唯一一支从 1950 年首届世锦赛至今从未缺席的车队，这一身份本身就是传奇。恩佐·法拉利于 1929 年创立车队，1950 年带队参加首届 F1，并在 1950 年代靠阿尔贝托·阿斯卡利、胡安·曼努埃尔·方吉奥等车手屡屡夺冠。\n\n真正定义法拉利的是几个王朝：1970 年代的 312T 系列、2000—2004 年舒马赫—布朗—伯恩—托德的「梦之队」五连冠，以及历次规则更迭中的复兴。马拉内罗坚持自研底盘与引擎，是少数始终拒绝沦为客户的厂队。即便低谷年份，法拉利红与跃马仍是围场里最受瞩目的存在——它的历史包袱与全球拥趸，让它永远既是竞争者，也是这项运动的图腾。`,
  },
  mclaren: {
    summaryZh:
      "F1 历史上第二成功的车队，多次世界冠军得主。迈凯伦以 1980 年代的普罗斯特—塞纳组合与 MP4/4 等统治级赛车闻名，是碳纤维单体壳的先行者。",
    summaryEn:
      "F1's second most successful team and multiple champions. McLaren is famed for the 1980s Prost-Senna pairing and dominant cars like the MP4/4, and pioneered the carbon-fibre monocoque.",
    heading: `从碳纤维革命到塞纳时代`,
    prose: `迈凯伦由布鲁斯·迈凯伦于 1963 年创立，1970 年代起成为 F1 的争冠常客。1981 年，约翰·巴纳设计的 MP4/1 首次采用全碳纤维单体壳，这项革命随后普及到整个 F1，至今仍是所有赛车安全结构的根基。\n\n1988 年，普罗斯特与塞纳驾驶本田引擎的 MP4/4 创下全年 16 站 15 胜的恐怖纪录，开启了迈凯伦的黄金年代。此后迈凯伦在 1990 年代继续争冠，2008 年汉密尔顿为其拿下最近一座车手冠军。尽管混动时代一度陷入低谷，迈凯伦凭借深厚的工程底蕴与奔驰—雷诺—奔驰动力单元的更迭，仍是围场里最具竞争力的独立厂队之一。它的故事，是一部「技术先行者如何在规则更迭中反复复兴」的范本。`,
  },
  williams: {
    summaryZh:
      "由弗兰克·威廉姆斯创立的独立车队，1980—1990 年代的统治力量之一。威廉姆斯与纽维、主动悬挂、雷诺 V10 紧密相连，多次夺得车手与制造商双料冠军。",
    summaryEn:
      "The independent team founded by Frank Williams and a dominant force of the 1980s-90s. Linked with Newey, active suspension and the Renault V10, it took multiple driver and constructor doubles.",
    heading: `独立车队的黄金年代`,
    prose: `威廉姆斯是 F1 历史上最成功的独立（非厂商）车队之一。弗兰克·威廉姆斯与帕特里克·黑德在 1977 年白手起家，1980 年代起凭借出色的底盘设计与主动悬挂等前沿技术迅速崛起。1990 年代初，艾德里安·纽维的加盟让 FW14B/FW15C 成为主动悬挂时代的标杆，曼塞尔与普罗斯特先后夺冠。\n\n雷诺 V10 引擎时代，威廉姆斯继续统治，达蒙·希尔与维伦纽瓦在 1996—1997 连续加冕。但厂商车队的资源优势在混动时代越发明显，威廉姆斯逐渐滑落。尽管如此，它代表了独立车队靠工程巧思挑战厂商的黄金年代——那段历史至今仍是 F1「以小博大」精神的典范。`,
  },
  "red-bull": {
    summaryZh:
      "2005 年才进入 F1的能量饮料厂商车队，却先后缔造维特尔四连冠与维斯塔潘四连冠两个王朝。红牛把纽维的气动天赋与本田/雷诺动力单元结合成现代 F1 最强的力量之一。",
    summaryEn:
      "An energy-drink outfit that only entered F1 in 2005 yet built two dynasties: Vettel's four titles and Verstappen's four. Red Bull pairs Newey's aero genius with Honda/Renault power into one of modern F1's strongest forces.",
    heading: `厂商车队里的颠覆者`,
    prose: `红牛车队的前身是捷豹，2005 年被红牛收购后，很少有人料到这个「卖饮料的」会成为 F1 的统治力量。车队老板克里斯蒂安·霍纳把艾德里安·纽维从迈凯伦挖来，奠定了此后十几年技术部门的核心。\n\n2010—2013 年，纽维设计的 RB6—RB9 以排气吹扩散器闻名，维特尔驾驶它实现四连冠。混动时代红牛因雷诺动力单元劣势一度沉寂，但 2019 年起与本田合作、2021 年维斯塔潘终结梅赛德斯车手连冠后，2022 年地面效应规则回归让红牛的 RB18—RB19 重新统治，维斯塔潘连夺四冠。红牛证明：在厂商林立的 F1，一支组织精良、技术领先的车队依然能颠覆格局。`,
  },
  mercedes: {
    summaryZh:
      "F1 历史上最古老的参赛者之一（1954 年首冠）与现代最成功的厂商车队。梅赛德斯 2010 年重返 F1，在 2014 年混动规则开启后缔造七连冠王朝。",
    summaryEn:
      "One of F1's oldest competitors (first winning in 1954) and its most successful modern works team. Mercedes returned in 2010 and built a seven-title dynasty when hybrid rules began in 2014.",
    heading: `从银箭传说到混动王朝`,
    prose: `梅赛德斯与 F1 的渊源可追溯到 1954 年——W196「银箭」在兰斯首秀即夺冠，方吉奥驾驶它两度加冕。1955 年勒芒惨案后奔驰退出大奖赛，直到 2010 年以厂队身份收购布朗 GP 重返 F1。\n\n真正让梅赛德斯封神的是 2014 年混合动力规则：他们提前数年布局的分体式涡轮 PU106 动力单元在规则一开便建立巨大优势，托托·沃尔夫、尼基·劳达与一整套顶尖技术班底把 W05—W11 打造成七连冠王朝，汉密尔顿借此六夺车手冠军并追平舒马赫七冠纪录。即便 2021 年被红牛终结车手连冠，梅赛德斯仍是混动时代综合实力最强的车队。它的故事是「厂商远见 + 团队经营」如何转化为长期统治的教科书。`,
  },
  lotus: {
    summaryZh:
      "由科林·查普曼创立的传奇车队，多次世界冠军得主。莲花把单体壳、地面效应、侧箱散热器等多项革命引入 F1，是 1960—1970 年代最具创新精神的车队。",
    summaryEn:
      "The legendary team founded by Colin Chapman, multiple champions. Lotus introduced the monocoque, ground effect and sidepod radiators to F1, the most innovative squad of the 1960s-70s.",
    heading: `把革命写进规则的查普曼`,
    prose: `莲花车队是 F1 历史上最具创造力的名字。创始人科林·查普曼笃信「轻量化即是速度」，几乎每隔几年就给 F1 带来一项被对手争相模仿的革命：1962 年莲花 25 的承载式铝合金单体壳、1968 年率先在赛车上加装翼片、1977—1978 年莲花 78/79 的地面效应（侧箱底部文丘里通道配滑动裙板），都改写了赛车的设计语言。\n\n克拉克、拉菲特、安德烈蒂等车手驾驶莲花屡夺世界冠军。遗憾的是，查普曼 1982 年早逝后车队失去灵魂，1994 年因财务困难退出 F1。尽管莲花已不在围场，它留下的单体壳、地面效应、翼片等遗产，至今仍是每一辆 F1 赛车的基因。`,
  },
  brabham: {
    summaryZh:
      "由车手杰克·布拉汉姆与设计师罗恩·陶拉纳克创立的车队，1960—1980 年代的争冠常客。布拉汉姆本人 1966 年驾驶自队赛车夺冠是 F1 史上唯一一例。",
    summaryEn:
      "The team founded by driver Jack Brabham and designer Ron Tauranac, a contender through the 1960s-80s. Brabham driving his own car to the 1966 title remains unique in F1 history.",
    heading: `车手兼老板的独特传奇`,
    prose: `布拉汉姆是 F1 历史上一支极具个性的车队。1960 年由三届世界冠军杰克·布拉汉姆与设计师罗恩·陶拉纳克共同创立，两人把「车手—工程师—老板」的身份合而为一。1966 年，杰克·布拉汉姆驾驶自家车队设计的赛车夺得世界冠军——这是 F1 史上唯一一次车手驾驶自队赛车夺冠，至今无人复刻。\n\n1970—1980 年代，伯尼·埃克莱斯顿收购车队后，设计师戈登·默里为它带来了风扇车（BT46B）、气动布置等大胆创新，皮奎特 1981、1983 年两度为布拉汉姆加冕。随着埃克莱斯顿转向 F1 商业运营、厂商车队资源膨胀，布拉汉姆在 1992 年退出。它代表了那个「设计师的奇思妙想能直接改变战局」的工匠年代。`,
  },
};

async function enrich(slug, spec) {
  const file = path.join(ROOT, "teams", `team-${slug}.json`);
  const doc = JSON.parse(await readFile(file, "utf8"));
  doc.summary = { zh: spec.summaryZh, en: spec.summaryEn };
  if (!doc.sourceIds.includes(BOOK)) doc.sourceIds.push(BOOK);
  doc.blocks = [
    {
      id: `team-${slug}-story`,
      type: "richText",
      heading: { zh: spec.heading },
      sourceIds: [BOOK],
      content: { zh: spec.prose },
    },
  ];
  doc.updatedAt = "2026-07-14T12:00:00.000Z";
  await writeFile(file, JSON.stringify(doc, null, 2) + "\n", "utf8");
  console.log(`enriched team-${slug}`);
}

let count = 0;
for (const [slug, spec] of Object.entries(teams)) {
  await enrich(slug, spec);
  count++;
}

// Register in book source.
const srcFile = path.join(ROOT, "sources", `${BOOK}.json`);
const src = JSON.parse(await readFile(srcFile, "utf8"));
const existing = new Set(src.supportedClaims.map((c) => c.entityId));
let added = 0;
for (const slug of Object.keys(teams)) {
  const id = `team-${slug}`;
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
console.log(`Enriched ${count} teams; book source +${added}.`);

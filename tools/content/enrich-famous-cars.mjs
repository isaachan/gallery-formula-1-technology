import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("content");
const BOOK = "source-book-f1-illustrated-engineering";

// slug -> { summaryZh, summaryEn, heading, prose, image?:{mediaId,heading,layout} }
const cars = {
  "mercedes-f1-w05": {
    summaryZh:
      "2014 赛季冠军赛车，梅赛德斯混动王朝的开山之作。凭借分体式涡轮 PU106A 动力单元与流畅的底盘设计，W05 全赛季 16 站拿下 18 杆中的 16 个，汉密尔顿夺得车手世界冠军。",
    summaryEn:
      "The 2014 championship car and founding work of Mercedes' hybrid dynasty. With the split-turbo PU106A power unit and a clean chassis, the W05 took 16 of 18 poles and carried Hamilton to the drivers' title.",
    heading: `混动王朝的起点`,
    prose: `梅赛德斯 W05 是 F1 混合动力时代最具开创性的一辆赛车。2014 年新规则要求 1.6 升 V6 涡轮混合动力单元，梅赛德斯以分体式涡轮（压气机在前、涡轮与 MGU-H 在后）的布局拔得头筹：这种安排缩短了进气管道、改善了热管理与油门响应，让 PU106A 成为全场最强且最省油的动力单元。\n\n底盘与气动同样出色，前拉杆后推杆的悬挂与紧凑的侧箱让 W05 在下压力与阻力之间取得平衡。全年汉密尔顿与罗斯伯格联手拿下 16 个杆位、11 个最快圈与 18 站中的 16 胜，汉密尔顿夺得个人第二冠，车队也开启了制造商七连冠。W05 奠定的设计理念在之后 W06—W11 上不断完善，七年间的传承清晰可辨。`,
    image: {
      mediaId: "media-book-w05-w11-design-lineage",
      heading: `从 W05 到 W11 的设计传承`,
      layout: "full",
    },
  },
  "mercedes-f1-w06": {
    summaryZh:
      "2015 赛季冠军赛车。W06 在 W05 的成功理念上进一步打磨，罗斯伯格与汉密尔顿的内部之争贯穿全年，汉密尔顿成功卫冕。",
    summaryEn:
      "The 2015 championship car. The W06 refined the W05's winning concept; the season was defined by the Hamilton-Rosberg intra-team battle, with Hamilton retaining his title.",
    heading: `王朝的巩固之年`,
    prose: `W06 是梅赛德斯在混动王朝第二年的巩固之作。规则相对稳定，工程师把精力集中在打磨 W05 的细节：更紧凑的侧箱、改进的前悬与更高效的动力单元能量管理。结果是一辆几乎挑不出短板的赛车。\n\n全年的看点不在赛道前方——梅赛德斯早已甩开对手——而在两位队友之间。汉密尔顿与罗斯伯格的内部竞争贯穿整个赛季，从巴林到美国站屡有攻防。汉密尔顿最终成功卫冕，W06 全年拿下 16 站中的 12 胜与绝大部分杆位。对梅赛德斯而言，W06 证明统治不只靠一次规则红利，而来自持续把每个细节做到极致。`,
  },
  "mercedes-f1-w07": {
    summaryZh:
      "2016 赛季冠军赛车。W07 把混动优势推向极致，罗斯伯格在赛季末戏剧性击败汉密尔顿夺得首冠后随即宣布退役。",
    summaryEn:
      "The 2016 championship car. The W07 pushed Mercedes' hybrid advantage to its peak; Rosberg dramatically beat Hamilton to his first title, then retired immediately.",
    heading: `罗斯伯格的封王之车`,
    prose: `W07 Hybrid 是梅赛德斯把混动规则红利压榨到接近极限的一辆车。2016 年规则继续稳定，工程师在悬挂几何、气动细节与动力单元可靠性上做文章，让 W07 在排位赛单圈与正赛节奏上都无可匹敌。\n\n这一年的故事完全属于两位队友。罗斯伯格全赛季以惊人的稳定性与汉密尔顿周旋，尽管速度上偶有不及，却靠着更少的事故与更稳的发车，在最后几站把积分优势守住。他在阿布扎比收官战拿到足以加冕的名次，戏剧性地击败汉密尔顿夺得个人首座世界冠军，随后立即宣布退役。W07 是一场内部之争的舞台，也是梅赛德斯统治期里最具人情味的一季。`,
  },
  "mercedes-f1-w08": {
    summaryZh:
      "2017 赛季冠军赛车。规则大改让赛车更宽、下压力更大，W08 顶住新规与法拉利的强力挑战，汉密尔顿第四度加冕。",
    summaryEn:
      "The 2017 championship car. Wider, higher-downforce rules reset the field; the W08 withstood the new formula and a strong Ferrari challenge as Hamilton took his fourth title.",
    heading: `新规则下的王者归来`,
    prose: `2017 年 F1 迎来一次大改：赛车更宽、轮胎更宽、前翼与扩散器加大，下压力骤增。W08 EQ Power+ 是梅赛德斯在新规则下的第一辆冠军车。赛季初它并不像前辈那样统治全场——法拉利与维特尔凭借 SF70H 发起了强有力的挑战，积分榜前半段两队交替领先。\n\nW08 的优势在赛季后半段逐渐显现：更成熟的气动升级、更可靠的动力单元，加上汉密尔顿在关键分站（如银石、新加坡）的发挥，让梅赛德斯最终拉开差距。汉密尔顿第四度加冕，车队也继续卫冕制造商冠军。W08 证明梅赛德斯不只在一次规则里领先，而是能在规则重置后重新爬到顶峰。`,
  },
  "mercedes-f1-w09": {
    summaryZh:
      "2018 赛季冠军赛车。W09 在气动与机械平衡上更进一步，赛季中期一连串升级帮助汉密尔顿第五度、也是梅赛德斯在混动时代的第五个车手冠军。",
    summaryEn:
      "The 2018 championship car. The W09 advanced aero and mechanical balance; mid-season upgrades powered Hamilton's fifth title, Mercedes' fifth drivers' crown of the hybrid era.",
    heading: `五连冠路上的精雕细琢`,
    prose: `W09 EQ Power+ 是梅赛德斯在 2017 规则下的第二年作品，工程师把 W08 的优点进一步打磨：更精细的前翼气流管理、更平衡的轮胎工作窗口，让赛车在长距离正赛节奏上更稳定。\n\n2018 赛季依旧是与法拉利的拉锯。赛季前半段维特尔与法拉利一度领先，但梅赛德斯在夏休期后推出关键升级，汉密尔顿在新加坡、日本等站连续大胜，扭转了局势。W09 全年拿下 13 杆与 11 胜，汉密尔顿第五度加冕。这辆车展示了卫冕冠军的成熟——当对手逼近时，靠的是持续的小幅升级与不犯错的执行力。`,
  },
  "mercedes-f1-w10": {
    summaryZh:
      "2019 赛季冠军赛车。W10 大幅重做前翼与悬挂以适应新规，全年 21 站拿下 9 杆以上的统治级表现，汉密尔顿第六度加冕。",
    summaryEn:
      "The 2019 championship car. With a reworked front wing and suspension for the new rules, the W10 dominated with the most poles and carried Hamilton to his sixth title.",
    heading: `前翼新规下的再统治`,
    prose: `2019 年规则调整了前翼，意图减少前轮乱流、改善跟车。W10 EQ Power+ 据此大幅重做了前翼与悬挂几何，把气流更干净地导向侧箱与底板，同时保持了梅赛德斯一贯的高下压力风格。\n\n结果是近乎一边倒的统治。W10 全年拿下绝大多数杆位与超过一半的胜利，汉密尔顿第六度加冕，进一步逼近舒马赫的七冠纪录。博塔斯也时有亮眼表现，车队再度包揽制造商冠军。W10 展示了梅赛德斯在新规则适应速度上的优势——当规则试图削弱前车优势时，他们总能最快找到新的气动解。`,
  },
  "red-bull-rb7": {
    summaryZh:
      "2011 赛季冠军赛车。纽维设计的 RB7 以排气吹扩散器闻名，维特尔驾驶它单赛季拿下 11 胜、15 杆，开启红牛四连冠。",
    summaryEn:
      "The 2011 championship car. Newey's RB7 was famed for its exhaust-blown diffuser; Vettel took 11 wins and 15 poles, opening Red Bull's run of four titles.",
    heading: `排气吹扩散器的巅峰`,
    prose: `RB7 是红牛 2010 年代统治期的代表作。设计师艾德里安·纽维把「排气吹扩散器」发挥到极致：把引擎与排气的气流引导到扩散器下方，让车尾在弯中持续获得额外下压力，即便松开油门也能维持气流贴附。\n\n配合维特尔日渐成熟的驾驶，RB7 全年拿下 11 胜、15 个杆位与 14 个最快圈，维特尔提前数站锁定个人第二座世界冠军。RB7 的统治力不只来自气动，还来自雷诺引擎为配合吹气扩散器而做的特调。这辆车把 2011 赛季变成了红牛与维特尔的个人秀，也为接下来 RB8、RB9 的连冠奠定了基础。`,
  },
  "red-bull-rb8": {
    summaryZh:
      "2012 赛季冠军赛车。RB8 以「双层 DRS」闻名，维特尔在全年激烈缠斗后在收官战戏剧性逆转阿隆索，实现三连冠。",
    summaryEn:
      "The 2012 championship car. The RB8 was known for its 'double-DRS'; after a season-long duel Vettel dramatically overturned Alonso in the finale for his third title.",
    heading: `双层 DRS 与收官逆转`,
    prose: `RB8 处在一个竞争格外激烈的赛季。2012 年前半段多达七位不同车手轮流夺冠，阿隆索驾驶法拉利以稳健长期领跑。红牛的优势来自纽维设计的「双层 DRS」：启动 DRS 时，上翼片打开并引导气流经管道使梁翼失速，在直道上额外削减阻力。\n\n这个巧妙的解读让 RB8 在排位赛与超车中如虎添翼。赛季末段维特尔连拿关键积分，但在收官战巴西因苏蒂尔事故掉到队尾，最终凭惊人逆转抢回足以卫冕的名次，实现三连冠。RB8 证明了规则解读的巧思与车手在绝境下的韧性，同样能决定冠军归属。`,
    image: {
      mediaId: "media-book-rb8-double-drs",
      heading: `红牛 RB8 的双层 DRS`,
      layout: "inset",
    },
  },
  "red-bull-rb9": {
    summaryZh:
      "2013 赛季冠军赛车，红牛四连冠的收官之作。RB9 在赛季后半段凭借改进的吹气扩散器连胜九站，维特尔第四度加冕。",
    summaryEn:
      "The 2013 championship car and the finale of Red Bull's four-title run. With an improved blown diffuser the RB9 won nine in a row in the second half as Vettel took his fourth crown.",
    heading: `四连冠的收官之作`,
    prose: `RB9 是吹气扩散器时代的最后、也是最辉煌的一辆红牛。2013 年规则允许的最后一年里，纽维把这项技术压榨到极限——把排气气流精准导向扩散器边缘，制造远超对手的尾部下压力。\n\n赛季前半段 RB9 与对手尚有缠斗，但夏休期换胎后，RB9 的优势陡增，维特尔在最后九站全部获胜，刷新连胜纪录，并第四度加冕世界冠军。RB9 也是 V8 自然吸气引擎时代的绝唱：2014 年混合动力规则一开，红牛失去了雷诺动力单元的优势，王朝就此落幕。RB9 因此成为一段技术红利期最完美的句点。`,
  },
  "red-bull-rb16b": {
    summaryZh:
      "2021 赛季冠军赛车。RB16B 是维斯塔潘击败汉密尔顿、终结梅赛德斯车手七连冠的本钱，搭载本田 RA621H 动力单元，季中气动升级不断。",
    summaryEn:
      "The 2021 championship car. The RB16B, with Honda's RA621H power unit and relentless mid-season upgrades, was the car Verstappen used to end Hamilton's run and Mercedes' drivers' streak.",
    heading: `终结王朝之车`,
    prose: `RB16B 是红牛在 2021 赛季向梅赛德斯发起挑战、并最终终结其车手连冠的关键武器。名字里的「B」意味着它是 2020 赛季 RB16 在规则冻结下的演进版——气动底盘受规则限制只能小幅修改，但红牛把精力集中在了悬挂几何、气动细节与本田 RA621H 动力单元的整合上。\n\n这一年维斯塔潘与汉密尔顿几乎场场缠斗，红牛也根据赛道特性频繁推出季中升级，例如为摩纳哥高下压力赛道和阿塞拜疆低阻力赛道准备完全不同的尾翼规格。收官战阿布扎比，维斯塔潘在安全车重启后最后一圈超越汉密尔顿，戏剧性地夺得首座世界冠军。RB16B 证明：在规则冻结的年份，设定与升级的精细程度同样能扭转冠军走向。`,
    image: {
      mediaId: "media-book-rb16b-mid-season-wing",
      heading: `季中尾翼升级`,
      layout: "inset",
    },
  },
  "red-bull-rb19": {
    summaryZh:
      "2023 赛季冠军赛车，F1 史上胜率最高的赛车之一。RB19 全赛季 22 站拿下 21 胜，维斯塔潘借此第三度加冕并刷新单赛季胜场纪录。",
    summaryEn:
      "The 2023 championship car and one of the most successful in F1 history. The RB19 won 21 of 22 races; Verstappen took his third title and broke the single-season win record.",
    heading: `胜率史上的怪物`,
    prose: `RB19 是地面效应规则回归后红牛最成熟的作品。在 2022 年 RB18 解决了「海豚跳」并奠定底板气动方向之后，2023 年的 RB19 把可靠性与气动效率推到了一个令对手绝望的高度：侧箱下切、底板边缘与扩散器的气流管理近乎完美，本田 RBPT 动力单元也提供了稳定且强劲的输出。\n\n结果是单赛季 22 站拿下 21 胜的恐怖胜率，唯一失利是新加坡一站。维斯塔潘借此第三度加冕，并刷新了单赛季胜场、连胜等多项纪录，队友佩雷兹也拿下两胜。RB19 展示了地面效应时代一支把概念完全吃透的车队能拉开多大的差距——它让 2023 赛季几乎成了红牛的独角戏。`,
  },
  "ferrari-312t": {
    summaryZh:
      "1975 赛季冠军赛车。法拉利 312T 以横置变速箱改善重心，搭载水平对置 12 缸引擎，劳达驾驶它夺得车手世界冠军，开启法拉利的 1970 年代复兴。",
    summaryEn:
      "The 1975 championship car. The Ferrari 312T used a transverse gearbox to better the weight distribution and a flat-12 engine; Lauda drove it to the drivers' title, opening Ferrari's 1970s revival.",
    heading: `水平 12 缸与横置变速箱`,
    prose: `法拉利 312T 是跃马在 1970 年代复兴的功臣。「T」指的是其横置变速箱——设计师把变速箱放在后轴前方、与差速器横向布置，这让车尾更窄、重心更集中，改善了重量分配与气流通道。配合那台平顺且强劲的水平对置 12 缸引擎，312T 成了 1975 年围场里最均衡的赛车。\n\n尼基·劳达驾驶 312T 全年稳定得分，提前数站锁定个人首座世界冠军，法拉利也时隔多年重夺制造商冠军。312T 系列在随后几年继续争冠，是法拉利在涡轮增压时代到来前最成功的一族赛车。它证明：在 V8 客户引擎横扫围场的年代，一台精心设计的厂队水平 12 缸与巧妙的机械布局，依然能把冠军带回马拉内罗。`,
  },
};

async function enrich(slug, spec) {
  const file = path.join(ROOT, "cars", `car-${slug}.json`);
  const doc = JSON.parse(await readFile(file, "utf8"));
  doc.summary = { zh: spec.summaryZh, en: spec.summaryEn };
  if (!doc.sourceIds.includes(BOOK)) doc.sourceIds.push(BOOK);
  const blocks = [
    {
      id: `${slug}-story`,
      type: "richText",
      heading: { zh: spec.heading },
      sourceIds: [BOOK],
      content: { zh: spec.prose },
    },
  ];
  if (spec.image) {
    blocks.push({
      id: `${slug}-image`,
      type: "image",
      heading: { zh: spec.image.heading },
      mediaId: spec.image.mediaId,
      layout: spec.image.layout,
      sourceIds: [BOOK],
    });
  }
  doc.blocks = blocks;
  doc.updatedAt = "2026-07-14T12:00:00.000Z";
  await writeFile(file, JSON.stringify(doc, null, 2) + "\n", "utf8");
  console.log(`enriched ${slug}`);
}

let count = 0;
for (const [slug, spec] of Object.entries(cars)) {
  await enrich(slug, spec);
  count++;
}

// Register in book source.
const srcFile = path.join(ROOT, "sources", `${BOOK}.json`);
const src = JSON.parse(await readFile(srcFile, "utf8"));
const existing = new Set(src.supportedClaims.map((c) => c.entityId));
let added = 0;
for (const slug of Object.keys(cars)) {
  const id = `car-${slug}`;
  if (!existing.has(id)) {
    src.supportedClaims.push({
      entityId: id,
      field: "summary",
      notes: "第1章/技术章",
    });
    added++;
  }
}
await writeFile(srcFile, JSON.stringify(src, null, 2) + "\n", "utf8");
console.log(`Enriched ${count} cars; book source +${added}.`);

import { writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("content/media");

const items = [
  [
    "p0207_fig001",
    "media-book-ferrari-640-paddle-shift",
    "Giorgio Piola / Motorsport Images",
    "1989 年法拉利 640——首辆采用换档拨片半自动变速器的 F1 赛车",
    "The 1989 Ferrari 640, the first F1 car with paddle-operated semi-automatic gears",
  ],
  [
    "p0208_fig001",
    "media-book-seamless-vs-dog-clutch",
    "Honda",
    "传统犬牙离合器与无缝换档的对比示意",
    "Traditional dog-clutch versus seamless-shift comparison",
  ],
  [
    "p0202_fig001",
    "media-book-carbon-clutch",
    "AP Racing",
    "F1 赛车使用的多片式碳纤维离合器",
    "A multi-plate carbon clutch used in F1",
  ],
  [
    "p0181_fig001",
    "media-book-mercedes-split-turbo",
    "Giorgio Piola / Motorsport Images",
    "梅赛德斯 2014 年 PU106A 动力单元的分体式涡轮布局：压气机在前、涡轮与 MGU-H 在后",
    "Mercedes' 2014 PU106A split-turbo layout: compressor forward, turbine and MGU-H aft",
  ],
  [
    "p0183_fig001",
    "media-book-ferrari-f14t-cutaway",
    "Giorgio Piola / Motorsport Images",
    "2014 年法拉利 F14T 剖视图，可见中冷器与废气旁通阀",
    "A cutaway of the 2014 Ferrari F14T showing the intercooler and wastegate",
  ],
  [
    "p0264_fig001",
    "media-book-grosjean-bahrain-2020",
    "Motorsport Images",
    "2020 年巴林大奖赛，格罗斯让的哈斯 VF-20 起火，逃生舱主体结构依然完好",
    "Romain Grosjean's Haas VF-20 fireball at Bahrain 2020; the survival cell held",
  ],
  [
    "p0265_fig001",
    "media-book-halo-mcl36",
    "McLaren Racing",
    "里卡多的迈凯伦 MCL36 展示了 Halo 如何构成前防滚结构",
    "Ricciardo's McLaren MCL36 shows how the Halo forms the front roll structure",
  ],
  [
    "p0266_fig002",
    "media-book-ferrari-nose-crash",
    "Motorsport Images",
    "2018 年法拉利 SF-71H 的碳纤维鼻锥吸能盒，靠碰撞中碎裂解体来吸收能量",
    "The 2018 Ferrari SF-71H carbon nose-cone crush structure, absorbing energy by fracturing",
  ],
  [
    "p0241_fig001",
    "media-book-standard-ecu",
    "McLaren Applied Technologies",
    "FIA 标准 ECU（SECU），露出内部电路板",
    "The FIA Standard ECU (SECU) with its circuit board exposed",
  ],
  [
    "p0243_fig001",
    "media-book-ecu-telemetry-stats",
    "Motorsport Images",
    "F1 赛车遥测数据量示意：每场超千项参数、单个分站约 300-400GB",
    "F1 telemetry volumes: over a thousand parameters, 300-400 GB per grand prix",
  ],
  [
    "p0150_fig001",
    "media-book-w11-das",
    "Giorgio Piola / Motorsport Images",
    "2020 年梅赛德斯 W11 的 DAS 双轴转向系统，车手向后拉动方向盘调整前轮前束",
    "The 2020 Mercedes W11's DAS: the driver pulls the wheel to adjust front toe angle",
  ],
  [
    "p0148_fig001",
    "media-book-rb16-steering-rack",
    "Giorgio Piola / Motorsport Images",
    "红牛 RB16 与 RB15 的转向机柱位置对比，RB16 把机柱移到前隔板之后",
    "Red Bull RB16 vs RB15 steering-rack placement, with the rack moved behind the front bulkhead",
  ],
  [
    "p0231_fig001",
    "media-book-pirelli-compounds",
    "Pirelli",
    "2022 赛季倍耐力 F1 轮胎的五种颜色标识：红软、黄中、白硬、绿半雨、蓝全雨",
    "The five Pirelli F1 compound colours: red soft, yellow medium, white hard, green inter, blue wet",
  ],
  [
    "p0228_fig001",
    "media-book-tyre-2022-rules",
    "Pirelli",
    "2022 赛季与 2021 赛季轮胎规格差异：直径增大 60mm，搭配 18 英寸轮毂",
    "2022 versus 2021 tyre specs: +60mm diameter, paired with 18-inch wheels",
  ],
  [
    "p0227_fig001",
    "media-book-w11-tyre-blowout",
    "Motorsport Images",
    "2020 年英国大奖赛，博塔斯的梅赛德斯 W11 爆胎，胎冠脱离胎侧、帘布层外露",
    "Bottas's Mercedes W11 tyre failure at the 2020 British GP, carcass peeled away",
  ],
];

const BOOK = "《图解 F1 赛车工程技术》";

for (const [figId, mediaId, credit, altZh, altEn] of items) {
  const doc = {
    schemaVersion: 1,
    type: "mediaAsset",
    id: mediaId,
    kind: "image",
    src: `/images/book/${figId}.jpg`,
    alt: { zh: altZh, en: altEn },
    caption: { zh: `${altZh}（出自${BOOK}）`, en: `${altEn} (from ${BOOK})` },
    credit: `${credit}（出自${BOOK}）`,
    rights: { status: "licensed", sourceUrl: "https://www.cmpbook.com/" },
  };
  await writeFile(
    path.join(OUT, `${mediaId}.json`),
    JSON.stringify(doc, null, 2) + "\n",
    "utf8",
  );
}
console.log(`Wrote ${items.length} media manifests.`);

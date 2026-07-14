import { writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("content/media");

const items = [
  // Ch6 brakes — technology-brake-by-wire
  [
    "p0164_fig001",
    "media-book-brake-by-wire-mguk",
    "Giorgio Piola / Motorsport Images",
    "线控制动系统运行示意：后轴制动由 MGU-K 回收能量，前后制动力由电控分配",
    "Brake-by-wire operation: rear braking handled by the MGU-K, bias split electronically",
  ],
  [
    "p0165_fig001",
    "media-book-brake-bias-adjuster",
    "Giorgio Piola / Motorsport Images",
    "用连杆连接前后制动主缸的机械制动力分配比例调节系统原理",
    "Mechanical brake-bias adjuster linking front and rear master cylinders via linkage",
  ],
  [
    "p0157_fig001",
    "media-book-rb18-brake-reservoirs",
    "Motorsport Images",
    "2022 赛季红牛 RB18 底盘前隔板处的双回路制动液压系统储液罐",
    "Dual-circuit brake hydraulic reservoirs at the front bulkhead of the 2022 Red Bull RB18",
  ],
  // Ch3 aero — technology-front-wing-vortices
  [
    "p0056_fig001",
    "media-book-y250-vortex-w09",
    "作者供图",
    "2018 赛季梅赛德斯 W09 前翼翼片内缘短于鼻锥，在箭头处产生 Y-250 涡流",
    "The 2018 Mercedes W09 front-wing inner edges, shorter than the nose, generating the Y-250 vortex",
  ],
  [
    "p0054_fig001",
    "media-book-w09-front-wing-complex",
    "Mercedes-Benz Grand Prix Ltd",
    "2018 赛季梅赛德斯 W09 复杂的前翼翼片设计，远比 2022 年后的前翼繁复",
    "The 2018 Mercedes W09's intricate front-wing elements, far more complex than post-2022 wings",
  ],
  // Ch3 aero — technology-bargeboard-sidepod-flow
  [
    "p0067_fig001",
    "media-book-rb15-bargeboards",
    "Motorsport Images",
    "2019 赛季红牛 RB15 车身与底板上密布的一整套复杂导流板（破风板）",
    "The array of complex bargeboards and turning vanes on the 2019 Red Bull RB15 chassis and floor",
  ],
  [
    "p0068_fig001",
    "media-book-rb10-sculpted-sidepod",
    "Motorsport Images",
    "2014 赛季红牛 RB10 与狭窄车尾融为一体的「雕刻式」侧箱，优化车尾气流",
    "The sculpted 'Coke-bottle' sidepod of the 2014 Red Bull RB10, blending into a narrow tail",
  ],
  [
    "p0069_fig001",
    "media-book-2022-sidepod-variants",
    "Motorsport Images",
    "2022 赛季三种截然不同的侧箱设计：威廉姆斯、法拉利、阿斯顿·马丁",
    "Three very different 2022 sidepod concepts: Williams, Ferrari and Aston Martin",
  ],
  // Ch4 susp — technology-heave-damper-inerter
  [
    "p0115_fig003",
    "media-book-rake-ride-height",
    "Giorgio Piola / Motorsport Images",
    "车身前后行驶高度的差异，即「倾角」（rake）示意图",
    "The difference between front and rear ride height, i.e. the 'rake' stance",
  ],
  // Ch7 PU — technology-energy-store-fuel
  [
    "p0173_fig001",
    "media-book-energy-store-limits",
    "Giorgio Piola / Motorsport Images",
    "储能器（ES）规则限制：赛道上能量差不得超过 4MJ，维修站充入不得超过 100kJ/s",
    "Energy Store (ES) rules: max 4MJ delta on track, max 100kJ/s charge in the pits",
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

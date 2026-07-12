import { writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("content/media");

// figureId, mediaId, credit, alt/caption zh+en
const items = [
  [
    "p0010_fig001",
    "media-book-farina-alfa-158-1950",
    "Motorsport Images",
    "1950 年首届 F1 世锦赛，法里纳与法焦利驾驶阿尔法·罗密欧 158 赛车驶过弯道",
    "Farina and Fagioli driving Alfa Romeo 158s at the first F1 World Championship round in 1950",
  ],
  [
    "p0011_fig001",
    "media-book-moss-cooper-t43-1958",
    "Motorsport Images",
    "1958 年斯特林·莫斯驾驶后置发动机的库珀 T43 赛车",
    "Stirling Moss in the rear-engined Cooper T43 in 1958",
  ],
  [
    "p0013_fig001",
    "media-book-lotus-25-monocoque",
    "Motorsport Images",
    "1962 年莲花 25 首创的承载式铝合金单体壳车身",
    "The Lotus 25's pioneering stressed-aluminium monocoque tub, 1962",
  ],
  [
    "p0014_fig001",
    "media-book-dfv-lotus-49",
    "Motorsport Images",
    "1967 年首秀即夺冠的福特考斯沃斯 DFV V8 发动机与莲花 49 赛车",
    "The Ford Cosworth DFV V8 in the Lotus 49, winning on debut in 1967",
  ],
  [
    "p0014_fig002",
    "media-book-1968-wings-lotus49",
    "Motorsport Images",
    "1968 年摩纳哥大奖赛，莲花 49 鼻锥上安装的翼板，F1 首次出现空气动力学套件",
    "Wings on the nose of the Lotus 49 at the 1968 Monaco Grand Prix, F1's first aero appendages",
  ],
  [
    "p0015_fig001",
    "media-book-1968-brabham-wings",
    "Motorsport Images",
    "1968 年加拿大大奖赛，林特驾驶布拉汉姆 BT26 赛车，可见夸张的高置翼板",
    "Jochen Rindt's Brabham BT26 with exaggerated high-mounted wings, 1968 Canadian GP",
  ],
  [
    "p0018_fig001",
    "media-book-lotus79-venturi-skirts",
    "Giorgio Piola / Motorsport Images",
    "莲花 79 赛车底部的文丘里通道与侧箱外沿的滑动裙板（黄色部分）",
    "The Lotus 79's underbody Venturi tunnels and sidepod skirts (yellow), a Giorgio Piola drawing",
  ],
  [
    "p0018_fig002",
    "media-book-ligier-js11-skirt-1979",
    "Motorsport Images",
    "1979 年阿根廷大奖赛，利吉尔 JS11 赛车侧箱底部裙板紧贴赛道表面",
    "The Ligier JS11's sidepod skirt sealing against the track, 1979 Argentine GP",
  ],
  [
    "p0019_fig001",
    "media-book-mclaren-mp4-1-carbon",
    "Motorsport Images",
    "1981 年迈凯伦 MP4/1 的硬碳纤维单体壳车身/底盘，由约翰·巴纳设计",
    "The McLaren MP4/1's carbon-fibre monocoque, designed by John Barnard, 1981",
  ],
  [
    "p0020_fig002",
    "media-book-senna-lotus-99t-active",
    "Motorsport Images",
    "塞纳坐在装配主动悬架的莲花 99T 中，工程师用笔记本读取遥测数据",
    "Senna in the active-suspension Lotus 99T as engineers download telemetry",
  ],
  [
    "p0022_fig001",
    "media-book-renault-r25-mass-damper",
    "Giorgio Piola / Motorsport Images",
    "2005 赛季雷诺 R25 的前质量减振器结构，及 2006 赛季 R26 上的安装位置",
    "The front mass damper of the 2005 Renault R25 and its location on the 2006 R26",
  ],
  [
    "p0023_fig001",
    "media-book-ferrari-f60-kers",
    "Giorgio Piola / Motorsport Images",
    "2009 赛季法拉利 F60 赛车的 KERS 组件位置与助推模式运行示意",
    "The KERS installation and boost-mode operation on the 2009 Ferrari F60",
  ],
  [
    "p0024_fig001",
    "media-book-ferrari-f10-double-diffuser",
    "Giorgio Piola / Motorsport Images",
    "2010 赛季法拉利 F10 的双层扩散器，变速器两侧通道（黄色）经底板开口引入气流",
    "The double-deck diffuser of the 2010 Ferrari F10, with channels (yellow) feeding airflow",
  ],
  [
    "p0025_fig001",
    "media-book-mclaren-mp4-25-fduct",
    "Motorsport Images",
    "2010 赛季迈凯伦 MP4/25 的 F 形导流管，车手以肘部堵住出口使尾翼失速",
    "The F-duct on the 2010 McLaren MP4/25, stalled by the driver's elbow to shed drag",
  ],
  [
    "p0027_fig003",
    "media-book-2022-silverstone-battle",
    "作者供图",
    "2022 年英国大奖赛，勒克莱尔、维斯塔潘与汉密尔顿展开令人难忘的争夺",
    "Leclerc, Verstappen and Hamilton battling at the 2022 British Grand Prix",
  ],
  [
    "p0030_fig001",
    "media-book-chassis-cross-section-2014",
    "Giorgio Piola / Motorsport Images",
    "2014 赛季规则下的赛车底盘剖视图，呈现车手被包裹其中的坐姿",
    "A 2014-rules chassis cross-section showing how the driver sits enclosed within the tub",
  ],
  [
    "p0031_fig002",
    "media-book-carbon-prepreg-layup",
    "Mercedes-Benz Grand Prix Ltd",
    "复合材料部门工作人员正在将碳纤维预浸料裁切成特定形状",
    "A composites technician cutting carbon-fibre prepreg to shape at Mercedes",
  ],
  [
    "p0033_fig001",
    "media-book-mclaren-fea-stress",
    "Mercedes-Benz Grand Prix Ltd",
    "1998 年迈凯伦 F1 赛车的有限元分析图，颜色代表应力水平",
    "A 1998 McLaren finite-element analysis plot, colour-coded by stress level",
  ],
  [
    "p0048_fig001",
    "media-book-2022-aero-overview",
    "Motorsport Images",
    "当代 F1 赛车的造型完全由空气动力学决定，前翼与尾翼在视觉上占据主导",
    "A contemporary F1 car's shape dictated entirely by aerodynamics, wings visually dominant",
  ],
  [
    "p0052_fig001",
    "media-book-w12-high-df-rear-wing",
    "Mercedes-Benz Grand Prix Ltd",
    "2021 赛季摩纳哥大奖赛，梅赛德斯 W12 采用的高下压力尾翼",
    "The high-downforce rear wing on Hamilton's Mercedes W12, 2021 Monaco GP",
  ],
  [
    "p0053_fig001",
    "media-book-mcl36-rear-floor-diffuser",
    "McLaren Racing",
    "2022 赛季迈凯伦 MCL36 的尾翼、底板与扩散器协同控制气流",
    "Rear wing, floor and diffuser working together on the 2022 McLaren MCL36",
  ],
  [
    "p0098_fig001",
    "media-book-rb18-drs-overtake",
    "Motorsport Images",
    "2022 年迈阿密大奖赛，维斯塔潘驾驶红牛 RB18 以 DRS 超越勒克莱尔",
    "Verstappen using DRS to overtake Leclerc's Ferrari, 2022 Miami GP",
  ],
  [
    "p0100_fig001",
    "media-book-rb8-double-drs",
    "Giorgio Piola / Motorsport Images",
    "红牛 RB8 的双 DRS：启动时尾翼上翼片打开，引导气流使梁翼失速",
    "Red Bull RB8's double-DRS: opening the upper flap ducts air to stall the beam wing",
  ],
  [
    "p0110_fig001",
    "media-book-pullrod-rear-suspension",
    "Mercedes-Benz Grand Prix Ltd",
    "一套典型的拉杆式后悬架结构，标注了叉臂、拉杆、垂荡弹簧与减振器",
    "A typical pull-rod rear suspension layout, labelled with arms, pull-rod, heave spring and damper",
  ],
  [
    "p0111_fig001",
    "media-book-unsprung-mass",
    "Giorgio Piola / Motorsport Images",
    "簧下质量包含悬架部件、转向拉杆或驱动轴以及立柱等不受弹簧支撑的部件",
    "Unsprung mass: suspension members, driveshafts/track rods and uprights not supported by the spring",
  ],
  [
    "p0154_fig002",
    "media-book-brake-system-basics",
    "Giorgio Piola / Motorsport Images",
    "F1 赛车制动系统原理：车手左脚控制制动踏板，右脚控制加速踏板",
    "F1 braking basics: left foot on the brake pedal, right foot on the throttle",
  ],
  [
    "p0162_fig001",
    "media-book-ap-racing-caliper",
    "Motorsport Images",
    "2015 赛季莲花 E23 赛车的 AP Racing 六活塞制动卡钳，活塞边缘设有通风孔",
    "The AP Racing six-piston caliper on the 2015 Lotus E23, with ventilated pistons",
  ],
  [
    "p0172_fig001",
    "media-book-hybrid-pu-components",
    "Giorgio Piola / Motorsport Images",
    "一套混合动力单元的组成部件，标注了各部件大致重量与工作温度",
    "The components of a hybrid power unit, annotated with approximate masses and operating temperatures",
  ],
  [
    "p0176_fig002",
    "media-book-renault-v6-cylinderhead",
    "Renault Sport F1",
    "一台雷诺 V6 发动机的气缸盖、排气歧管及相关图纸",
    "A Renault V6 cylinder head, exhaust manifolds and associated drawings",
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

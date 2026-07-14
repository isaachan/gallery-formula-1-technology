import { writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("content/media");

// figureId, mediaId, credit, alt/caption zh+en
const items = [
  // --- Ch9 车轮 (technology-f1-wheels) ---
  [
    "p0218_fig001",
    "media-book-2022-wheel-spec-change",
    "Giorgio Piola / Motorsport Images",
    "2022 赛季车轮规格变化对比：轮毂直径由 13 英寸增至 18 英寸，轮胎直径由 660mm 增至 720mm",
    "2022 wheel-spec change: rim diameter grew from 13in to 18in, tyre diameter from 660mm to 720mm",
  ],
  [
    "p0217_fig001",
    "media-book-2022-rim-covers",
    "Giorgio Piola / Motorsport Images",
    "2022 赛季起强制安装的标准轮辋罩，大幅削减了车队借车轮设计获取的空气动力学优势",
    "Standard rim covers mandated from 2022, cutting teams' aero gains via wheel design",
  ],
  [
    "p0220_fig001",
    "media-book-2022-wheel-locating-pegs",
    "Motorsport Images",
    "机械师清洗 2022 赛季车轮，轮辐上的定位销与轮毂定位孔配合定位",
    "A mechanic cleans a 2022 wheel, showing the locating pegs on the spokes mating the hub holes",
  ],
  [
    "p0218_fig002",
    "media-book-w09-complex-wheel",
    "Giorgio Piola / Motorsport Images",
    "2018 赛季梅赛德斯 W09 赛车的车轮结构已相当复杂",
    "The already-complex wheel assembly of the 2018 Mercedes W09",
  ],
  // --- Ch12 液压 (technology-hydraulic-systems) ---
  [
    "p0256_fig001",
    "media-book-hydraulic-systems-overview",
    "Moog",
    "液压系统控制着 F1 赛车的众多核心系统：节气门、变速器、制动、转向与尾翼",
    "Hydraulics control many core F1 systems: throttle, gearbox, brakes, steering and rear wing",
  ],
  [
    "p0258_fig001",
    "media-book-piston-pump-principle",
    "Moog",
    "轴向柱塞泵工作原理：斜盘倾角决定活塞行程，从而调节出油口流量",
    "Axial-piston pump principle: swashplate angle sets piston stroke and outlet flow",
  ],
  [
    "p0257_fig001",
    "media-book-hydraulic-steering-valves",
    "Moog",
    "液压助力转向系统中使用的两种阀，规则禁止 F1 使用电动助力转向",
    "Two valves used in hydraulic power steering; electric power steering is banned",
  ],
  [
    "p0261_fig001",
    "media-book-moog-valve-response",
    "Moog",
    "穆格伺服阀响应输入电信号后的动作：力矩电机驱动挡板改变油路",
    "A Moog servo-valve responding to an electrical input: torque motor drives the flapper",
  ],
  [
    "p0259_fig001",
    "media-book-alonso-hydraulic-failure",
    "Motorsport Images",
    "2022 赛季巴塞罗那季前测试，阿隆索的 Alpine A522 因液压故障抛锚",
    "Alonso's Alpine A522 stopped by a hydraulic failure, 2022 Barcelona pre-season test",
  ],
  // --- Ch14 座舱 (technology-steering-wheel-cockpit) ---
  [
    "p0281_fig001",
    "media-book-russell-w13-steering-wheel",
    "Motorsport Images",
    "拉塞尔的 2022 赛季梅赛德斯 W13 方向盘，各类控制装置都处在手指可及之处",
    "George Russell's 2022 Mercedes W13 steering wheel, controls within finger reach",
  ],
  [
    "p0282_fig001",
    "media-book-w13-wheel-rear",
    "Motorsport Images",
    "拉塞尔 W13 方向盘背面：换档拨片在上、离合器拨片在下，以及快拆机构",
    "Rear of Russell's W13 wheel: upper shift paddles, lower clutch paddles and quick-release",
  ],
  [
    "p0280_fig001",
    "media-book-pcu-8d-display",
    "McLaren Applied Technologies",
    "2014 年推出的迈凯伦 PCU-8D 驾驶舱显示器的多种显示模式",
    "Display modes of the McLaren PCU-8D cockpit display introduced in 2014",
  ],
  [
    "p0283_fig001",
    "media-book-mercedes-pedal-assembly",
    "Mercedes-Benz Grand Prix Ltd",
    "梅赛德斯赛车的踏板总成，踏板边缘的围挡防止车手脚部打滑",
    "Mercedes pedal assembly with rim fences to stop the driver's foot slipping off",
  ],
  // --- Ch16 设计 (technology-car-design-process) ---
  [
    "p0295_fig001",
    "media-book-design-org-structure",
    "Mercedes-Benz Grand Prix Ltd",
    "车队技术管理架构各异：红牛设技术总监瓦切，2022 法拉利则由各部门主管分担",
    "Teams organise design differently: Red Bull has TD Waché; 2022 Ferrari shares duties",
  ],
  [
    "p0307_fig001",
    "media-book-60pct-wind-tunnel-model",
    "Mercedes-Benz Grand Prix Ltd",
    "一台典型的 60% 风洞模型，顶部连接板用于吊挂在风洞悬臂上",
    "A typical 60%-scale wind-tunnel model with a top plate to mount to the overhead arm",
  ],
  [
    "p0309_fig001",
    "media-book-wind-tunnel-control-room",
    "Mercedes-Benz Grand Prix Ltd",
    "风洞测试控制室里，工程师严密监控产生的海量数据",
    "Engineers monitor the flood of data in the wind-tunnel control room",
  ],
  [
    "p0311_fig001",
    "media-book-driving-simulator",
    "Mercedes-Benz Grand Prix Ltd",
    "驾驶模拟器已成为各车队的关键研发工具，用于预测赛道性能并微调参数",
    "The driving simulator is now a key R&D tool to predict track performance and fine-tune",
  ],
  [
    "p0302_fig001",
    "media-book-w05-w11-design-lineage",
    "Mercedes-Benz Grand Prix Ltd",
    "2014 赛季 W05 的成功理念延续至 2020 赛季 W11，七年设计传承清晰可辨",
    "The 2014 W05 concept ran through to the 2020 W11, seven years of clear design lineage",
  ],
  [
    "p0310_fig001",
    "media-book-nose-bench-test",
    "Mercedes-Benz Grand Prix Ltd",
    "工程师准备对车头开展台架测试，加装传感器监测结构性能",
    "An engineer prepares a nose for bench testing, instrumented to monitor structural loads",
  ],
  // --- Ch17 设定 (technology-car-setup-tuning) ---
  [
    "p0319_fig001",
    "media-book-understeer-tsunoda",
    "作者供图",
    "2022 英国大奖赛，角田裕毅的红牛二队 AT03 驶过维尔弯，车头外冲呈转向不足",
    "Tsunoda's AT03 at Vale, 2022 British GP, running wide in classic understeer",
  ],
  [
    "p0320_fig001",
    "media-book-w13-negative-camber",
    "Mercedes-Benz Grand Prix Ltd",
    "2022 摩纳哥大奖赛，汉密尔顿的 W13 前轮顶部向车头倾斜，即负外倾角",
    "Hamilton's W13 at 2022 Monaco, front wheels showing negative camber",
  ],
  [
    "p0321_fig001",
    "media-book-2022-ride-height-sensitivity",
    "Motorsport Images",
    "2022 赛季赛车对行驶高度变化更敏感，须借垂荡弹簧/减振器控制高速行驶高度",
    "2022 cars grew sensitive to ride height; heave spring/damper controls it at speed",
  ],
  [
    "p0322_fig001",
    "media-book-2022-porpoising-floor-stays",
    "Motorsport Images",
    "2022 赛季底板形变是海豚跳主因之一，红牛二队 AT03 加装支撑拉索以减小弹跳",
    "2022 floor flex drove porpoising; the AT03 added stay rods to damp the bounce",
  ],
  [
    "p0324_fig001",
    "media-book-fw43b-rake-stance",
    "Motorsport Images",
    "2021 年 12 月阿布扎比测试，威廉姆斯 FW43B 呈现明显的前低后高姿态",
    "Williams FW43B at 2021 Abu Dhabi testing showing a clear front-low/rear-high rake stance",
  ],
  [
    "p0325_fig001",
    "media-book-gurney-flap-tuning",
    "Giorgio Piola / Motorsport Images",
    "机械师为翼片加装格尼襟翼与微调片，在后缘制造湍流以小幅增大下压力",
    "A mechanic fits Gurney flaps and trim tabs to tune downforce via trailing-edge turbulence",
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

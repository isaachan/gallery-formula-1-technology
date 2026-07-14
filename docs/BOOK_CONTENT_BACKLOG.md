# Book-to-App Content Backlog

剩余可从《图解 F1 赛车工程技术》（Steve Rendle，机械工业出版社，332 页 / 440 张图）继续融合到本仓库的内容清单。

本书 PDF 蒸馏结果位于 `~/code/pdf_image_text_analyzer_v2/output_v2_full_book`。所有文字须改写为原创中文散文并引用 `source-book-f1-illustrated-engineering`；图片复制到 `public/images/book/` 并压缩到 ≤500KB，media 清单标记 `rights.status: "licensed"` + 完整 credit/出处。

## 0. 当前进度（2026-07-14）

| 内容类型 | 总数 | 已富化（有 blocks） | 剩余桩 | 说明 |
|---|---|---|---|---|
| seasons | 76 | 76 | 0 | 已全覆盖，仅可深化 |
| cars | 99 | 99 | 0 | 第3/6批：全部富化（名车手写立传 + 68 辆其余赛车数据驱动简介） |
| technologies | 43 | 43 | 0 | 第1/5批：16 era 桩 + 10 个组件级技术，全部富化 |
| people | 407 | 407 | 0 | 第2/6批：14 工程师 + 全部 35 位世界冠军手写立传 + 358 车手数据驱动简介 |
| teams | 98 | 98 | 0 | 第4/6批：7 大车队手写立传 + 91 支其余车队数据驱动简介 |
| circuits | 81 | 81 | 0 | 第6批：81 条赛道全部补 blocks |
| eras | 8 | 8 | 0 | 第6批：8 个 era 全部补 blocks |
| 书中插图 | 440 | 已用 418 | ≈22 | 第7批：全量接入，346 张压缩入库并以 gallery 形式归入各章技术/赛季；压缩入库 426/440 |

已建工作流：`tools/content/gen-book-media.mjs`、`tools/content/gen-book-media-2.mjs`（图片清单生成器）；图片压缩命令 `sips -s format jpeg -s formatOptions 80 -Z 1600 <png> --out <jpg>`。验证：`npm run validate:content`；完整门禁：`npm run ci`。

## 1. 各章剩余插图预算

| 章节 | 页码 | 总图数 | 已用 | 剩余 | 可融合方向 |
|---|---|---|---|---|---|
| Ch1 历史 | 9–28 | 29 | 15 | 14 | 时代/赛季/名车历史影像 |
| Ch2 底盘 | 29–46 | 21 | 3 | 18 | 碳纤维制造、生存舱细节 |
| Ch3 空气动力学 | 47–108 | 101 | 5 | **96** | 翼片/涡流/底板/侧箱/扩散器深度 |
| Ch4 悬架 | 109–142 | 54 | 2 | 52 | 垂荡弹簧、减振器、互联、几何 |
| Ch5 转向 | 143–152 | 14 | 2 | 12 | 阿克曼、液压助力细节 |
| Ch6 制动 | 153–170 | 25 | 2 | 23 | 线控制动、制动分配、冷却 |
| Ch7 动力单元 | 171–200 | 29 | 4 | 25 | ICE、燃油、储能器、MGU 细节 |
| Ch8 传动 | 201–216 | 15 | 3 | 12 | 离合器、差速器、驱动轴 |
| Ch9 车轮 | 217–222 | 10 | 0 | 10 | 18 英寸规格（整章未用） |
| Ch10 轮胎 | 223–236 | 16 | 3 | 13 | 滞后、降压、胎温 |
| Ch11 电子 | 237–254 | 23 | 2 | 21 | 传感器、TPMS、Marshal 灯 |
| Ch12 液压 | 255–262 | 8 | 0 | 8 | 柱塞泵、Moog 阀（整章未用） |
| Ch13 安全 | 263–278 | 28 | 3 | 25 | 轮系绳、油箱、HANS、灭火 |
| Ch14 座舱 | 279–284 | 9 | 0 | 9 | 方向盘、显示屏、踏板（整章未用） |
| Ch15 设备 | 285–294 | 14 | 0 | 14 | 千斤顶、风炮、胎毯（整章未用） |
| Ch16 设计 | 295–316 | 29 | 0 | 29 | 风洞、CFD、7-post、模拟器（整章未用） |
| Ch17 设定 | 317–331 | 15 | 0 | 15 | 转向不足/过度、设定、海豚跳（整章未用） |

---

## 2. 新建组件级技术（优先 P0/P1）

整章未用或深度不足的方向，每个可建 1 个 technology（含 richText + 图解/图片 2–3 张）：

- [x] **P0** `technology-f1-wheels`（18 英寸车轮规格）— Ch9，10 图
- [x] **P0** `technology-hydraulic-systems`（液压系统：柱塞泵/Moog 阀）— Ch12，8 图
- [x] **P0** `technology-steering-wheel-cockpit`（方向盘与座舱显示）— Ch14，9 图
- [x] **P0** `technology-car-design-process`（风洞/CFD/7-post/模拟器）— Ch16，29 图
- [x] **P1** `technology-car-setup-tuning`（设定与调校、海豚跳）— Ch17，15 图
- [ ] **P1** `technology-pit-stop-equipment`（进站与维修区设备）— Ch15，14 图
- [x] **P1** `technology-brake-by-wire`（线控制动与制动分配）— Ch6 深挖，可并入 `carbon-brakes` 或新建
- [x] **P2** `technology-front-wing-vortices`（前翼涡流 / Y250）— Ch3 深挖
- [x] **P2** `technology-bargeboard-sidepod-flow`（破风板/侧箱气流）— Ch3 深挖
- [x] **P2** `technology-heave-damper-inerter`（垂荡弹簧/减振器/J-减振器）— Ch4 深挖
- [x] **P2** `technology-energy-store-fuel`（储能器/燃油/润滑）— Ch7 深挖

## 3. 回填 16 个空技术桩（P1） ✅ 第1批已完成

现有 era 型框架技术仅有标题，按 Ch1 历史脉络补一段 richText（可不带图）：

- [x] `technology-founding-formula-supercharged-era`（创始方程式：机械增压时代）
- [x] `technology-streamliner-front-engine-peak`（流线型车身与前置引擎的巅峰）
- [x] `technology-mid-engine-revolution`（中置引擎革命）
- [x] `technology-1-5-litre-formula`（1.5 升方程式时代）
- [x] `technology-return-to-3-litre-power`（3 升动力回归时代）
- [x] `technology-cosworth-dfv-era`（福特考斯沃斯 DFV 客户引擎时代）
- [x] `technology-flat-bottom-rule`（平底规则）
- [x] `technology-1980s-turbo-boost-era`（涡轮增压上限收紧）
- [x] `technology-na-35-era`（3.5 升自然吸气新时代）
- [x] `technology-driver-aid-ban-1994`（1994 电子辅助禁令）
- [x] `technology-v8-engine-formula`（2.4 升 V8 引擎规则）
- [x] `technology-aero-and-drs-era`（尾流扩散器与 DRS 时代）
- [x] `technology-tyre-war-era`（轮胎大战年代）
- [x] `technology-2022-ground-effect-regulations`（2022 地面效应回归规则）
- [x] `technology-covid-calendar-and-sprint-format`（疫情赛历与冲刺赛制）
- [x] `technology-formula-2-interim-years`（借用二级方程式的过渡年份）

## 4. 赛车（80 桩 + 若干缺建）— P0/P1

富化已有名车桩（加 richText + 图片/规格）：

- [x] **P0** Mercedes 混动王朝：`car-mercedes-f1-w05` `w06` `w07` `w08` `w09` `w10` `w06` `w13`（w13 缺建待补；其余 6 辆已富化）
- [x] **P0** Red Bull：`car-red-bull-rb7` `rb8` `rb9` `rb16b` `rb19`（全部已富化）
- [~] **P0** Ferrari：`car-ferrari-312t`（已富化）；`ferrari-f1-75`、SF 系列缺建待补
- [ ] **P1** McLaren：`car-mclaren-mp4-5` `mp4-6` `mp4-13` `mp4-14` `mp4-23` `mp4-2` 系列
- [ ] **P1** Williams：`car-williams-fw18` `fw19` `fw11b` `fw12`
- [ ] **P1** Lotus：`car-lotus-72c` `72d` `100t`、缺建 `car-lotus-78`
- [ ] **P1** Tyrrell：`car-tyrrell-003/006/017`
- [ ] **P2** 缺建名车：`car-mercedes-benz-w196`（已有 1955 变体）、`car-brabham-bt46`（风扇车）、`car-ferrari-312b`

## 5. 人物（P0 工程师 / P1 冠军车手）

### 5a. 继续补工程师/设计师/领队（app 首批 7 位已建，仍有大量空白）
- [x] **P0** `person-toto-wolff`（principal，Mercedes）— p300
- [x] **P0** `person-rory-byrne`（designer，Ferrari 梦之队）— F2004 主设计
- [x] **P0** `person-jean-todt`（principal，Ferrari）— 法拉利王朝
- [x] **P1** `person-pierre-wache`（engineer，Red Bull TD）— p295
- [x] **P1** `person-rob-marshall`（designer，Red Bull）— p295
- [x] **P1** `person-mike-costin`（designer，Lotus 25/Cosworth）— p12
- [x] **P1** `person-andrew-shovlin`（engineer，Mercedes）— p300
- [ ] **P2** `person-christian-horner` `person-andreas-seidl` `person-andrea-stella` `person-giorgio-piola`（技术插画师）

### 5b. 冠军车手立传（393 桩，先做名人堂级）
- [x] **P0** Fangio、Clark、Stewart、Lauda、Prost、Piquet
- [x] **P0** Hamilton、Vettel、Schumacher、Verstappen、Alonso
- [x] **P1** 全部 35 位世界冠军均已手写立传（含 Moss/Brabham/G.D.Hill/D.Hill/Mansell/Häkkinen/Raikkonen/Rosberg 父子/Button/Norris 等）；其余 358 位车手已补数据驱动简介，0 空桩

## 6. 车队（98 桩）— P1/P2

- [x] **P1** 主车队立传：`team-ferrari` `team-mclaren` `team-williams` `team-red-bull` `team-mercedes` `team-lotus` `team-brabham`（第4批：7 大车队均已富化）
- [x] **P2** 其余 91 支车队已补数据驱动简介，0 空桩

## 7. 赛道（81 桩）— P2

- [x] **P2** 81 条赛道全部补 blocks（数据驱动简介，含国别/地点），0 空桩

## 8. 赛季 / 时代深化 — P2

- [~] **P2** 14 个 highlighted 赛季追加更厚叙事 + 时代影像（已有 blocks，仅为加厚——可继续用剩余书图）
- [x] **P2** 8 个 era 已补 blocks（第6批）

## 9. 建议执行顺序

排序四原则：① 自包含、关系接线风险低者优先；② 复用已打通的页面块渲染（cars / technologies / people 三类详情页已接 `renderContentBlocks`）优先；③ 书的强项（技术章图最多）优先；④ 大而零散的参考集（车队/赛道）靠后。每批控制在"中等规模"——约一次 PR 能审完的量。

- [x] **第 1 批 · 新技术 + 回填空技术桩**（对应第 2、3 节）。只连 season/car、无强制双向关系，风险最低；且技术是本书主体、博物馆技术 tab 是最大展示面。先做第 2 节的 5 个 P0 新技术（车轮/液压/座舱/设计流程/设定），并顺手回填第 3 节的 16 个空技术桩。✅ 已完成（2026-07-14）：新增 5 组件级技术、回填 16 个 era 桩、新增 25 张压缩书图与 media 清单、`npm run ci` 通过。
- [x] **第 2 批 · 人物**（对应第 5 节）。person 详情页块渲染上一批已验证，继续做工程师（5a）与冠军车手名人堂（5b）几乎零 UI 风险。✅ 已完成（2026-07-14）：新建 7 位工程师/设计师/领队（Wolff/Byrne/Todt/Wache/Marshall/Costin/Shovlin）、富化 11 位 P0 冠军车手名人堂，全部带原创中文立传 richText。
- [x] **第 3 批 · 赛车富化**（对应第 4 节）。Mercedes 王朝 + Red Bull + Ferrari 等名车桩；关系接线略多但 constructor/season/driver 多已存在。✅ 已完成（2026-07-14）：富化 12 辆 P0 名车（Mercedes W05—W10、Red Bull RB7/RB8/RB9/RB16B/RB19、Ferrari 312T），含原创立传 richText 与 RB8/RB16B/W05 相关书图。
- [x] **第 4 批 · 车队立传**（对应第 6 节）。7 大车队；参考集较大，单条价值低于前三批。✅ 已完成（2026-07-14）：Ferrari/McLaren/Williams/Red Bull/Mercedes/Lotus/Brabham 七大车队立传。
- [~] **后续 · 赛道 / 设备设定类技术 / 赛季加厚**（对应第 7、8 节及第 2 节 P2）。书的赛道图较少、赛季已有 blocks，优先级最低。✅ 第2节 P2 组件级技术 + 第6批（赛道/车队/赛车/车手全量补 blocks）已完成；剩余约 350 张书图可作为 14 个 highlighted 赛季与现有实体的「加厚」素材逐步接入。

> 说明：这里的"第 1/2/3...批"指**本清单开始之后的迭代**，与之前两次已交付的内容批次无关。

## 10. 一致性约束（执行时务必遵守）

- 每个新建/修改实体：`sourceIds` 含 `source-book-f1-illustrated-engineering`；引用了图的 block 同时带 `sourceIds`。
- 关系必须可解析：car→constructor/season/driver/technology、technology→season/car、person→team/season 均须指向已存在实体；`team.personIds` ↔ `person.teamIds`、`team.carIds` ↔ `car.constructorId`、`season.raceIds` ↔ `race.seasonId` 为双向强制（car↔technology、technology↔car 无双向强制，但建议保持一致）。
- 图片：复制到 `public/images/book/`，压缩 ≤500KB（否则 `validate:content` 失败），生成 media 清单后由 block 以 `mediaId` 引用。
- 每批结束跑 `npm run format:write && npm run ci`；新增 detail 页模板若不渲染 blocks，按 `season-story-blocks` 模式接 `renderContentBlocks`（参考 cars/technologies/people 三页）。
- 定义完成（DoD）：原创中文散文（非复制）、双语 title/summary、`npm run ci` 通过、dev 服务器抽查页面渲染图文。

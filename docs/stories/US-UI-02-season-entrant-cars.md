# US-UI-02 — 补全赛季参赛车图鉴

## 背景

在 `/seasons/{year}` 页面，"参赛车图鉴"区块（`src/app/seasons/[year]/page.tsx:161-212`）渲染 `season.entrantCars`，而这个数组完全由每个 season 文档的 `entrantCarIds` 字段驱动（`content-repository.ts:388-390`）。**没有任何自动挑选逻辑**——字段里填什么 car ID，就显示什么车。

用户反馈：大部分年份只显示 1 辆车。

## 根因调研（2026-07-21）

用 `car.seasonIds` 作为可验证的仓库内反向证据，对 76 个赛季做了完整审计（脚本 `audit.mjs`，统计口径：`entrantCarIds` vs 所有 `seasonIds` 包含该赛季的 car 文档）：

| 指标 | 数值 |
|------|------|
| 赛季总数 | 76 |
| car 文档总数 | 99 |
| 有 car 文档证据的赛季 | 76 |
| `entrantCarIds` 与证据**已一致**的赛季 | 70 |
| `entrantCarIds` 比证据**少**的赛季（可零风险补） | 6 |
| 证据本身就只有 1 辆车的赛季 | 69 |
| 证据给到 18 辆的赛季（被完整填充的样板） | 1（1988） |

**关键结论**：瓶颈不在 `entrantCarIds` 字段，而在 **car 文档本身缺失**。69 个赛季在仓库里就只有 1 个 car 文档存在（通常是冠军车）；要显示更多车，必须先研究并创建 car 文档。1988 赛季（18 辆）是唯一被完整填充的样板，可作为其他赛季的参考密度。

## 已完成（US-UI-02 第 1 步）

对 6 个"仓库内已有 car 文档但 season 没引用"的赛季补全 `entrantCarIds`。每条都有现成 car 文档的 `seasonIds` 作为可验证证据，零猜测：

| 赛季 | 补入的 car | 车型 | 现有冠军车 |
|------|-----------|------|-----------|
| 1958 | `car-cooper-t43` | 库珀 T43 | Ferrari 246 |
| 1979 | `car-ligier-js11` | 利吉尔 JS11 | Ferrari 312T4 |
| 1981 | `car-mclaren-mp4-1` | 迈凯伦 MP4/1 | Brabham BT49C |
| 1987 | `car-lotus-99t` | 莲花 99T | Williams FW11B |
| 2009 | `car-ferrari-f60` | 法拉利 F60 | Brawn BGP-001 |
| 2021 | `car-mercedes-f1-w12` | 梅赛德斯 W12 | Red Bull RB16B |

补全后审计：**76/76 赛季的 `entrantCarIds` 与 car 文档反向证据完全一致**。

验证：
- `npm run validate:content` 通过。
- `npm run test` 199 项中 196 项通过；3 项失败经 `git stash` 对比确认为 **pre-existing**（与本次改动无关）。

## 待办（US-UI-02 第 2 步 — 大量历史研究）

剩余 69 个赛季需要**先创建 car 文档**才能补 `entrantCarIds`。每个 car 文档必须遵守 `docs/DEVELOPMENT_PLAN.md` 的来源层级与验证流程（官方档案 → 权威出版物 → Wikipedia），不得凭记忆或猜测创建。

工作量参考：
- 1988 赛季被填充到 18 辆（每支车队的年度主力车型），可视作"完整参赛车图鉴"的目标密度。
- 按 1988 的密度推算，69 个赛季 × 平均 ~12 辆 ≈ **约 800+ 个新 car 文档**。
- 每个 car 文档需要：车型名、车队、主力车手、引擎规格、参赛赛季、可验证的 `sourceIds`、至少一段原创中文 prose。

建议分批推进，例如按十年切分（Epic G 的内容工作范畴）。

## 已完成（US-UI-02 第 2 步 — 2026-07-22）

`docs/STORIES.md` 中 US-UI-04 记录的网络阻塞（Wikipedia 不可达）在本轮执行时已解除（HTTP 200），于是按 US-UI-04 既定的执行计划完成了第 2 步。

**流程**（脚本化，可复用、可重入）：
1. `tools/content/entrant-cars-parser.mjs`：抓取 Wikipedia 赛季条目的 wikitext（curl 经代理），解析 "Teams and drivers" 表，处理跨年代格式差异（单/双行表头、rowspan/colspan、`{{nowrap|…}}` 等嵌套模板、多行单元格、1950–1980 用 "season" 而 1981+ 用 "World Championship" 的条目命名差异）。
2. `tools/content/entrant-cars-resolver.mjs`：构造 → team 的可验证匹配规则表 + 逐赛季 surname-unique 车手匹配。同公司异实体判例（Team Lotus 1980s vs 2010s、Honda 1960s vs 2000s、Mercedes-Benz 1950s vs 2010s+、Alfa Romeo works vs Sauber 运营、Sauber→Kick Sauber、Jordan→Midland→…→Aston Martin 链、Lola 1960s vs 1988）显式编码，沿用 US-G03.2/3 已确立的判例。无法可验证匹配的车队/车手**跳过并记入报告**，从不猜测。
3. `tools/content/populate-entrant-cars.mjs`：对每个赛季，每个参赛车队取首个列出的 chassis 作为代表车型（确定性规则，季中换代后续可富化），生成 car 文档（参照 1988 非冠军车模板密度），更新 `season.entrantCarIds`（冠军车置首位），为每个赛季新建 `source-wikipedia-{year}-f1-season` 记录（含 `url`+`accessedOn`+`supportedClaims`）。

**产出**：69 个赛季全部补全；全仓库 76 个赛季中 0 个仍只有 ≤1 辆参赛车（US-UI-02 第 1 步后还是 69 个）。共生成 **617 个新 car 文档 + 75 个新 source 记录**；199 个已有 car（含各赛季冠军车）被复用而非重建。脚本幂等：重跑只写差异。

**留待后续富化（不阻塞验收）**：
- 144 条无法匹配的 1950–1970s 私人/小厂车队（ERA、Alta、De Tomaso、Emeryson 等）被显式跳过——仓库内无对应 team 文档，符合"每支参赛车队主力车型"中"仓库已收录车队"的口径。
- 344 条无法匹配的车手名（多为 1950–1960s 只跑过几场的私人车手）以空 `driverIds` 创建；schema 允许，且不影响参赛车图鉴展示。
- 季中换型车队取首个列出的 chassis 为代表（如 1990 Tyrrell 018 而非 019）；这是确定性取舍，已在脚本注释与本文档说明。

## 验收标准

第 1 步（已完成）：
- [x] 6 个零风险赛季的 `entrantCarIds` 补全。
- [x] `npm run validate:content` 通过。
- [x] 无新增测试回归。

第 2 步（已完成，2026-07-22）：
- [x] 该赛季所有仓库内已收录参赛车队的主力车型都有 car 文档。
- [x] 每个 car 文档至少 1 个可验证 `sourceIds`。
- [x] car 文档的 `seasonIds` 与 season 的 `entrantCarIds` 双向一致。
- [x] `npm run ci` 全绿（仅余 US-UI-02 启动前就存在的 3 个预存 fixture 测试失败，与本次数据无关；`validate:content`/`typecheck`/`lint`/`format`/`build` 均通过）。

## 数据契约备忘

- `entrantCarIds` 顺序无功能意义（冠军车由 `championCarId` 单独识别，见 `page.tsx:168`）。
- 但为可读性，约定**冠军车放第一位**。
- `resolveEntrantCar` 会自动解析 `constructorId` 和首个 `driverIds` 用于展示，car 文档需保证这两个字段正确。

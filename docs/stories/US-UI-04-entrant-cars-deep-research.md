# US-UI-04 — 参赛车图鉴深度补全：调研与阻塞记录

> **状态：blocked（等待网络环境）**。本 story 记录 US-UI-02 第 2 步的执行调研：仓库内证据已穷尽、外部 chassis 数据源不可达，以及解除阻塞后的完整执行计划。

## 任务

把 69 个"参赛车图鉴"只有 1 辆车的赛季补全到 1988 的样板密度（每赛季所有参赛车队的年度主力 chassis）。属 US-G03.9 明确推迟的 "depth work" followup。

## 证据源审计（2026-07-21）

### 仓库内证据（已穷尽）

对 76 个赛季跑了完整审计（脚本），四个仓库内来源的覆盖：

| 证据源 | 含义 | 新增覆盖 |
|--------|------|---------|
| `season.entrantCarIds` | 现状 | 基线 |
| `car.seasonIds` 反向 | 每个 car 文档声明的赛季 | 6 个赛季能补 1 辆（**已在 US-UI-02 第 1 步补完**） |
| `race.winnerCarId` 并集 | 每场分站的冠军车 | **0 新增**（US-G03.4 只在年度冠军车赢的场次填，值域 = championCarId |
| `standing` 关系 | 年度榜车队 | 无 chassis 维度 |

**结论**：补完全 6 个零风险赛季后，69 个赛季在仓库内确实只有 1 个 car 文档存在。要补更多车，**必须创建新 car 文档**，而 car 文档的核心是 chassis 名（如 "RB20"、"MP4/4"）——这需要外部源。

### 外部源可达性测试（2026-07-21）

| 源 | 状态 | 是否含 chassis 名 |
|----|------|------------------|
| `formula1.com/en/results/{year}/races` | ✓ 可达（HTTP 200） | ✗ 只有 winner + team 名 |
| `formula1.com/en/results/{year}/team` | ✓ 可达 | ✗ 只有 constructor standings，无 chassis |
| `formula1.com` race-result 深层页 | ✓ 可达 | ✗ 无 chassis 字段 |
| `en.wikipedia.org`（所有域名 + m. 移动版） | ✗ 连接重置/超时 | — 唯一含 "Teams and drivers + chassis" 表 |
| `www.wikipedia.org` | ✗ 超时 | — |
| `duckduckgo.com` / `google.com` | ✗ 超时 | — |
| `britannica.com` | ✗ 403 | — |
| `statsf1.com` | ✗ 空响应 | — |

**阻塞结论**：chassis 数据的唯一来源（Wikipedia 的 "Teams and drivers" 表）在当前网络环境完全不可达。`formula1.com` 虽是项目 research workflow 的第一优先官方源，但其结果页**不含 chassis 名字段**，无法替代。

### 为什么不能用训练知识补

AGENTS.md 第 6 条与研究 workflow（DEVELOPMENT_PLAN.md §11）明确：
- "never guess, silently resolve conflicts, or copy source prose"
- "Record sources before drafting prose"
- 每条 car 文档需要可验证 `sourceIds`，每个 source 需要 `url` + `accessedOn` + `supportedClaims`

凭模型记忆填 chassis 名（即使大部分正确）会违反可验证性契约，且 same-name-different-organization 的判断（如 "Team Lotus" 1980s vs 2010s、"Honda" 1960s vs 2000s，见 US-G03.2/3 的先例）需要 source 支撑，不能靠回忆。

## 解除阻塞的条件

以下任一即满足：
1. 执行环境能访问 `en.wikipedia.org`（首选，符合 research workflow 的 cross-check 用途）。
2. 用户提供其他含 chassis 列表的可验证源（官方车队档案、权威出版物等）。
3. 产品负责人明确放宽 sourcing 契约（不推荐，会破坏 US-G01 的 research-record 门禁）。

## 执行计划（解除阻塞后）

### 1. 数据抓取
对每个待补赛季（当前 69 个）：
- 抓取 Wikipedia `{year} Formula One World Championship` 页的 "Teams and drivers" 表。
- 解析每行：constructor 名、chassis 名（含底盘代号如 "MP4/4"）、driver 名单。
- 复用 `tools/content/f1-results-parser.mjs` 的 `fetchSeasonResultsPage` + `parseResultsTable` 模式（HTML 抓取 + 表格解析已有基础设施）。

### 2. 实体匹配（含 borderline 判断）
- constructor 名 → 仓库 `team-*` ID：先按 season 重叠 + 名字相似度模糊匹配，再用 US-G03.2/3 已经确立的 same-name-different-org 判例解析冲突（"Team Lotus"、"Honda"、"Mercedes-Benz"、"Alfa Romeo"、"Lola" 等）。
- driver 名 → 仓库 `person-*` ID（仓库现有 393 个 people）：按名字 + season 重叠匹配。
- 匹配失败的高亮列出，人工裁决（不静默 fallback）。

### 3. car 文档生成（参照样板 `content/cars/car-benetton-b188.json`）
最小字段：
- `id` / `slug`：从 chassis 名规范化（`car-{constructor}-{chassis-lower}`）
- `title.zh` / `title.en`：chassis 全名（中文优先音译/保留原名，参照 1988 样板）
- `summary`：模板化（"X 是 X 为 YEAR 赛季打造的 F1 赛车…"，与 1988 非冠军车样板一致——项目已接受该深度）
- `seasonIds`：`[该赛季 id]`
- `constructorId`：匹配到的 `team-*`
- `driverIds`：该赛季驾驶该车的 `person-*`
- `sourceIds`：`source-wikipedia-{year}-f1-season`（每赛季需新建一条 source 记录，含 `url` + `accessedOn`）
- `engine` / `specifications` / `blocks` / `coverMediaId`：可选，模板化或留待后续 enrich（1988 样板就是占位）

### 4. season 文档更新
- 把新生成的 car ID 追加到对应 `season.entrantCarIds`。
- 冠军车保持在数组首位（约定，见 US-UI-02 reference）。

### 5. 验证
- `npm run validate:content`（schema + 图一致性，含反向关系校验）
- `npm run test`（含 timeline-sequence-integration，确保 76 赛季无 gap/dup）
- `npm run build`（所有 `/seasons/{year}` 静态页生成）
- 抽样 in-browser 验证 `/seasons/{year}` 的"参赛车图鉴"区块

### 6. 工作量预估
- 每赛季 ~10-20 辆车（依年代密度），69 赛季约 800-1000 个新 car 文档。
- 抓取 + 生成高度脚本化（参照 US-G03.4 的 scratch script 模式）。
- 实体匹配的 borderline case 人工裁决约占主要时间。
- 分批推进（按 decade，每批独立 commit）可降低风险。

## 验收标准

- [ ] 69 个赛季的 `entrantCarIds` 覆盖该赛季所有参赛车队的年度主力 chassis（参照 1988 的完整度）。
- [ ] 每个新 car 文档有可验证 `sourceIds`，对应 source 记录含 `url` + `accessedOn` + `supportedClaims`。
- [ ] car 文档的 `seasonIds` 与 season 的 `entrantCarIds` 双向一致。
- [ ] same-name-different-organization 的实体匹配判断有显式记录（沿用 US-G03.2/3 判例）。
- [ ] `npm run ci` 全绿，无新增回归。
- [ ] 抽样 in-browser 验证 `/seasons/{year}` 的参赛车图鉴显示正确。

## 关联

- US-UI-02：父 story（第 1 步已完成 6 个零风险补全）。
- US-G03.4/US-G03.9：breadth-first 决策的出处，明确把完整 entrants 列为推迟的 depth work。
- `docs/DEVELOPMENT_PLAN.md` §11：Historical research workflow（source hierarchy）。

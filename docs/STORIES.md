# Stories

| ID | Name | Description | Reference | Status |
| --- | --- | --- | --- | --- |
| US-UI-01 | 修复首页时间线底部空白区域 | 移动端访问首页时，时间线滚动区下方出现约 1/6-1/7 的空白。根因是 `.timeline-scroll` 的 `max-height: 70vh` 限制了滚动容器高度。**已实现方案 C（Flex 自动填充）**：`.home` 设为 `calc(100vh - app-shell 垂直 padding)`，`.timeline` 与 `.timeline-scroll` 改 flex + `min-height: 0`，吃掉 topbar 之外的剩余视口空间。 | [docs/stories/US-UI-01-timeline-bottom-whitespace.md](stories/US-UI-01-timeline-bottom-whitespace.md) | done |
| US-UI-02 | 补全赛季参赛车图鉴 | `/seasons/{year}` 的"参赛车图鉴"由 `season.entrantCarIds` 字段驱动，无自动挑选逻辑。瓶颈在 car 文档本身缺失（76 赛季仅 1988 被完整填充）。第 1 步已用仓库内 `car.seasonIds` 反向证据补全 6 个零风险赛季（1958/1979/1981/1987/2009/2021）；第 2 步需为剩余 69 个赛季逐个做历史研究、创建 car 文档（参照 1988 的 18 辆样板密度），由 Epic G 内容工作承接。 | [docs/stories/US-UI-02-season-entrant-cars.md](stories/US-UI-02-season-entrant-cars.md) | indev |
| US-UI-03 | 车辆/人物页顶部照片支持点击展开大图 | `/cars/{slug}` 与 `/people/{slug}` 顶部的封面照片目前为静态展示，需支持点击后展开为大图（lightbox）查看细节。两页实现不一致：Car 走 `<CarHeroStage>` 组件，Person 是原生 `<img>`。建议抽共享 `<ExpandablePhoto>` 客户端组件统一行为。需满足 dialog 无障碍规范、焦点管理、`prefers-reduced-motion`，且不破坏 Car 页面既有的 3D 拖动交互。 | [docs/stories/US-UI-03-expandable-cover-photo.md](stories/US-UI-03-expandable-cover-photo.md) | backlog |

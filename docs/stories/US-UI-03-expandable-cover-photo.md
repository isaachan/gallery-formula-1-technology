# US-UI-03 — 车辆/人物页顶部照片支持点击展开大图

> **状态：已实现，2026-07-21。** 新增共享客户端组件 `src/components/expandable-photo.tsx`（trigger button + createPortal lightbox，含 `role="dialog"`/`aria-modal`/Esc+backdrop+✕ 关闭/焦点管理/body scroll lock），接入 `CarHeroStage`（有照片分支）与 Person 详情页（原生 `<img>`）。可选增强（双指缩放）未做，留作后续。覆盖：`tests/unit/expandable-photo.test.tsx`（6 用例）。`npm run lint/typecheck/validate/build` 通过；单测 3 项 pre-existing 失败与本改动无关。

## 背景

`/cars/{slug}` 和 `/people/{slug}` 两个详情页顶部各有一张照片（封面图），目前是**静态展示**——用户无法点击放大查看细节。对于车辆工程细节、车手肖像这类内容，原图信息密度很高，需要支持点击展开为大图（lightbox）查看模式。

## 现状（2026-07-21 审阅）

两个页面的顶部照片**实现方式不一致**，落地时需要分别处理或先做统一：

### Car 页面
- `src/app/cars/[slug]/page.tsx:92-99` 通过 `<CarHeroStage>` 组件渲染。
- props：`imageUrl`、`imageAlt`、`imageCredit`、`color`、`dragLabel`、`championBadge`。
- 照片渲染逻辑封装在 `src/components/car-hero-stage.tsx` 内部。
- 相关 CSS：`.car-hero-photo`、`.car-hero-photo-credit`（`globals.css`）。
- **关键分支**（`car-hero-stage.tsx:35`）：`{...(imageUrl ? {} : dragHandlers)}`。
  - **有真实照片时**：渲染纯静态 `<img className="car-hero-photo">`，**不绑定任何 pointer 事件**——本故事要处理的就是这个分支。
  - **没有照片时**：回退到 `<HeroCarSvg>`（SVG 插画）+ 一个**伪 3D 拖动旋转**（CSS `perspective + rotateY`，`src/components/rotatable-stage.tsx`），显示 `dragLabel`（"3D ぐるぐる · 拖动旋转"）。这是占位体验，与本故事无关，但若改造时保留回退分支需注意不要破坏它。

### Person 页面
- `src/app/people/[slug]/page.tsx:104-122` 直接渲染原生 `<img className="person-photo">`，外加 `.person-photo-credit`。
- 没有经过任何包装组件。
- 当 `person.coverImage` 缺失时渲染 `.person-photo-slot` 占位卡（"拖入车手照片"）。

### 共同数据来源
- 两者都来自实体的 `coverImage`（由 `ContentRepository` 从 media registry 解析）。
- `coverImage` 已包含 `src`、`alt`、`credit` 三个字段，大图模式可直接复用。

## 功能需求

点击/轻触顶部照片后，展开为大图覆盖层（lightbox），让用户看清细节。

### 核心交互
- **触发**：点击/轻触照片本体（整张图作为 tap target，满足 44px 最小命中区域）。
- **展示**：照片以接近视口宽高（留少量边距）居中显示，背景半透明遮罩。
- **关闭**：
  - 点击遮罩空白处
  - `Esc` 键
  - 右上角 `✕` 按钮（44px tap target）
- **Credit**：大图模式下仍需显示 `coverImage.credit`（原页面已有，不能丢）。
- **Alt 文本**：作为大图的 `alt`，保证无障碍。

### 可选增强（建议在 PRD 评审时确认是否纳入）
- 双指捏合/双击缩放（移动端）。
- 大图加载时显示骨架/loading 占位（原图可能较大）。
- 支持 `prefers-reduced-motion` 时关闭进入/退出动画。

## 实现方向（仅给参考，不强制）

两种落地路径，由前端开发评审决定：

1. **抽共享组件**（推荐）：做一个 `<ExpandablePhoto>` 或 `<LightboxImage>` 客户端组件，两个页面都用。Car 页面把 `CarHeroStage` 内部的 `<img>` 替换；Person 页面把原生 `<img>` 替换。好处是行为一致、后续 `gallery` block 等也能复用。
2. **各自改造**：Car 改 `car-hero-stage.tsx`，Person 改 `people/[slug]/page.tsx`。改动局部，但会重复逻辑。

注意：Car 页面有真实照片时是**纯静态 `<img>`**，没有任何拖动行为——本故事的 lightbox 改造在这个分支下没有交互冲突。`CarHeroStage` 里那个伪 3D 拖动旋转（`useRotatableDrag`）只在**没有照片、用 SVG 占位**的回退分支才启用，与本故事正交，但改造时若动到组件结构，要保留占位分支的既有行为。

## 无障碍与质量门槛

- Lightbox 容器需 `role="dialog"` + `aria-modal="true"` + `aria-label`（如"查看大图"）。
- 打开时焦点移入对话框，关闭时焦点返回触发照片。
- 键盘可达：`Tab` 在对话框内循环、`Esc` 关闭、`Enter`/`Space` 在照片上触发。
- 遵循 `prefers-reduced-motion`。
- 不破坏既有 Lighthouse 移动端预算（见 `docs/performance/`）。

## 验收标准

- [ ] Car 和 Person 两个页面的顶部照片都可点击展开大图。
- [ ] 大图、小图都正确显示 `credit` 与 `alt`。
- [ ] 支持点击遮罩、`Esc`、`✕` 按钮三种关闭方式。
- [ ] 焦点管理正确（打开进入、关闭返回）。
- [ ] `prefers-reduced-motion` 下无强制动画。
- [ ] Car 页面有照片时是静态 `<img>`，改造后 lightbox 正常；无照片的 SVG 占位 + 伪 3D 拖动旋转回退分支不受影响。
- [ ] iOS Safari + Android Chrome 真机回归通过。
- [ ] `npm run ci` 全绿，无新增可访问性回归。

## 风险点

- **Car 页面的 `CarHeroStage` 是复合组件**：照片、冠军徽章、caption 分层叠加。改造时要确保 lightbox 触发只绑定到 `<img>` 本身（有 `imageUrl` 的分支），不要影响无照片回退分支里 `<HeroCarSvg>` + `useRotatableDrag` 的伪 3D 拖动占位体验。
- **原图尺寸**：media registry 里登记的可能是展示用压缩版，大图模式是否需要单独的高清变体？需与内容/媒体规范（`docs/ARCHITECTURE.md` 的 media contract）对齐。
- **移动端手势冲突**：若 lightbox 实现双指缩放，要避免与页面滚动冲突（Car 有照片分支本身无拖动冲突）。

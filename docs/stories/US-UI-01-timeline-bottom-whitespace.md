# US-UI-01 — 修复首页时间线底部空白区域

> **状态：已实现（方案 C），2026-07-21。** 改动见 `src/app/globals.css` 的 `.home` / `.timeline` / `.timeline-scroll`。`npm run lint/typecheck/validate/build` 通过；单测 3 项失败为 pre-existing（经 `git stash` 验证与本次改动无关）。

## 现象

在手机（移动端）访问首页时，时间线（Timeline）滚动区域下方出现大约 **1/6 ~ 1/7（约 14-15%）** 的空白区域，视觉上像是页面被截断。

## 根本原因

`src/app/globals.css:766` 的 `.timeline-scroll` 规则使用了固定的视口高度上限：

```css
.timeline-scroll {
  position: relative;
  max-height: 70vh;   /* ← 问题所在 */
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: 22px;
  background: var(--color-panel);
  border: 2px solid var(--color-border);
}
```

`max-height: 70vh` 意味着时间线滚动容器最多只占视口高度的 **70%**，剩余 **30%**（减去顶部 header 和 `app-shell` padding 后约 14-15%）就成了空白。

页面结构（`src/app/page.tsx`）：

```
div.app-shell (padding: 20px 16px 32px)
└── main.home
    ├── header.topbar              (~80-100px)
    └── <Timeline>
        └── div.timeline
            ├── <DecadeSelector>   (~40px)
            └── div.timeline-scroll  ← max-height: 70vh 限制了这里
```

## 候选方案对比

### 方案 A — `calc(100vh - 130px)`（补丁式）

```diff
 .timeline-scroll {
-  max-height: 70vh;
+  max-height: calc(100vh - 130px);
 }
```

- **优点**：一行改动，立即生效。
- **缺点**：`130px` 是魔法数字，topbar 高度或 padding 变化时需要同步调整；其他类似滚动页面（museum 等）无法复用。

### 方案 C — Flex 自动填充（架构式，推荐）

```diff
 .home {
-  display: grid;
-  gap: var(--space-5);
+  display: flex;
+  flex-direction: column;
+  gap: var(--space-5);
+  height: calc(100vh - var(--space-5) - var(--space-8));
 }

 .timeline {
-  display: grid;
-  gap: var(--space-3);
+  display: flex;
+  flex-direction: column;
+  flex: 1;
+  min-height: 0;
+  gap: var(--space-3);
 }

 .timeline-scroll {
-  max-height: 70vh;
+  flex: 1;
+  min-height: 0;
 }
```

- **优点**：自适应 topbar 高度变化；不依赖魔法数字；其他 "header + 滚动内容" 页面可复用同一模式。
- **缺点**：对 Flex 高度传递机制要求较高，需要真机回归测试。

## Effort 评估（方案 C）

| 工作 | 时间 |
|------|------|
| 改 CSS | 5 分钟 |
| `npm run test` 单测 | 1 分钟 |
| 桌面浏览器验证 | 5 分钟 |
| **真机/模拟器验证**（iOS Safari + Android Chrome） | 20-30 分钟 |
| 验证软键盘弹出场景 | 10 分钟 |

**总计约 45 分钟**，其中 75% 时间花在真机回归测试。

## 风险点（方案 C）

1. **高度链断裂**：Flex 自动填充要求整条父链都正确传递高度约束，任一环节断了会静默失败。
2. **`min-height: 0` 陷阱**：Flex 子项默认 `min-height: auto`，必须显式设 `min-height: 0` 否则 `flex: 1` 无效。
3. **iOS Safari 的 `100vh` 老问题**：地址栏伸缩时 `100vh` 会变。可选 `100dvh`（dynamic viewport height，iOS 15.4+）缓解。
4. **`calc(100vh - var(--space-5) - var(--space-8))`**：依赖 `--space-5`(20px) + `--space-8`(32px) = 52px，与 `app-shell` padding 保持一致。

## 测试影响

- `tests/unit/timeline.test.tsx` 和 `tests/unit/page.test.tsx` 都是**行为测试**（点击、滚动、焦点），**不依赖布局**。
- jsdom 不应用 CSS，flex/grid 切换对单测**完全透明**。
- **不需要新增/修改任何单元测试**。
- 主要验证依靠真机/模拟器视觉回归。

## 影响范围

通过 grep 确认：

- `.home` 类只在 `src/app/page.tsx` 使用一次。
- `.timeline` 类只在 `src/timeline/Timeline.tsx` 使用一次。
- museum、season、car 等其他页面用各自独立的类名，**不受影响**。

## 验收标准

- [ ] 在 iPhone（Safari）和 Android（Chrome）真机上，首页底部不再有空白。
- [ ] 时间线滚动行为正常，包括惯性滚动和 decade 跳转。
- [ ] 软键盘弹出/收起时不出现布局错乱。
- [ ] 横屏切换不出现布局错乱。
- [ ] `npm run ci` 全绿。
- [ ] `prefers-reduced-motion` 下行为正常。

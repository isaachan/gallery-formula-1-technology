import { getBuildDiagnostics } from "@/lib/diagnostics";
import { renderContentBlocks } from "@/blocks/block-registry";

const eras = [
  { key: "1950s", label: "'50s", active: false },
  { key: "1960s", label: "'60s", active: false },
  { key: "1970s", label: "'70s", active: false },
  { key: "1980s", label: "'80s", active: true },
  { key: "1990s", label: "'90s", active: false },
  { key: "2000s", label: "'00s", active: false },
  { key: "2010s", label: "'10s", active: false },
  { key: "2020s", label: "'20s", active: false },
];

const seasonHighlights = [
  {
    era: "1950s",
    year: "1950",
    title: "Silverstone 开端",
    subtitle: "Giuseppe Farina · Alfa Romeo 158",
    tags: ["前置引擎", "世界锦标赛起点"],
  },
  {
    era: "1980s",
    year: "1988",
    title: "涡轮巅峰样板",
    subtitle: "Ayrton Senna · McLaren MP4/4",
    tags: ["Honda RA168E", "低趴姿态"],
  },
  {
    era: "2020s",
    year: "2025",
    title: "地面效应新纪元",
    subtitle: "2026 新规前夜的技术分水岭",
    tags: ["混动数据", "规则迭代"],
  },
];

const blockRegistryPreview = [
  {
    id: "story-intro",
    type: "richText",
    heading: {
      zh: "有序内容块",
      en: "Ordered content blocks",
    },
    content: {
      zh: "注册表已经接管内容块顺序，页面模板不再按年份或实体名称写死分支。",
      en: "The registry now owns block ordering instead of page-specific branching.",
    },
  },
  {
    id: "story-hero-media",
    type: "image",
    heading: {
      zh: "媒体可替换",
      en: "Media can be replaced",
    },
  },
  {
    id: "story-3d-upgrade",
    type: "model3d",
    heading: {
      zh: "同一路由可升级到 3D",
      en: "The same route can upgrade to 3D",
    },
  },
];

const proseBlockPreview = [
  {
    id: "tech-overview",
    type: "richText",
    heading: {
      zh: "技术叙事",
      en: "Technical narrative",
    },
    content: {
      zh: "1988 年的 MP4/4 并不只是一台快车，它把低车身包装、可靠的涡轮输出和整车气动平衡组合成了一个几乎没有弱点的方案。\n\n在内容模型里，这段叙事只是一个可重排的 block，而不是页面模板里的特殊字段。",
      en: "The MP4/4 combined low-line packaging, reliable turbo output, and balanced aerodynamics.",
    },
    sourceIds: ["source-mclaren-archive", "source-f1-technical"],
  },
  {
    id: "tech-facts",
    type: "factGrid",
    heading: {
      zh: "结构事实",
      en: "Structured facts",
    },
    items: [
      {
        label: { zh: "赛季", en: "Season" },
        value: { zh: "1988", en: "1988" },
        accent: "highlight",
      },
      {
        label: { zh: "胜场", en: "Wins" },
        value: { zh: "16 站中的 15 站", en: "15 of 16 races" },
      },
      {
        label: { zh: "动力单元", en: "Power unit" },
        value: { zh: "Honda RA168E", en: "Honda RA168E" },
      },
    ],
    sourceIds: ["source-fia-season-review"],
  },
  {
    id: "tech-quote",
    type: "quote",
    heading: {
      zh: "编辑引用",
      en: "Editorial quote",
    },
    quote: {
      zh: "真正罕见的不是速度本身，而是速度、可靠性与可驾驭性同时落在了同一台车上。",
      en: "The rare part was speed, reliability, and drivability arriving together.",
    },
    attribution: {
      zh: "技术编辑注",
      en: "Technical editor note",
    },
    sourceIds: ["source-f1-technical"],
  },
];

function placeholderIllustration(label: string, color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${color}"/><text x="320" y="188" font-family="sans-serif" font-size="28" fill="#ffffff" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const mediaBlockPreview = [
  {
    id: "tech-primary-visual",
    type: "image",
    heading: {
      zh: "主视觉",
      en: "Primary visual",
    },
    layout: "full",
    media: {
      id: "media-ra168e-cutaway",
      alt: {
        zh: "Honda RA168E V6 涡轮引擎剖面示意图",
        en: "Cutaway illustration of the Honda RA168E V6 turbo engine",
      },
      src: placeholderIllustration("RA168E cutaway", "#5b7fd4"),
      caption: {
        zh: "原创示意图，用于说明引擎舱布局。",
        en: "Original illustration showing the engine bay layout.",
      },
      credit: "编辑部原创插画",
      focalPoint: { x: 0.5, y: 0.4 },
    },
    sourceIds: ["source-f1-technical"],
  },
  {
    id: "tech-gallery",
    type: "gallery",
    heading: {
      zh: "车辆图集",
      en: "Car gallery",
    },
    items: [
      {
        media: {
          id: "media-mp4-4-front",
          alt: {
            zh: "McLaren MP4/4 前 3/4 视角",
            en: "MP4/4 front three-quarter view",
          },
          src: placeholderIllustration("MP4/4 front", "#e0527e"),
          credit: "编辑部原创插画",
        },
      },
      {
        media: {
          id: "media-mp4-4-rear",
          alt: {
            zh: "McLaren MP4/4 尾翼与扩散器细节",
            en: "MP4/4 rear wing and diffuser detail",
          },
          src: placeholderIllustration("MP4/4 rear", "#c78a2d"),
          credit: "编辑部原创插画",
        },
      },
      {
        // Intentionally missing `media` to demonstrate per-item failure isolation.
      },
    ],
    sourceIds: ["source-mclaren-archive"],
  },
];

export default async function Home() {
  const diagnostics = await getBuildDiagnostics();

  return (
    <div className="app-shell">
      <main className="home">
        <section className="hero-panel" aria-labelledby="home-title">
          <header className="topbar">
            <div className="brand">
              <div className="brand-mark">
                GRAND PRIX <span>図鑑</span>
              </div>
              <p className="brand-subtitle">
                Formula 1 timeline museum
                <br />
                Chinese-first editorial prototype
              </p>
            </div>
            <a className="museum-button tap-target" href="#diagnostics">
              <span aria-hidden="true">🏛️</span>
              博物馆
            </a>
          </header>

          <nav className="chip-row" aria-label="Decades">
            {eras.map((era) => (
              <span
                key={era.key}
                className={`chip chip-${era.key} tap-target`}
                data-active={era.active}
              >
                {era.label}
              </span>
            ))}
          </nav>

          <p className="eyebrow">CHRONOLOGY FIRST</p>
          <h1 className="hero-title" id="home-title">
            F1 赛道年代记
          </h1>
          <p className="hero-copy">
            视觉系统已抽离为共享 token：颜色、年代色、圆角、阴影、间距和 motion
            参数集中定义，首页按 390px 手机基线组织，同时保留桌面扩展布局和
            reduced-motion 降级。
          </p>

          <div className="hero-road" aria-hidden="true">
            <div className="road-banner">
              <strong>1950 発車! START</strong>
              <span>银石 · 第一届世界锦标赛</span>
            </div>
            <div className="road-line" />
            <div className="road-car" />
          </div>
        </section>

        <section className="section-card" aria-labelledby="visual-status">
          <div className="section-head">
            <h2 className="section-title" id="visual-status">
              当前故事
            </h2>
            <span className="story-badge">US-A03</span>
          </div>
          <p className="section-text">
            本阶段交付共享视觉系统，而不是只给单页涂样式。核心 token
            已经集中到全局样式层，控制卡片、chip、按钮、投影、年代语义色和
            reduced-motion 行为，后续时间轴、详情页和博物馆都可以直接复用。
          </p>
          <a className="cta tap-target" href="#diagnostics">
            查看部署诊断
            <span aria-hidden="true">▸</span>
          </a>
        </section>

        <section className="section-card" aria-labelledby="block-registry">
          <div className="section-head">
            <h2 className="section-title" id="block-registry">
              块注册预览
            </h2>
            <span className="story-badge">US-B02.1</span>
          </div>
          <p className="section-text">
            内容块通过稳定 block ID 和显式 type 进入注册表。顺序由内容本身决定，
            预览层对未知类型做安全降级，避免开发环境直接崩溃。
          </p>
          <div className="block-preview-stack">
            {renderContentBlocks(blockRegistryPreview)}
          </div>
        </section>

        <section className="section-card" aria-labelledby="season-preview">
          <div className="section-head">
            <h2 className="section-title" id="season-preview">
              叙事块预览
            </h2>
            <span className="story-badge">US-B02.2</span>
          </div>
          <p className="section-text">
            `richText`、`factGrid` 和 `quote` 已替换为真实语义渲染，并在块级保留
            source reference 与运行时安全降级。
          </p>
          <div className="block-preview-stack">
            {renderContentBlocks(proseBlockPreview)}
          </div>
        </section>

        <section className="section-card" aria-labelledby="media-preview">
          <div className="section-head">
            <h2 className="section-title" id="media-preview">
              媒体块预览
            </h2>
            <span className="story-badge">US-B02.3</span>
          </div>
          <p className="section-text">
            `image` 和 `gallery`
            已替换为响应式渲染：预留尺寸、焦点裁剪、说明与来源、
            以及单个素材失败时的隔离降级，图集中的第三项故意缺失媒体引用以展示该行为。
          </p>
          <div className="block-preview-stack">
            {renderContentBlocks(mediaBlockPreview)}
          </div>
        </section>

        <section className="section-card" aria-labelledby="season-cards">
          <div className="section-head">
            <h2 className="section-title" id="season-cards">
              赛季卡片样式
            </h2>
          </div>
          <div className="season-grid">
            {seasonHighlights.map((season) => (
              <article
                key={season.year}
                className="season-card"
                data-era={season.era}
              >
                <div className="season-year">{season.year}</div>
                <h3 className="season-title">{season.title}</h3>
                <p className="season-subtitle">{season.subtitle}</p>
                <div className="tag-row">
                  {season.tags.map((tag, index) => (
                    <span
                      key={tag}
                      className={`tag ${index === 0 ? "tag-yellow" : "tag-green"}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="section-card"
          aria-labelledby="diagnostics"
          id="diagnostics"
        >
          <div className="section-head">
            <h2 className="section-title" id="diagnostics">
              部署诊断
            </h2>
            <span className="story-badge">US-A02</span>
          </div>
          <div className="info-grid">
            <article className="info-card">
              <p className="info-label">应用版本</p>
              <p className="info-value">{diagnostics.appVersion}</p>
            </article>
            <article className="info-card">
              <p className="info-label">内容版本</p>
              <p className="info-value">{diagnostics.contentVersion}</p>
            </article>
            <article className="info-card">
              <p className="info-label">构建提交</p>
              <p className="info-value">{diagnostics.gitSha}</p>
            </article>
            <article className="info-card">
              <p className="info-label">接口地址</p>
              <p className="info-value">/api/diagnostics</p>
            </article>
          </div>
        </section>

        <section className="section-card" aria-labelledby="command-surface">
          <div className="section-head">
            <h2 className="section-title" id="command-surface">
              开发命令
            </h2>
          </div>
          <div className="command-row">
            <span className="command-pill">npm run dev</span>
            <span className="command-pill">npm run lint</span>
            <span className="command-pill">npm run typecheck</span>
            <span className="command-pill">npm run test</span>
            <span className="command-pill">npm run validate:content</span>
          </div>
        </section>
      </main>
    </div>
  );
}

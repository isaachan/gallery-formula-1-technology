import { getBuildDiagnostics } from "@/lib/diagnostics";
import { renderContentBlocks } from "@/blocks/block-registry";
import { Timeline, type TimelineSeason } from "@/timeline/Timeline";

// The prototype-approved highlighted-season list (design/F1 赛道年代记.dc.html);
// normative per US-C01.6 until an approved design change updates it.
const HIGHLIGHTED_YEARS = new Set([
  1950, 1957, 1959, 1968, 1976, 1978, 1988, 1992, 1994, 2004, 2009, 2014, 2021,
  2025,
]);

function buildDemoTimelineSeasons(): TimelineSeason[] {
  const seasons: TimelineSeason[] = [];
  for (let year = 1950; year <= 2025; year++) {
    const highlighted = HIGHLIGHTED_YEARS.has(year);
    seasons.push({
      id: `demo-season-${year}`,
      year,
      highlighted,
      // Placeholder demo text only — real season content is authored
      // through the researched content pipeline (docs/DEVELOPMENT_PLAN.md
      // Epic G), not fabricated here.
      title: `${year} 赛季（示例数据）`,
      championName: "示例车手",
      championCar: "示例赛车",
      tag: highlighted ? "示例技术" : undefined,
      badge: highlighted ? "示例年份" : undefined,
    });
  }
  return seasons;
}

const demoTimelineSeasons = buildDemoTimelineSeasons();

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

const relatedEntitiesBlockPreview = [
  {
    id: "tech-related",
    type: "relatedEntities",
    heading: {
      zh: "相关内容",
      en: "Related entities",
    },
    items: [
      {
        entityId: "person-ayrton-senna",
        entity: {
          id: "person-ayrton-senna",
          entityType: "person",
          title: { zh: "塞纳", en: "Ayrton Senna" },
          subtitle: {
            zh: "McLaren · 1988 冠军",
            en: "McLaren · 1988 champion",
          },
          href: "/people/ayrton-senna",
        },
      },
      {
        entityId: "car-mp4-4",
        entity: {
          id: "car-mp4-4",
          entityType: "car",
          title: { zh: "McLaren MP4/4", en: "McLaren MP4/4" },
          subtitle: { zh: "1988 赛季冠军赛车", en: "1988 championship car" },
          href: "/cars/mclaren-mp4-4",
        },
      },
      {
        // Intentionally references an id the graph cannot currently resolve.
        entityId: "team-decommissioned-placeholder",
      },
    ],
    sourceIds: ["source-mclaren-archive"],
  },
];

const diagramAnimationBlockPreview = [
  {
    id: "tech-diagram",
    type: "diagram",
    heading: {
      zh: "增压路径示意图",
      en: "Boost path diagram",
    },
    media: {
      id: "media-ra168e-diagram",
      alt: {
        zh: "RA168E 涡轮增压气流路径示意图",
        en: "Diagram of the RA168E turbo boost airflow path",
      },
      src: placeholderIllustration("Boost path diagram", "#3d9c7b"),
      caption: {
        zh: "原创示意图，标注了进气、增压和中冷路径。",
        en: "Original diagram labeling the intake, boost, and intercooler path.",
      },
      credit: "编辑部原创插画",
    },
    explanation: {
      zh: "空气经涡轮增压后温度上升，中冷器在气流进入气缸前将其冷却，从而提高进气密度和输出功率。",
      en: "Boosted air heats up under compression; the intercooler cools it before it reaches the cylinders, raising intake density and output.",
    },
    sourceIds: ["source-f1-technical"],
  },
  {
    id: "tech-animation",
    type: "animation",
    heading: {
      zh: "涡轮增压动画",
      en: "Turbo boost animation",
    },
    media: {
      id: "media-ra168e-animation",
      alt: {
        zh: "RA168E 涡轮增压气流循环动画",
        en: "Looping animation of the RA168E turbo boost airflow",
      },
      videoSrc: "/demo/turbo-loop.mp4",
      posterSrc: "/demo/turbo-poster.jpg",
      credit: "编辑部原创动画",
    },
    explanation: {
      zh: "动画展示了废气驱动涡轮旋转、压缩进气并循环增压的过程，可随时暂停查看任一帧。",
      en: "The animation shows exhaust gas spinning the turbine and compressing intake air; it can be paused at any frame.",
    },
    sourceIds: ["source-f1-technical"],
  },
];

const audioVideoBlockPreview = [
  {
    id: "tech-onboard-video",
    type: "video",
    heading: {
      zh: "车载视角片段",
      en: "Onboard reference clip",
    },
    media: {
      id: "media-onboard-clip",
      alt: {
        zh: "1988 摩纳哥站车载视角参考片段",
        en: "1988 Monaco onboard reference clip",
      },
      videoSrc: "/demo/onboard-clip.mp4",
      posterSrc: "/demo/onboard-poster.jpg",
      credit: "编辑部原创片段",
    },
    transcript: {
      zh: "画面展示了驾驶员视角下通过隧道路段的过程，未包含对白，仅有引擎与胎噪。播放需要用户主动点击。",
      en: "Driver's-eye view through the tunnel section; no dialogue, only engine and tire noise. Playback requires an explicit tap.",
    },
    sourceIds: ["source-mclaren-archive"],
  },
  {
    id: "tech-engine-audio",
    type: "audio",
    heading: {
      zh: "引擎音效",
      en: "Engine audio",
    },
    media: {
      id: "media-engine-audio",
      alt: {
        zh: "Honda RA168E 怠速与加速音效",
        en: "Honda RA168E idle-to-acceleration audio",
      },
      src: "/demo/engine-audio.mp3",
      credit: "编辑部原创录音",
    },
    transcript: {
      zh: "非语音音频描述：引擎从低沉怠速逐渐提升到高转速嘶吼的音调变化过程。",
      en: "Non-speech description: the engine tone rises from a low idle to a high-revving pitch.",
    },
    sourceIds: ["source-f1-technical"],
  },
];

const model3dBlockPreview = [
  {
    id: "tech-engine-model",
    type: "model3d",
    heading: {
      zh: "引擎三维模型",
      en: "Engine 3D model",
    },
    media: {
      id: "media-ra168e-model",
      alt: {
        zh: "Honda RA168E 引擎与涡轮增压器三维模型",
        en: "3D model of the Honda RA168E engine and turbocharger",
      },
      modelSrc: "/demo/ra168e-model.glb",
      posterSrc: "/demo/ra168e-model-poster.jpg",
      credit: "编辑部原创建模",
    },
    description: {
      zh: "模型展示了发动机缸体与涡轮增压器的相对位置。查看需要点击加载，可用触摸、指针或方向键旋转视角；无 WebGL 的设备会看到静态预览图与本段说明。",
      en: "The model shows the engine block and turbocharger's relative position. Viewing requires a tap to load, and can be rotated with touch, pointer, or arrow keys; devices without WebGL see the static preview and this description.",
    },
    initialCamera: "three-quarter",
    interaction: "turntable",
    sourceIds: ["source-f1-technical"],
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const diagnostics = await getBuildDiagnostics();
  const { year: yearParam } = await searchParams;
  const parsedFocusYear = yearParam ? Number.parseInt(yearParam, 10) : NaN;
  const initialFocusYear = Number.isInteger(parsedFocusYear)
    ? parsedFocusYear
    : undefined;

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

        <section className="section-card" aria-labelledby="related-preview">
          <div className="section-head">
            <h2 className="section-title" id="related-preview">
              关联块预览
            </h2>
            <span className="story-badge">US-B02.4</span>
          </div>
          <p className="section-text">
            `relatedEntities`
            通过图谱关系解析生成规范路由链接，而不是页面内特殊拼接；
            第三项引用了一个当前无法解析的 ID，用于展示单条断链的隔离降级。
          </p>
          <div className="block-preview-stack">
            {renderContentBlocks(relatedEntitiesBlockPreview)}
          </div>
        </section>

        <section className="section-card" aria-labelledby="diagram-preview">
          <div className="section-head">
            <h2 className="section-title" id="diagram-preview">
              图示与动画块预览
            </h2>
            <span className="story-badge">US-B02.5</span>
          </div>
          <p className="section-text">
            `diagram` 始终附带可读的文字说明；`animation`
            默认在系统未开启减少动态效果时自动循环播放，提供暂停控制，并始终展示海报静态帧与等效文字说明。
          </p>
          <div className="block-preview-stack">
            {renderContentBlocks(diagramAnimationBlockPreview)}
          </div>
        </section>

        <section className="section-card" aria-labelledby="audio-video-preview">
          <div className="section-head">
            <h2 className="section-title" id="audio-video-preview">
              音频与视频块预览
            </h2>
            <span className="story-badge">US-B02.6</span>
          </div>
          <p className="section-text">
            `video` 使用原生播放控件，`audio` 使用显式播放/暂停/停止与时长控件，
            两者都绝不自动播放——播放需要学习者主动点击；
            两者都要求署名与文字转录/等效描述，加载失败时展示安全降级提示，
            切换到其他赛季时会自动停止播放。
          </p>
          <div className="block-preview-stack">
            {renderContentBlocks(audioVideoBlockPreview)}
          </div>
        </section>

        <section className="section-card" aria-labelledby="model3d-preview">
          <div className="section-head">
            <h2 className="section-title" id="model3d-preview">
              3D 模型块预览
            </h2>
            <span className="story-badge">US-B02.7</span>
          </div>
          <p className="section-text">
            `model3d` 懒加载查看器仅在点击后下载模型，离屏时暂停渲染，
            并在不支持 WebGL 或渲染失败时回退到静态预览图与文字说明。
          </p>
          <div className="block-preview-stack">
            {renderContentBlocks(model3dBlockPreview)}
          </div>
        </section>

        <section className="section-card" aria-labelledby="timeline-preview">
          <div className="section-head">
            <h2 className="section-title" id="timeline-preview">
              时间轴赛道预览
            </h2>
            <span className="story-badge">US-C01</span>
          </div>
          <p className="section-text">
            赛道几何、年代横幅、行驶小车和年代导航均按原型的精确数值实现； 以下
            76 个示例赛季为占位演示数据，真实赛季内容将通过研究流程接入。
          </p>
          <Timeline
            seasons={demoTimelineSeasons}
            initialFocusYear={initialFocusYear}
          />
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

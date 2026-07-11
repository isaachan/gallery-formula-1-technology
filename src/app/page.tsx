import { getBuildDiagnostics } from "@/lib/diagnostics";

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

        <section className="section-card" aria-labelledby="season-preview">
          <div className="section-head">
            <h2 className="section-title" id="season-preview">
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

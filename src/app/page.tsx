import { getBuildDiagnostics } from "@/lib/diagnostics";

export default async function Home() {
  const diagnostics = await getBuildDiagnostics();

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">GRAND PRIX 図鑑</p>
        <h1>F1 赛道年代记</h1>
        <p className="lede">
          生产环境基础已经就绪。下一步将按开发计划，从内容模型、赛季路线和博物馆体验逐步落地。
        </p>
      </section>
      <section className="panel" aria-labelledby="story-status">
        <div className="panel-head">
          <h2 id="story-status">当前故事</h2>
          <span className="badge">US-A01</span>
        </div>
        <p>
          本阶段完成本地开发环境、独立质量命令、内容校验入口和示例环境变量，确保后续故事可以在可部署的基础上迭代。
        </p>
      </section>
      <section className="panel" aria-labelledby="developer-commands">
        <div className="panel-head">
          <h2 id="developer-commands">常用命令</h2>
        </div>
        <ul className="command-list">
          <li>
            <code>npm run dev</code>
          </li>
          <li>
            <code>npm run lint</code>
          </li>
          <li>
            <code>npm run typecheck</code>
          </li>
          <li>
            <code>npm run test</code>
          </li>
          <li>
            <code>npm run validate:content</code>
          </li>
        </ul>
      </section>
      <section className="panel" aria-labelledby="deployment-status">
        <div className="panel-head">
          <h2 id="deployment-status">部署诊断</h2>
          <span className="badge">US-A02</span>
        </div>
        <dl className="meta-list">
          <div>
            <dt>应用版本</dt>
            <dd>{diagnostics.appVersion}</dd>
          </div>
          <div>
            <dt>内容版本</dt>
            <dd>{diagnostics.contentVersion}</dd>
          </div>
          <div>
            <dt>构建提交</dt>
            <dd>{diagnostics.gitSha}</dd>
          </div>
          <div>
            <dt>接口地址</dt>
            <dd>
              <code>/api/diagnostics</code>
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

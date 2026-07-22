import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const PORT = 3102;
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
// Only pin a Chrome path when explicitly provided (e.g. local macOS dev). When
// unset, pass nothing so chrome-launcher auto-detects the runner's Chrome
// (e.g. /usr/bin/google-chrome on GitHub's ubuntu-latest runners).
const CHROME_PATH = process.env.CHROME_PATH || undefined;
const OUTPUT_DIRECTORY = path.join(process.cwd(), "docs/performance");
const JSON_OUTPUT_PATH = path.join(
  OUTPUT_DIRECTORY,
  "us-h02-route-family-performance.json",
);
const MARKDOWN_OUTPUT_PATH = path.join(
  OUTPUT_DIRECTORY,
  "us-h02-route-family-performance.md",
);
const ROUTES = [
  { label: "timeline-home", path: "/" },
  { label: "season-detail", path: "/seasons/1988" },
  { label: "museum", path: "/museum" },
  { label: "car-detail", path: "/cars/mclaren-mp4-4" },
  { label: "person-detail", path: "/people/ayrton-senna" },
  { label: "technology-detail", path: "/technologies/honda-ra168e" },
];
const RUNS_PER_ROUTE = 2;
const BUDGETS = {
  lcpMs: 2500,
  inpMs: 200,
  cls: 0.1,
  scriptBytes: 200 * 1024,
  imageBytes: 500 * 1024,
};

function spawnServer() {
  return spawn(
    "npm",
    ["run", "start", "--", "--hostname", HOST, "--port", String(PORT)],
    {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    },
  );
}

async function waitForServer(url, attempts = 60) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.ok || response.status === 307 || response.status === 308) {
        return;
      }
    } catch {
      // Retry until the server starts accepting requests.
    }

    await delay(1000);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function terminateProcess(child) {
  if (!child || child.killed) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    child.once("exit", () => resolve());
    child.kill("SIGTERM");

    setTimeout(() => {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }, 5000).unref();
  });
}

function readAuditValue(result, auditId) {
  return result.lhr.audits[auditId]?.numericValue ?? null;
}

function readResourceBytes(result, resourceType) {
  const items = result.lhr.audits["resource-summary"]?.details?.items ?? [];
  const match = items.find((item) => item.resourceType === resourceType);
  return match?.transferSize ?? 0;
}

function buildBudgetResult(actual, budget) {
  if (actual === null) {
    return {
      actual,
      budget,
      passed: false,
      note: "Metric unavailable in this Lighthouse run",
    };
  }

  return {
    actual,
    budget,
    passed: actual <= budget,
    note: null,
  };
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted[midpoint];
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatMs(value) {
  return `${value.toFixed(0)} ms`;
}

function formatRatio(value) {
  return value.toFixed(3);
}

async function runAudit(chrome, routePath) {
  const result = await lighthouse(`${BASE_URL}${routePath}`, {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    onlyCategories: ["performance"],
    emulatedFormFactor: "mobile",
    throttlingMethod: "simulate",
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      disabled: false,
    },
    chromeFlags: ["--headless=new", "--disable-gpu"],
  });

  return {
    lcp: readAuditValue(result, "largest-contentful-paint"),
    inp: readAuditValue(result, "interaction-to-next-paint"),
    tbt: readAuditValue(result, "total-blocking-time"),
    cls: readAuditValue(result, "cumulative-layout-shift"),
    scriptBytes: readResourceBytes(result, "script"),
    imageBytes: readResourceBytes(result, "image"),
  };
}

function summarizeRoute(route, samples) {
  const lcp = median(samples.map((sample) => sample.lcp));
  const cls = median(samples.map((sample) => sample.cls));
  const scriptBytes = median(samples.map((sample) => sample.scriptBytes));
  const imageBytes = median(samples.map((sample) => sample.imageBytes));
  const inpSamples = samples
    .map((sample) => sample.inp)
    .filter((value) => value !== null);
  const tbt = median(samples.map((sample) => sample.tbt));
  const inpUsedProxy = inpSamples.length === 0;
  const inp = inpUsedProxy ? tbt : median(inpSamples);

  const budgets = {
    lcp: buildBudgetResult(lcp, BUDGETS.lcpMs),
    inp: {
      ...buildBudgetResult(inp, BUDGETS.inpMs),
      note: inpUsedProxy
        ? "Used Total Blocking Time as a lab proxy because Lighthouse did not emit INP"
        : null,
    },
    cls: buildBudgetResult(cls, BUDGETS.cls),
    scriptBytes: buildBudgetResult(scriptBytes, BUDGETS.scriptBytes),
    imageBytes: buildBudgetResult(imageBytes, BUDGETS.imageBytes),
  };

  return {
    ...route,
    samples,
    budgets,
    passed: Object.values(budgets).every((budget) => budget.passed),
  };
}

function markdownForSummary(summary) {
  const rows = summary.routes
    .map((route) => {
      const inpValue = formatMs(route.budgets.inp.actual);
      const inpLabel = route.budgets.inp.note
        ? `${inpValue} (TBT proxy)`
        : inpValue;

      return `| ${route.label} | \`${route.path}\` | ${formatMs(route.budgets.lcp.actual)} | ${inpLabel} | ${formatRatio(route.budgets.cls.actual)} | ${formatBytes(route.budgets.scriptBytes.actual)} | ${formatBytes(route.budgets.imageBytes.actual)} | ${route.passed ? "Pass" : "Fail"} |`;
    })
    .join("\n");

  const exceptions = summary.exceptions.length
    ? summary.exceptions.map((entry) => `- ${entry}`).join("\n")
    : "- None";

  return `# US-H02 Route Family Performance Audit

- Date: ${summary.date}
- Execution profile: local production build served by \`next start\`, Lighthouse mobile emulation at 390px width
- Samples per route: ${RUNS_PER_ROUTE}
- Budgets: LCP <= ${formatMs(BUDGETS.lcpMs)}, INP <= ${formatMs(BUDGETS.inpMs)}, CLS <= ${formatRatio(BUDGETS.cls)}, initial route script <= ${formatBytes(BUDGETS.scriptBytes)}, initial image bytes <= ${formatBytes(BUDGETS.imageBytes)}

| Route Family | Path | LCP | INP | CLS | Script Bytes | Image Bytes | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Notes

- This audit measures representative route families instead of every single published entity route.
- Subject-page coverage uses the real 1988 reference content for car, person, and technology pages.
- Each route is sampled ${RUNS_PER_ROUTE} times and the median is compared against the PRD mobile budgets.
- When Lighthouse does not emit INP, the script falls back to Total Blocking Time and records that explicitly.

## Exceptions / Technical Debt

${exceptions}
`;
}

async function main() {
  await fs.mkdir(OUTPUT_DIRECTORY, { recursive: true });

  const server = spawnServer();
  let chrome;

  try {
    await waitForServer(BASE_URL);

    chrome = await launch({
      ...(CHROME_PATH ? { chromePath: CHROME_PATH } : {}),
      chromeFlags: ["--headless=new", "--disable-gpu", "--no-sandbox"],
    });

    const summarizedRoutes = [];
    for (const route of ROUTES) {
      const samples = [];
      for (let runIndex = 0; runIndex < RUNS_PER_ROUTE; runIndex += 1) {
        samples.push(await runAudit(chrome, route.path));
      }
      summarizedRoutes.push(summarizeRoute(route, samples));
    }

    const exceptions = summarizedRoutes
      .filter((route) => !route.passed)
      .map(
        (route) =>
          `${route.label} (${route.path}) exceeded one or more budgets`,
      );

    const summary = {
      date: new Date().toISOString(),
      routes: summarizedRoutes,
      exceptions,
    };

    await fs.writeFile(
      JSON_OUTPUT_PATH,
      `${JSON.stringify(summary, null, 2)}\n`,
    );
    await fs.writeFile(MARKDOWN_OUTPUT_PATH, markdownForSummary(summary));

    // Always echo the per-route budget table to stdout so a CI failure shows
    // *which* route and *which* metric exceeded, without having to download the
    // report artifact. Format: label path metric=actual/budget PASS|FAIL.
    console.log("Route-family performance budgets:");
    for (const route of summarizedRoutes) {
      const fields = [
        ["lcp", route.budgets.lcp, formatMs],
        ["inp", route.budgets.inp, formatMs],
        ["cls", route.budgets.cls, formatRatio],
        ["script", route.budgets.scriptBytes, formatBytes],
        ["image", route.budgets.imageBytes, formatBytes],
      ];
      const parts = fields.map(([name, budget, fmt]) => {
        const actual = budget.actual;
        const flag =
          actual === null ? "?" : actual <= budget.budget ? "ok" : "OVER";
        return `${name}=${actual === null ? "n/a" : fmt(actual)}/${fmt(budget.budget)}${flag}`;
      });
      console.log(
        `  ${route.label.padEnd(18)} ${route.path.padEnd(24)} ${parts.join("  ")}  ${route.passed ? "PASS" : "FAIL"}`,
      );
    }

    if (exceptions.length > 0) {
      throw new Error(
        `US-H02 performance budgets failed for ${exceptions.length} route family(s).`,
      );
    }
  } finally {
    if (chrome) {
      try {
        await chrome.kill();
      } catch {
        // Best-effort cleanup only.
      }
    }

    await Promise.all([terminateProcess(server)]);
  }
}

await main();

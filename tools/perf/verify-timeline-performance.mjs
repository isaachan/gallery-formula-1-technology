import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const PORT = 3101;
const HOST = "127.0.0.1";
const ROUTE = "/";
const BASE_URL = `http://${HOST}:${PORT}`;
const CHROME_PATH =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const VIEWPORT_WIDTHS = [320, 390, 430];
const RUNS_PER_WIDTH = 3;
const OUTPUT_DIRECTORY = path.join(process.cwd(), "docs/performance");
const JSON_OUTPUT_PATH = path.join(
  OUTPUT_DIRECTORY,
  "us-c01-8-mobile-timeline.json",
);
const MARKDOWN_OUTPUT_PATH = path.join(
  OUTPUT_DIRECTORY,
  "us-c01-8-mobile-timeline.md",
);

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

function formatActual(metric, value) {
  if (value === null) {
    return "unavailable";
  }

  if (metric === "cls") {
    return formatRatio(value);
  }

  if (metric.endsWith("Bytes")) {
    return formatBytes(value);
  }

  return formatMs(value);
}

function markdownForSummary(summary) {
  const rows = summary.runs
    .map((run) => {
      const inpValue = formatMs(run.budgets.inp.actual);
      const inpLabel = run.budgets.inp.note
        ? `${inpValue} (TBT proxy)`
        : inpValue;

      return `| ${run.width}px | ${formatMs(run.budgets.lcp.actual)} | ${inpLabel} | ${formatRatio(run.budgets.cls.actual)} | ${formatBytes(run.budgets.scriptBytes.actual)} | ${formatBytes(run.budgets.imageBytes.actual)} | ${run.passed ? "Pass" : "Fail"} |`;
    })
    .join("\n");

  const exceptions = summary.exceptions.length
    ? summary.exceptions.map((entry) => `- ${entry}`).join("\n")
    : "- None";

  return `# US-C01.8 Mobile Timeline Performance Audit

- Date: ${summary.date}
- Route: \`${summary.route}\`
- Execution profile: local production build served by \`next start\`, audited with Lighthouse mobile emulation against widths 320px, 390px, and 430px
- Budgets: LCP <= ${formatMs(BUDGETS.lcpMs)}, INP <= ${formatMs(BUDGETS.inpMs)}, CLS <= ${formatRatio(BUDGETS.cls)}, initial route script <= ${formatBytes(BUDGETS.scriptBytes)}, initial image bytes <= ${formatBytes(BUDGETS.imageBytes)}

| Width | LCP | INP | CLS | Script Bytes | Image Bytes | Result |
| --- | --- | --- | --- | --- | --- | --- |
${rows}

## Notes

- The audit covers the current 76-season demo timeline shell at the required mobile widths. Epic G will replace the demo season labels with researched repository content later without changing the timeline geometry or interaction model.
- Lighthouse lab metrics are the repo's current agreed approximation for the PRD's mobile performance gate before production field telemetry exists.
- Each width is sampled ${RUNS_PER_WIDTH} times and budget checks use the median result to reduce single-run jitter.
- When Lighthouse does not emit an INP value for a run, the script falls back to Total Blocking Time as the conservative lab proxy and marks that explicitly in the report.

## Exceptions / Technical Debt

${exceptions}
`;
}

async function runAudit(chrome, width) {
  const result = await lighthouse(`${BASE_URL}${ROUTE}`, {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    onlyCategories: ["performance"],
    emulatedFormFactor: "mobile",
    throttlingMethod: "simulate",
    screenEmulation: {
      mobile: true,
      width,
      height: 844,
      deviceScaleFactor: 3,
      disabled: false,
    },
    chromeFlags: ["--headless=new", "--disable-gpu"],
  });

  const budgets = {
    lcp: readAuditValue(result, "largest-contentful-paint"),
    inp: readAuditValue(result, "interaction-to-next-paint"),
    tbt: readAuditValue(result, "total-blocking-time"),
    cls: readAuditValue(result, "cumulative-layout-shift"),
    scriptBytes: readResourceBytes(result, "script"),
    imageBytes: readResourceBytes(result, "image"),
  };

  return budgets;
}

function summarizeRunSamples(width, samples) {
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
    width,
    samples,
    budgets,
    passed: Object.values(budgets).every((budget) => budget.passed),
  };
}

async function main() {
  await fs.mkdir(OUTPUT_DIRECTORY, { recursive: true });

  const server = spawnServer();
  let chrome;

  try {
    await waitForServer(BASE_URL);

    chrome = await launch({
      chromePath: CHROME_PATH,
      chromeFlags: ["--headless=new", "--disable-gpu", "--no-first-run"],
    });

    const runs = [];
    for (const width of VIEWPORT_WIDTHS) {
      const samples = [];
      for (
        let sampleIndex = 0;
        sampleIndex < RUNS_PER_WIDTH;
        sampleIndex += 1
      ) {
        samples.push(await runAudit(chrome, width));
      }
      runs.push(summarizeRunSamples(width, samples));
    }

    const exceptions = [];
    for (const run of runs) {
      for (const [metric, budget] of Object.entries(run.budgets)) {
        if (!budget.passed) {
          exceptions.push(
            `${run.width}px ${metric} exceeded budget: actual ${formatActual(metric, budget.actual)}, budget ${formatActual(metric, budget.budget)}.`,
          );
        }
      }
    }

    const summary = {
      date: new Date().toISOString(),
      route: ROUTE,
      runs,
      exceptions,
    };

    await fs.writeFile(JSON_OUTPUT_PATH, JSON.stringify(summary, null, 2));
    await fs.writeFile(MARKDOWN_OUTPUT_PATH, markdownForSummary(summary));

    if (exceptions.length > 0) {
      throw new Error(
        `Timeline performance audit found ${exceptions.length} exception(s). See ${MARKDOWN_OUTPUT_PATH}.`,
      );
    }

    console.log(
      `Timeline performance audit passed. Report: ${MARKDOWN_OUTPUT_PATH}`,
    );
  } finally {
    await terminateProcess(server);
    if (chrome) {
      await chrome.kill();
    }
  }
}

await main();

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
const APPROVED_EXCEPTIONS_PATH = path.join(
  OUTPUT_DIRECTORY,
  "us-h02-approved-exceptions.json",
);
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
const METRIC_KEYS = ["lcp", "inp", "cls", "scriptBytes", "imageBytes"];

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
  if (
    !child ||
    child.killed ||
    child.exitCode !== null ||
    child.signalCode !== null
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    let forceKillTimer;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      child.off("exit", onExit);
      if (forceKillTimer) {
        clearTimeout(forceKillTimer);
      }
      resolve();
    };
    const onExit = () => finish();
    child.once("exit", onExit);

    if (child.exitCode !== null || child.signalCode !== null) {
      finish();
      return;
    }

    forceKillTimer = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGKILL");
      }
      finish();
    }, 5000).unref();

    child.kill("SIGTERM");
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

function formatMetric(metric, value) {
  if (value === null) {
    return "n/a";
  }

  if (metric === "cls") {
    return formatRatio(value);
  }

  if (metric.endsWith("Bytes")) {
    return formatBytes(value);
  }

  return formatMs(value);
}

function exceptionKey(routeLabel, routePath, metric) {
  return `${routeLabel}|${routePath}|${metric}`;
}

async function loadApprovedExceptions() {
  try {
    const file = await fs.readFile(APPROVED_EXCEPTIONS_PATH, "utf8");
    const parsed = JSON.parse(file);
    const exceptions = parsed?.exceptions;

    if (!Array.isArray(exceptions)) {
      throw new Error("`exceptions` must be an array.");
    }

    const map = new Map();
    for (const entry of exceptions) {
      if (!entry || typeof entry !== "object") {
        throw new Error("Each exception entry must be an object.");
      }

      const {
        routeLabel,
        path: routePath,
        metric,
        maxActual,
        owner,
        severity,
        targetRelease,
        justification,
      } = entry;

      if (typeof routeLabel !== "string" || routeLabel.length === 0) {
        throw new Error("Exception `routeLabel` must be a non-empty string.");
      }
      if (typeof routePath !== "string" || routePath.length === 0) {
        throw new Error("Exception `path` must be a non-empty string.");
      }
      if (!METRIC_KEYS.includes(metric)) {
        throw new Error(`Exception metric "${metric}" is not supported.`);
      }
      if (typeof maxActual !== "number" || Number.isNaN(maxActual)) {
        throw new Error("Exception `maxActual` must be a number.");
      }
      if (typeof owner !== "string" || owner.length === 0) {
        throw new Error("Exception `owner` must be a non-empty string.");
      }
      if (typeof severity !== "string" || severity.length === 0) {
        throw new Error("Exception `severity` must be a non-empty string.");
      }
      if (typeof targetRelease !== "string" || targetRelease.length === 0) {
        throw new Error(
          "Exception `targetRelease` must be a non-empty string.",
        );
      }
      if (
        typeof justification !== "string" ||
        justification.trim().length === 0
      ) {
        throw new Error(
          "Exception `justification` must be a non-empty string.",
        );
      }

      const key = exceptionKey(routeLabel, routePath, metric);
      if (map.has(key)) {
        throw new Error(
          `Duplicate exception for ${routeLabel} ${routePath} ${metric}.`,
        );
      }

      map.set(key, {
        routeLabel,
        routePath,
        metric,
        maxActual,
        owner,
        severity,
        targetRelease,
        justification,
      });
    }

    return map;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return new Map();
    }

    throw new Error(
      `Failed to parse ${APPROVED_EXCEPTIONS_PATH}: ${error.message}`,
    );
  }
}

function applyApprovedException(route, metric, budget, approvedExceptions) {
  if (budget.passed || budget.actual === null) {
    return {
      ...budget,
      gatePassed: budget.passed,
      waived: false,
      approvedException: null,
    };
  }

  const approvedException = approvedExceptions.get(
    exceptionKey(route.label, route.path, metric),
  );
  if (!approvedException) {
    return {
      ...budget,
      gatePassed: false,
      waived: false,
      approvedException: null,
    };
  }

  const waived = budget.actual <= approvedException.maxActual;
  return {
    ...budget,
    gatePassed: waived,
    waived,
    note: waived
      ? `Approved temporary exception (owner: ${approvedException.owner}, target: ${approvedException.targetRelease})`
      : `Exceeded approved exception cap (${formatMetric(metric, approvedException.maxActual)})`,
    approvedException,
  };
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

function summarizeRoute(route, samples, approvedExceptions) {
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

  const budgetChecks = {
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

  const budgets = Object.fromEntries(
    Object.entries(budgetChecks).map(([metric, budget]) => [
      metric,
      applyApprovedException(route, metric, budget, approvedExceptions),
    ]),
  );

  return {
    ...route,
    samples,
    budgets,
    passed: Object.values(budgets).every((budget) => budget.gatePassed),
  };
}

function markdownForSummary(summary) {
  const rows = summary.routes
    .map((route) => {
      const inpValue = formatMs(route.budgets.inp.actual);
      const inpLabel = route.budgets.inp.note
        ? `${inpValue} (TBT proxy)`
        : inpValue;
      const resultLabel = route.passed
        ? Object.values(route.budgets).some((metric) => metric.waived)
          ? "Pass (Exception)"
          : "Pass"
        : "Fail";

      return `| ${route.label} | \`${route.path}\` | ${formatMs(route.budgets.lcp.actual)} | ${inpLabel} | ${formatRatio(route.budgets.cls.actual)} | ${formatBytes(route.budgets.scriptBytes.actual)} | ${formatBytes(route.budgets.imageBytes.actual)} | ${resultLabel} |`;
    })
    .join("\n");

  const approvedExceptions = summary.approvedExceptions.length
    ? summary.approvedExceptions.map((entry) => `- ${entry}`).join("\n")
    : "- None";
  const blockingExceptions = summary.blockingExceptions.length
    ? summary.blockingExceptions.map((entry) => `- ${entry}`).join("\n")
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

### Approved temporary exceptions

${approvedExceptions}

### Blocking exceptions

${blockingExceptions}
`;
}

async function main() {
  await fs.mkdir(OUTPUT_DIRECTORY, { recursive: true });
  const approvedExceptions = await loadApprovedExceptions();

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
      summarizedRoutes.push(summarizeRoute(route, samples, approvedExceptions));
    }

    const approvedExceptionEntries = [];
    const blockingExceptions = [];
    for (const route of summarizedRoutes) {
      for (const metric of METRIC_KEYS) {
        const budget = route.budgets[metric];
        if (budget.waived && budget.approvedException) {
          approvedExceptionEntries.push(
            `${route.label} (${route.path}) ${metric}: actual ${formatMetric(metric, budget.actual)} vs PRD budget ${formatMetric(metric, budget.budget)}; approved cap ${formatMetric(metric, budget.approvedException.maxActual)}; owner ${budget.approvedException.owner}; severity ${budget.approvedException.severity}; target ${budget.approvedException.targetRelease}; justification: ${budget.approvedException.justification}`,
          );
        } else if (!budget.gatePassed) {
          blockingExceptions.push(
            `${route.label} (${route.path}) ${metric}: actual ${formatMetric(metric, budget.actual)} vs budget ${formatMetric(metric, budget.budget)}`,
          );
        }
      }
    }

    const summary = {
      date: new Date().toISOString(),
      routes: summarizedRoutes,
      approvedExceptions: approvedExceptionEntries,
      blockingExceptions,
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
        const flag = budget.passed
          ? "ok"
          : budget.waived
            ? "EXCEPT"
            : actual === null
              ? "?"
              : "OVER";
        return `${name}=${actual === null ? "n/a" : fmt(actual)}/${fmt(budget.budget)}${flag}`;
      });
      console.log(
        `  ${route.label.padEnd(18)} ${route.path.padEnd(24)} ${parts.join("  ")}  ${route.passed ? "PASS" : "FAIL"}`,
      );
    }

    if (blockingExceptions.length > 0) {
      throw new Error(
        `US-H02 performance budgets failed with ${blockingExceptions.length} unapproved exception(s).`,
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

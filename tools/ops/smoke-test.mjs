import process from "node:process";

const BASE_URL = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const ROUTES = [
  { path: "/", marker: "GRAND PRIX" },
  { path: "/seasons/1988", marker: "1988 赛季" },
  { path: "/museum", marker: "博物馆" },
  { path: "/cars/mclaren-mp4-4", marker: "迈凯伦 MP4/4" },
  { path: "/technologies/honda-ra168e", marker: "Honda RA168E" },
];

const failures = [];

for (const route of ROUTES) {
  const response = await fetch(`${BASE_URL}${route.path}`, {
    redirect: "follow",
  });

  if (!response.ok) {
    failures.push({
      path: route.path,
      reason: `unexpected status ${response.status}`,
    });
    continue;
  }

  const body = await response.text();
  if (!body.includes(route.marker)) {
    failures.push({
      path: route.path,
      reason: `missing marker "${route.marker}"`,
    });
  }
}

process.stdout.write(
  `${JSON.stringify(
    {
      baseUrl: BASE_URL,
      checkedRoutes: ROUTES.length,
      failures,
    },
    null,
    2,
  )}\n`,
);

if (failures.length > 0) {
  process.exitCode = 1;
}

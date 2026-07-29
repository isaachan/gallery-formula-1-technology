import fs from "node:fs/promises";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildClosedContentRoot } from "../helpers/build-closed-content-root";

const temporaryRoots: string[] = [];
const originalContentRoot = process.env.CONTENT_ROOT;

async function buildFixtureContentRoot(
  extraFiles: Array<[string, unknown]> = [],
) {
  return buildClosedContentRoot({
    temporaryRoots,
    prefix: "f1-person-page-",
    extraFiles,
  });
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(async () => {
  if (originalContentRoot === undefined) {
    delete process.env.CONTENT_ROOT;
  } else {
    process.env.CONTENT_ROOT = originalContentRoot;
  }
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

describe("PersonPage", () => {
  it("renders profile, achievements, teams, derived cars, and representative seasons", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: PersonPage } = await import(
      "../../src/app/people/[slug]/page"
    );

    const element = await PersonPage({
      params: Promise.resolve({ slug: "ayrton-senna" }),
    });
    render(element);

    expect(
      screen.getByRole("heading", { name: /艾尔顿·塞纳/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ayrton Senna")).toBeInTheDocument();
    expect(screen.getByText("👑 ×3")).toBeInTheDocument();
    expect(screen.getByText("'88 '90 '91")).toBeInTheDocument();
    // The person's role label ("车手") intentionally appears in two places:
    // the role badge and the "标签" spec row.
    expect(screen.getAllByText("车手").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Brazilian")).toBeInTheDocument();
    expect(screen.getByText("1984 - 1994")).toBeInTheDocument();
    expect(screen.getByText("迈凯伦")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "迈凯伦 MP4/4" })).toHaveAttribute(
      "href",
      "/cars/mclaren-mp4-4",
    );
    expect(screen.getByRole("link", { name: "1988 ↩" })).toHaveAttribute(
      "href",
      "/seasons/1988",
    );
    expect(
      screen.getByRole("link", { name: "报告 艾尔顿·塞纳 的内容问题" }),
    ).toHaveAttribute("href", expect.stringContaining("mailto:"));
  });

  it("returns not-found for a person slug that does not exist", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: PersonPage } = await import(
      "../../src/app/people/[slug]/page"
    );

    await expect(
      PersonPage({ params: Promise.resolve({ slug: "no-such-person" }) }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});

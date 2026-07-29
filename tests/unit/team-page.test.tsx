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
    prefix: "f1-team-page-",
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

describe("TeamPage", () => {
  it("renders team kind, base country, people, cars, and seasons", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: TeamPage } = await import(
      "../../src/app/teams/[slug]/page"
    );

    const element = await TeamPage({
      params: Promise.resolve({ slug: "mclaren" }),
    });
    render(element);

    expect(screen.getByRole("heading", { name: "迈凯伦" })).toBeInTheDocument();
    expect(screen.getByText("constructor")).toBeInTheDocument();
    expect(screen.getByText("GBR")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "艾尔顿·塞纳" })).toHaveAttribute(
      "href",
      "/people/ayrton-senna",
    );
    expect(screen.getByRole("link", { name: "迈凯伦 MP4/4" })).toHaveAttribute(
      "href",
      "/cars/mclaren-mp4-4",
    );
    expect(screen.getByRole("link", { name: "1988 赛季" })).toHaveAttribute(
      "href",
      "/seasons/1988",
    );
  });

  it("returns not-found for a team slug that does not exist", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: TeamPage } = await import(
      "../../src/app/teams/[slug]/page"
    );

    await expect(
      TeamPage({ params: Promise.resolve({ slug: "no-such-team" }) }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});

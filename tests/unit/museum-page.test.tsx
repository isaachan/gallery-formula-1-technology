import fs from "node:fs/promises";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildClosedContentRoot } from "../helpers/build-closed-content-root";

const temporaryRoots: string[] = [];
const originalContentRoot = process.env.CONTENT_ROOT;

async function buildFixtureContentRoot(includeEntities = true) {
  return buildClosedContentRoot({
    temporaryRoots,
    prefix: "f1-museum-page-",
    includeEntities,
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

describe("MuseumPage", () => {
  it("lists published cars, people, and technologies with representative timeline links", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: MuseumPage } = await import("../../src/app/museum/page");

    render(await MuseumPage());

    expect(screen.getByRole("heading", { name: /博物馆/ })).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          Boolean(element?.classList.contains("museum-sheet-row-title")) &&
          element?.textContent === "迈凯伦 MP4/4 ▸",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "关闭博物馆" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("shows the empty state when no entities have been published yet", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot(false);
    const { default: MuseumPage } = await import("../../src/app/museum/page");

    render(await MuseumPage());

    expect(screen.getByText("暂无已发布的车辆条目。")).toBeInTheDocument();
  });
});

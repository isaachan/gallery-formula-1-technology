import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_CONTENT_INCLUDE_DRAFTS = process.env.CONTENT_INCLUDE_DRAFTS;
const ORIGINAL_VERCEL_ENV = process.env.VERCEL_ENV;

describe("shouldIncludeDrafts", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.CONTENT_INCLUDE_DRAFTS;
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    if (ORIGINAL_CONTENT_INCLUDE_DRAFTS === undefined) {
      delete process.env.CONTENT_INCLUDE_DRAFTS;
    } else {
      process.env.CONTENT_INCLUDE_DRAFTS = ORIGINAL_CONTENT_INCLUDE_DRAFTS;
    }

    if (ORIGINAL_VERCEL_ENV === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = ORIGINAL_VERCEL_ENV;
    }
  });

  it("includes drafts when explicitly enabled", async () => {
    process.env.CONTENT_INCLUDE_DRAFTS = "true";
    const { shouldIncludeDrafts } = await import(
      "../../src/content/get-repository"
    );

    expect(shouldIncludeDrafts()).toBe(true);
  });

  it("includes drafts in preview deployments", async () => {
    process.env.VERCEL_ENV = "preview";
    const { shouldIncludeDrafts } = await import(
      "../../src/content/get-repository"
    );

    expect(shouldIncludeDrafts()).toBe(true);
  });

  it("keeps drafts hidden in production by default", async () => {
    process.env.VERCEL_ENV = "production";
    const { shouldIncludeDrafts } = await import(
      "../../src/content/get-repository"
    );

    expect(shouldIncludeDrafts()).toBe(false);
  });
});

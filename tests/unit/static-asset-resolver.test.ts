import { describe, expect, it } from "vitest";
import { StaticAssetResolver } from "../../src/lib/static-asset-resolver";

describe("StaticAssetResolver", () => {
  it.each([
    ["/", "search-index.json", "/search-index.json"],
    ["/preview/", "search-index.json", "/preview/search-index.json"],
    [
      "https://preview.example/f1/",
      "search-index.json",
      "https://preview.example/f1/search-index.json",
    ],
    [
      "applocal://localhost/",
      "search-index.json",
      "applocal://localhost/search-index.json",
    ],
  ])(
    "resolves %s artifacts from the explicit application base",
    (base, artifact, expected) => {
      expect(new StaticAssetResolver(base).resolve(artifact)).toBe(expected);
    },
  );

  it("does not make the same artifact route-relative on nested pages", () => {
    const resolverAtRoot = new StaticAssetResolver("/");
    const resolverAtMuseum = new StaticAssetResolver("/");
    const resolverAtSubject = new StaticAssetResolver("/");

    expect([
      resolverAtRoot.resolve("search-index.json"),
      resolverAtMuseum.resolve("search-index.json"),
      resolverAtSubject.resolve("search-index.json"),
    ]).toEqual([
      "/search-index.json",
      "/search-index.json",
      "/search-index.json",
    ]);
  });
});

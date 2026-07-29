import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSearchIndexCache,
  retrySearchMuseumClient,
  searchMuseumClient,
} from "../../src/lib/client-search";

const knownEntry = {
  id: "person-ayrton-senna",
  slug: "ayrton-senna",
  type: "person",
  title: "艾尔顿·塞纳",
  href: "/people/ayrton-senna",
  haystack: "艾尔顿·塞纳 ayrton senna 1988",
};

function responseWith(
  body: unknown,
  options: { ok?: boolean; status?: number } = {},
) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("client museum search", () => {
  beforeEach(() => {
    clearSearchIndexCache();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    clearSearchIndexCache();
    vi.unstubAllGlobals();
  });

  it("loads the versioned index from the root asset base and returns a known match", async () => {
    vi.mocked(fetch).mockResolvedValue(
      responseWith({ schemaVersion: 1, entries: [knownEntry] }),
    );

    await expect(searchMuseumClient("Senna")).resolves.toEqual([
      {
        id: knownEntry.id,
        slug: knownEntry.slug,
        type: knownEntry.type,
        title: knownEntry.title,
        href: knownEntry.href,
      },
    ]);
    expect(fetch).toHaveBeenCalledWith("/search-index.json");
  });

  it("rejects a non-success response instead of presenting it as zero matches", async () => {
    vi.mocked(fetch).mockResolvedValue(
      responseWith({}, { ok: false, status: 404 }),
    );

    await expect(searchMuseumClient("Senna")).rejects.toThrow(
      "Search index request failed with status 404",
    );
  });

  it("rejects malformed JSON instead of presenting it as zero matches", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
    } as unknown as Response);

    await expect(searchMuseumClient("Senna")).rejects.toThrow(
      "Unexpected token",
    );
  });

  it("rejects an incompatible contract version", async () => {
    vi.mocked(fetch).mockResolvedValue(
      responseWith({ schemaVersion: 2, entries: [knownEntry] }),
    );

    await expect(searchMuseumClient("Senna")).rejects.toThrow(
      "Unsupported search index schema version: 2",
    );
  });

  it("rejects a malformed versioned contract", async () => {
    vi.mocked(fetch).mockResolvedValue(
      responseWith({ schemaVersion: 1, entries: null }),
    );

    await expect(searchMuseumClient("Senna")).rejects.toThrow(
      "Search index entries must be an array",
    );
  });

  it("clears a rejected cached promise before retrying", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(responseWith({}, { ok: false, status: 503 }))
      .mockResolvedValueOnce(
        responseWith({ schemaVersion: 1, entries: [knownEntry] }),
      );

    await expect(searchMuseumClient("Senna")).rejects.toThrow(
      "Search index request failed with status 503",
    );
    await expect(retrySearchMuseumClient("Senna")).resolves.toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

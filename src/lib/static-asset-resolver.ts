function withTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

/**
 * Resolves generated artifacts from an explicit application asset base.
 *
 * The base is configuration, never the current route. This keeps the same
 * logical artifact stable on root pages, nested static-export routes, hosted
 * preview base paths, and the bundled applocal origin.
 */
export class StaticAssetResolver {
  private readonly assetBase: string;

  constructor(assetBase: string | URL) {
    const configuredBase = assetBase.toString().trim();
    if (!configuredBase) {
      throw new Error("Static asset base must not be empty");
    }
    this.assetBase = withTrailingSlash(configuredBase);
  }

  resolve(logicalName: string): string {
    const artifact = logicalName.trim().replace(/^\/+/, "");
    if (!artifact) {
      throw new Error("Static asset logical name must not be empty");
    }

    if (/^[a-z][a-z\d+.-]*:\/\//i.test(this.assetBase)) {
      return new URL(artifact, this.assetBase).toString();
    }

    const pathBase = this.assetBase.startsWith("/")
      ? this.assetBase
      : `/${this.assetBase}`;
    return `${pathBase}${artifact}`.replace(/\/{2,}/g, "/");
  }
}

export const defaultStaticAssetResolver = new StaticAssetResolver(
  process.env.NEXT_PUBLIC_ASSET_BASE ?? "/",
);

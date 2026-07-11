function structuredCloneDocument(document) {
  return JSON.parse(JSON.stringify(document));
}

function normalizeLocaleValue(value) {
  if (typeof value === "string") {
    return { zh: value };
  }

  if (value && typeof value === "object") {
    const normalized = {};
    if (typeof value.zh === "string") {
      normalized.zh = value.zh;
    }
    if (typeof value.en === "string") {
      normalized.en = value.en;
    }
    return normalized;
  }

  return value;
}

function migrateCommonEntityV0ToV1(document) {
  const migrated = structuredCloneDocument(document);

  if (migrated.schemaVersion !== 0) {
    return migrated;
  }

  migrated.schemaVersion = 1;
  migrated.redirectFrom = Array.isArray(migrated.previousSlugs)
    ? [...migrated.previousSlugs]
    : (migrated.redirectFrom ?? []);
  delete migrated.previousSlugs;

  migrated.title = normalizeLocaleValue(migrated.title);
  migrated.summary = normalizeLocaleValue(migrated.summary);

  if (migrated.subtitle !== undefined) {
    migrated.subtitle = normalizeLocaleValue(migrated.subtitle);
  }

  migrated.blocks = Array.isArray(migrated.blocks) ? migrated.blocks : [];

  return migrated;
}

const MIGRATIONS = {
  commonEntity: {
    latestVersion: 1,
    steps: [
      {
        from: 0,
        to: 1,
        migrate: migrateCommonEntityV0ToV1,
      },
    ],
  },
};

export function migrateDocumentFamily(family, document) {
  const definition = MIGRATIONS[family];
  if (!definition) {
    throw new Error(`Unknown migration family: ${family}`);
  }

  let current = structuredCloneDocument(document);
  let currentVersion =
    typeof current.schemaVersion === "number" ? current.schemaVersion : 0;

  while (currentVersion < definition.latestVersion) {
    const step = definition.steps.find(
      (candidate) => candidate.from === currentVersion,
    );
    if (!step) {
      throw new Error(
        `No migration step registered for ${family} schemaVersion ${currentVersion}`,
      );
    }

    current = step.migrate(current);
    currentVersion = step.to;
  }

  return current;
}

export function getLatestSchemaVersion(family) {
  const definition = MIGRATIONS[family];
  if (!definition) {
    throw new Error(`Unknown migration family: ${family}`);
  }

  return definition.latestVersion;
}

const NON_MEDIA_ENTITY_TYPES = [
  "season",
  "race",
  "circuit",
  "standing",
  "car",
  "team",
  "person",
  "technology",
  "era",
  "source",
];

export const reverseReferenceRules = Object.freeze({
  eraIncludesSeason: "eraIncludesSeason",
  seasonUsesEra: "seasonUsesEra",
  raceBelongsToSeason: "raceBelongsToSeason",
  seasonIncludesRace: "seasonIncludesRace",
  standingBelongsToSeason: "standingBelongsToSeason",
  seasonIncludesStanding: "seasonIncludesStanding",
  carIncludesSeason: "carIncludesSeason",
  seasonIncludesCar: "seasonIncludesCar",
  technologyIncludesSeason: "technologyIncludesSeason",
  seasonIncludesTechnology: "seasonIncludesTechnology",
  carUsesTeam: "carUsesTeam",
  teamIncludesCar: "teamIncludesCar",
  personIncludesTeam: "personIncludesTeam",
  teamIncludesPerson: "teamIncludesPerson",
  technologyIncludesCar: "technologyIncludesCar",
  carIncludesTechnology: "carIncludesTechnology",
});

function isReferenceId(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Collect every declared internal content reference without doing any I/O.
 *
 * Schema validation owns malformed field shapes. This collector deliberately
 * emits only declared, non-empty IDs so callers can share one exhaustive
 * relationship contract for graph validation and graph compilation.
 */
export function collectContentReferences(document) {
  if (!document || typeof document !== "object") {
    return [];
  }

  const sourceEntityId =
    typeof document.id === "string" ? document.id : "<unknown>";
  const references = [];

  const add = (fieldPath, referencedId, expectedTypes, reverseRule) => {
    if (!isReferenceId(referencedId)) {
      return;
    }
    references.push({
      sourceEntityId,
      fieldPath,
      expectedTypes: [...expectedTypes],
      referencedId,
      ...(reverseRule ? { reverseRule } : {}),
    });
  };

  const addArray = (fieldPath, values, expectedTypes, reverseRule) => {
    if (!Array.isArray(values)) {
      return;
    }
    values.forEach((value, index) => {
      add(`${fieldPath}[${index}]`, value, expectedTypes, reverseRule);
    });
  };

  addArray("sourceIds", document.sourceIds, ["source"]);
  add("coverMediaId", document.coverMediaId, ["mediaAsset"]);

  if (Array.isArray(document.blocks)) {
    document.blocks.forEach((block, blockIndex) => {
      if (!block || typeof block !== "object") {
        return;
      }
      const blockPath = `blocks[${blockIndex}]`;
      addArray(`${blockPath}.sourceIds`, block.sourceIds, ["source"]);

      switch (block.type) {
        case "image":
        case "diagram":
        case "animation":
        case "audio":
        case "video":
        case "model3d":
          add(`${blockPath}.mediaId`, block.mediaId, ["mediaAsset"]);
          break;
        case "gallery":
          addArray(`${blockPath}.mediaIds`, block.mediaIds, ["mediaAsset"]);
          break;
        case "relatedEntities":
          addArray(
            `${blockPath}.entityIds`,
            block.entityIds,
            NON_MEDIA_ENTITY_TYPES,
          );
          break;
        default:
          break;
      }
    });
  }

  switch (document.type) {
    case "season":
      add(
        "eraId",
        document.eraId,
        ["era"],
        reverseReferenceRules.eraIncludesSeason,
      );
      add("championPersonId", document.championPersonId, ["person"]);
      add("championCarId", document.championCarId, ["car"]);
      addArray(
        "raceIds",
        document.raceIds,
        ["race"],
        reverseReferenceRules.raceBelongsToSeason,
      );
      addArray(
        "standingIds",
        document.standingIds,
        ["standing"],
        reverseReferenceRules.standingBelongsToSeason,
      );
      addArray(
        "entrantCarIds",
        document.entrantCarIds,
        ["car"],
        reverseReferenceRules.carIncludesSeason,
      );
      addArray(
        "featuredTechnologyIds",
        document.featuredTechnologyIds,
        ["technology"],
        reverseReferenceRules.technologyIncludesSeason,
      );
      break;
    case "race":
      add(
        "seasonId",
        document.seasonId,
        ["season"],
        reverseReferenceRules.seasonIncludesRace,
      );
      add("circuitId", document.circuitId, ["circuit"]);
      add("winnerPersonId", document.winnerPersonId, ["person"]);
      add("winnerCarId", document.winnerCarId, ["car"]);
      break;
    case "standing":
      add(
        "seasonId",
        document.seasonId,
        ["season"],
        reverseReferenceRules.seasonIncludesStanding,
      );
      if (Array.isArray(document.entries)) {
        const expectedTypes =
          document.standingKind === "driver" ? ["person"] : ["team"];
        document.entries.forEach((entry, index) => {
          add(
            `entries[${index}].competitorId`,
            entry?.competitorId,
            expectedTypes,
          );
        });
      }
      break;
    case "car":
      addArray(
        "seasonIds",
        document.seasonIds,
        ["season"],
        reverseReferenceRules.seasonIncludesCar,
      );
      add(
        "constructorId",
        document.constructorId,
        ["team"],
        reverseReferenceRules.teamIncludesCar,
      );
      addArray("driverIds", document.driverIds, ["person"]);
      addArray(
        "technologyIds",
        document.technologyIds,
        ["technology"],
        reverseReferenceRules.technologyIncludesCar,
      );
      break;
    case "team":
      addArray("seasonIds", document.seasonIds, ["season"]);
      addArray(
        "personIds",
        document.personIds,
        ["person"],
        reverseReferenceRules.personIncludesTeam,
      );
      addArray(
        "carIds",
        document.carIds,
        ["car"],
        reverseReferenceRules.carUsesTeam,
      );
      break;
    case "person":
      addArray(
        "teamIds",
        document.teamIds,
        ["team"],
        reverseReferenceRules.teamIncludesPerson,
      );
      addArray("representativeSeasonIds", document.representativeSeasonIds, [
        "season",
      ]);
      break;
    case "technology":
      add("firstSeasonId", document.firstSeasonId, ["season"]);
      addArray(
        "seasonIds",
        document.seasonIds,
        ["season"],
        reverseReferenceRules.seasonIncludesTechnology,
      );
      addArray(
        "carIds",
        document.carIds,
        ["car"],
        reverseReferenceRules.carIncludesTechnology,
      );
      break;
    case "era":
      addArray(
        "seasonIds",
        document.seasonIds,
        ["season"],
        reverseReferenceRules.seasonUsesEra,
      );
      break;
    case "source":
      if (Array.isArray(document.supportedClaims)) {
        document.supportedClaims.forEach((claim, index) => {
          add(
            `supportedClaims[${index}].entityId`,
            claim?.entityId,
            NON_MEDIA_ENTITY_TYPES,
          );
        });
      }
      break;
    case "mediaAsset":
      add("posterMediaId", document.posterMediaId, ["mediaAsset"]);
      add("fallbackMediaId", document.fallbackMediaId, ["mediaAsset"]);
      break;
    default:
      break;
  }

  return references;
}

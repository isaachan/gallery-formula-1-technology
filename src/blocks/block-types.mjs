export const supportedBlockTypes = [
  "richText",
  "image",
  "gallery",
  "diagram",
  "animation",
  "audio",
  "video",
  "model3d",
  "factGrid",
  "quote",
  "relatedEntities",
];

export function isSupportedBlockType(value) {
  return supportedBlockTypes.includes(value);
}

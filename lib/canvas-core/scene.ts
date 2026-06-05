export const BLOCK_TYPES = [
  "note",
  "doc",
  "code",
  "artifact",
  "link_card",
  "canvas_ref",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export function isBlockType(value: string): value is BlockType {
  return BLOCK_TYPES.includes(value as BlockType);
}

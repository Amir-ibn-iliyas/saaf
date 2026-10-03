import { loadTemplates, type LoadedTemplate } from './masks';
import type { MaskFile, MasksConfig } from './types';

/** What GET /v1/masks returns: masks.json plus the mask files it references. */
export type MasksBundle = MasksConfig & { masks: Record<string, MaskFile> };

export type UsableMasks = { config: MasksConfig; templates: LoadedTemplate[] };

const isNumber = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

/**
 * Checks a remote (or cached) masks bundle and decodes its templates. Returns null for
 * anything incomplete or out of range, so the caller falls back to the bundled masks.
 */
export function parseMasksBundle(value: unknown): UsableMasks | null {
  if (!value || typeof value !== 'object') return null;
  const b = value as Partial<MasksBundle>;
  if (
    typeof b.version !== 'string' ||
    !isNumber(b.threshold, 0.05, 0.99) ||
    !isNumber(b.searchRadius, 0, 32) ||
    !isNumber(b.minOutlineEdge, 0, 50) ||
    !isNumber(b.maxOutlineEdgeAfter, 0, 50) ||
    !Array.isArray(b.templates) ||
    b.templates.length === 0 ||
    !b.masks ||
    typeof b.masks !== 'object'
  ) {
    return null;
  }
  for (const t of b.templates) {
    if (
      !t ||
      typeof t.id !== 'string' ||
      typeof t.file !== 'string' ||
      !isNumber(t.size, 8, 512) ||
      !isNumber(t.marginRight, 0, 4096) ||
      !isNumber(t.marginBottom, 0, 4096)
    ) {
      return null;
    }
  }
  const config: MasksConfig = {
    version: b.version,
    threshold: b.threshold!,
    searchRadius: b.searchRadius!,
    minOutlineEdge: b.minOutlineEdge!,
    maxOutlineEdgeAfter: b.maxOutlineEdgeAfter!,
    templates: b.templates,
  };
  try {
    // Throws on a missing mask, a wrong size or a bad encoding.
    return { config, templates: loadTemplates(config, b.masks) };
  } catch {
    return null;
  }
}

/** Raw image pixels: 4 bytes per pixel (R, G, B, A), row by row, no padding. */
export type RGBA = { width: number; height: number; data: Uint8ClampedArray };

/** Square alpha mask, values 0..1, row by row. */
export type AlphaMask = { size: number; alpha: Float32Array };

/** One known logo layout: mask size and distance from the bottom-right corner. */
export type Template = {
  id: string;
  size: number;
  marginRight: number;
  marginBottom: number;
  /** Mask id: `src/core/masks/<file>.json` when bundled, or a key in a remote masks bundle. */
  file: string;
};

export type MaskFile = { id: string; size: number; encoding: 'base64-u8'; data: string };

export type MasksConfig = {
  version: string;
  /** Minimum NCC score for a candidate. Photo texture can pass it; the checks below decide. */
  threshold: number;
  searchRadius: number;
  /** Outline edge ratio a real logo must show before removal (D-015). */
  minOutlineEdge: number;
  /** Outline edge ratio allowed after removal; higher means a wrong or misplaced mask. */
  maxOutlineEdgeAfter: number;
  templates: Template[];
  /** Veo video logo layouts; used by the server only (D-017). */
  videoTemplates?: Template[];
};

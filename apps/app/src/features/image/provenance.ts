/**
 * Keeps provenance metadata (C2PA Content Credentials) when we re-encode a cleaned image.
 * Gemini PNGs carry a `caBX` chunk; C2PA JPEGs carry APP11 (JUMBF) segments. We copy them
 * byte for byte from the original into the output (D-014). Pure byte work, no platform APIs.
 */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PNG_PROVENANCE_CHUNKS = new Set(['caBX']);
const JPEG_APP11 = 0xeb;

export function isPng(b: Uint8Array): boolean {
  return b.length > 8 && PNG_SIGNATURE.every((v, i) => b[i] === v);
}

export function isWebp(b: Uint8Array): boolean {
  return b.length > 12 && type4(b, 0) === 'RIFF' && type4(b, 8) === 'WEBP';
}

export function isJpeg(b: Uint8Array): boolean {
  return b.length > 3 && b[0] === 0xff && b[1] === 0xd8;
}

function u32(b: Uint8Array, o: number): number {
  return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
}

function type4(b: Uint8Array, o: number): string {
  return String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
}

type Piece = { start: number; end: number; name: string };

/** PNG chunks in file order (start/end include length, type, data and CRC). */
function pngChunks(b: Uint8Array): Piece[] {
  const out: Piece[] = [];
  let o = 8;
  while (o + 12 <= b.length) {
    const end = o + 12 + u32(b, o);
    const name = type4(b, o + 4);
    if (end > b.length) break;
    out.push({ start: o, end, name });
    o = end;
    if (name === 'IEND') break;
  }
  return out;
}

/** JPEG marker segments before the image data (start of scan). */
function jpegSegments(b: Uint8Array): Piece[] {
  const out: Piece[] = [];
  let o = 2;
  while (o + 4 <= b.length && b[o] === 0xff) {
    // Any number of 0xFF fill bytes may come before a marker.
    while (o + 1 < b.length && b[o + 1] === 0xff) o++;
    if (o + 4 > b.length) break;
    const marker = b[o + 1];
    if (marker === 0xda || marker === 0xd9) break; // SOS / EOI
    const length = (b[o + 2] << 8) | b[o + 3];
    if (length < 2) break;
    const end = o + 2 + length;
    if (end > b.length) break;
    out.push({ start: o, end, name: marker.toString(16) });
    o = end;
  }
  return out;
}

function splice(target: Uint8Array, at: number, parts: Uint8Array[]): Uint8Array {
  const extra = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(target.length + extra);
  out.set(target.subarray(0, at), 0);
  let o = at;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  out.set(target.subarray(at), o);
  return out;
}

/** The provenance blocks of an encoded image (empty if none or unknown format). */
export function provenanceBlocks(source: Uint8Array): Uint8Array[] {
  if (isPng(source)) {
    return pngChunks(source)
      .filter((c) => PNG_PROVENANCE_CHUNKS.has(c.name))
      .map((c) => source.slice(c.start, c.end));
  }
  if (isJpeg(source)) {
    return jpegSegments(source)
      .filter((s) => parseInt(s.name, 16) === JPEG_APP11)
      .map((s) => source.slice(s.start, s.end));
  }
  return [];
}

/**
 * Copies the source's provenance blocks into the freshly encoded output (same container
 * format only). Returns the output unchanged when there is nothing to copy or the formats
 * differ — callers can compare `provenanceBlocks` to know whether it was kept.
 */
export function carryProvenance(source: Uint8Array, output: Uint8Array): Uint8Array {
  const blocks = provenanceBlocks(source);
  if (blocks.length === 0) return output;

  if (isPng(source) && isPng(output)) {
    const ihdr = pngChunks(output).find((c) => c.name === 'IHDR');
    if (!ihdr) return output;
    return splice(output, ihdr.end, blocks);
  }
  if (isJpeg(source) && isJpeg(output)) {
    // After SOI and a JFIF/EXIF header if present, before everything else.
    let at = 2;
    for (const s of jpegSegments(output)) {
      if (s.name !== 'e0' && s.name !== 'e1') break;
      at = s.end;
    }
    return splice(output, at, blocks);
  }
  return output;
}

/** WebP keeps C2PA in a RIFF chunk named "C2PA"; we cannot carry it into another format. */
function webpHasC2pa(b: Uint8Array): boolean {
  let o = 12;
  while (o + 8 <= b.length) {
    if (type4(b, o) === 'C2PA') return true;
    const size = (b[o + 4] | (b[o + 5] << 8) | (b[o + 6] << 16) | (b[o + 7] << 24)) >>> 0;
    o += 8 + size + (size & 1);
  }
  return false;
}

export type ProvenanceStatus = 'none' | 'kept' | 'lost';

/**
 * Whether the source had provenance metadata and whether the output still has it.
 * 'lost' means: do not hand this output to the user (CLAUDE.md rule 6).
 */
export function provenanceStatus(source: Uint8Array, output: Uint8Array): ProvenanceStatus {
  const sourceBlocks = provenanceBlocks(source);
  const hasSome = sourceBlocks.length > 0 || (isWebp(source) && webpHasC2pa(source));
  if (!hasSome) return 'none';
  const carried = sourceBlocks.length > 0 && provenanceBlocks(output).length >= sourceBlocks.length;
  return carried ? 'kept' : 'lost';
}

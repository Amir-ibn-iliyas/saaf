/**
 * @jest-environment node
 */
import { carryProvenance, provenanceBlocks, provenanceStatus } from '../provenance';

const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function chunk(type: string, data: number[]): number[] {
  const len = data.length;
  return [
    (len >>> 24) & 255,
    (len >>> 16) & 255,
    (len >>> 8) & 255,
    len & 255,
    ...type.split('').map((c) => c.charCodeAt(0)),
    ...data,
    1, 2, 3, 4, // CRC (not checked by us)
  ];
}

const png = (...chunks: number[][]) => Uint8Array.from([...SIG, ...chunks.flat()]);
const IHDR = chunk('IHDR', Array(13).fill(7));
const IDAT = chunk('IDAT', [9, 9, 9]);
const IEND = chunk('IEND', []);
const CABX = chunk('caBX', [42, 43, 44, 45, 46]);

function seg(marker: number, data: number[]): number[] {
  const len = data.length + 2;
  return [0xff, marker, len >> 8, len & 255, ...data];
}
const jpeg = (...segs: number[][]) => Uint8Array.from([0xff, 0xd8, ...segs.flat(), 0xff, 0xda, 0, 2, 5, 5, 0xff, 0xd9]);

describe('provenance', () => {
  it('copies caBX from the source PNG into the output, right after IHDR', () => {
    const source = png(IHDR, CABX, IDAT, IEND);
    const output = png(IHDR, IDAT, IEND);
    const kept = carryProvenance(source, output);

    expect(Array.from(kept)).toEqual(Array.from(png(IHDR, CABX, IDAT, IEND)));
    expect(provenanceBlocks(kept).map((b) => Array.from(b))).toEqual([CABX]);
  });

  it('copies APP11 (JUMBF) segments between JPEGs, after the JFIF header', () => {
    const APP0 = seg(0xe0, [74, 70, 73, 70, 0]);
    const APP11a = seg(0xeb, [74, 80, 1, 2]);
    const APP11b = seg(0xeb, [74, 80, 3, 4]);
    const DQT = seg(0xdb, [0, 1, 2]);
    const source = jpeg(APP0, APP11a, APP11b, DQT);
    const output = jpeg(APP0, DQT);

    expect(Array.from(carryProvenance(source, output))).toEqual(
      Array.from(jpeg(APP0, APP11a, APP11b, DQT))
    );
  });

  it('leaves the output alone when the source has no provenance or formats differ', () => {
    const plainPng = png(IHDR, IDAT, IEND);
    const output = png(IHDR, IDAT, IEND);
    expect(carryProvenance(plainPng, output)).toBe(output);

    const jpegOut = jpeg(seg(0xdb, [1]));
    expect(carryProvenance(png(IHDR, CABX, IDAT, IEND), jpegOut)).toBe(jpegOut);
    expect(provenanceBlocks(Uint8Array.from([1, 2, 3]))).toEqual([]);
  });
});

describe('provenance: malformed input', () => {
  it('never throws or loops on broken PNG chunks', () => {
    const truncated = png(IHDR, CABX).slice(0, 8 + 25 + 10);
    expect(provenanceBlocks(truncated)).toEqual([]);

    const huge = png(IHDR, [0xff, 0xff, 0xff, 0xff, 99, 97, 66, 88, 1, 2, 3]);
    expect(provenanceBlocks(huge)).toEqual([]);

    const noIhdr = png(IDAT, IEND);
    expect(carryProvenance(png(IHDR, CABX, IDAT, IEND), noIhdr)).toBe(noIhdr);
  });

  it('stops at a JPEG segment with a length below 2', () => {
    const bad = Uint8Array.from([0xff, 0xd8, 0xff, 0xeb, 0, 1, 0xff, 0xd9]);
    expect(provenanceBlocks(bad)).toEqual([]);
  });

  it('finds APP11 after 0xFF fill bytes', () => {
    const APP11 = seg(0xeb, [74, 80, 9]);
    const filled = Uint8Array.from([0xff, 0xd8, 0xff, 0xff, ...APP11, 0xff, 0xda, 0, 2, 0xff, 0xd9]);
    expect(provenanceBlocks(filled).map((b) => Array.from(b))).toEqual([APP11]);
  });
});

describe('provenanceStatus', () => {
  const riff = (...chunks: [string, number[]][]) => {
    const body = chunks.flatMap(([name, data]) => [
      ...name.split('').map((c) => c.charCodeAt(0)),
      data.length & 255, (data.length >> 8) & 255, 0, 0,
      ...data,
      ...(data.length & 1 ? [0] : []),
    ]);
    const size = body.length + 4;
    return Uint8Array.from([82, 73, 70, 70, size & 255, (size >> 8) & 255, 0, 0, 87, 69, 66, 80, ...body]);
  };

  it('reports none, kept and lost', () => {
    const plain = png(IHDR, IDAT, IEND);
    const withC2pa = png(IHDR, CABX, IDAT, IEND);
    expect(provenanceStatus(plain, plain)).toBe('none');
    expect(provenanceStatus(withC2pa, carryProvenance(withC2pa, plain))).toBe('kept');
    expect(provenanceStatus(withC2pa, jpeg(seg(0xdb, [1])))).toBe('lost');
  });

  it('treats a WebP with a C2PA chunk as lost when re-encoded', () => {
    const webp = riff(['VP8 ', [1, 2, 3]], ['C2PA', [5, 6, 7, 8]]);
    expect(provenanceStatus(webp, jpeg(seg(0xdb, [1])))).toBe('lost');
    expect(provenanceStatus(riff(['VP8 ', [1, 2, 3]]), jpeg(seg(0xdb, [1])))).toBe('none');
  });
});

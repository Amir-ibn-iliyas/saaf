import type { RGBA } from '@/core';

import type { OutputFormat } from './output';

/**
 * Web: decode and encode with the browser's own image codecs (canvas), not Skia/CanvasKit.
 * It is much faster for PNG output and avoids loading the 8 MB wasm (D-012).
 */

/** Web: the original file bytes (needed to keep its provenance metadata). */
export async function readBytes(uri: string): Promise<Uint8Array> {
  return new Uint8Array(await (await fetch(uri)).arrayBuffer());
}

export async function decode(bytes: Uint8Array): Promise<RGBA> {
  // No colour management or premultiplication, so the bytes are the file's own values.
  const bitmap = await createImageBitmap(new Blob([bytes as BlobPart]), {
    colorSpaceConversion: 'none',
    premultiplyAlpha: 'none',
  });
  const { width, height } = bitmap;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('decode_failed');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const { data } = ctx.getImageData(0, 0, width, height, { colorSpace: 'srgb' });
  return { width, height, data };
}

export async function encode(img: RGBA, format: OutputFormat): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('encode_failed');
  ctx.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, format.mimeType, format.quality / 100)
  );
  if (!blob) throw new Error('encode_failed');
  return new Uint8Array(await blob.arrayBuffer());
}

/** Web: an object URL for the result (revoked by release()). */
export async function store(bytes: Uint8Array, _fileName: string, mimeType: string): Promise<string> {
  return URL.createObjectURL(new Blob([bytes as BlobPart], { type: mimeType }));
}

/** Web: free a cleaned image's object URL once it is no longer shown. */
export function release(uri: string) {
  if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
}

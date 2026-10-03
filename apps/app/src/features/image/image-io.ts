import { AlphaType, ColorType, ImageFormat, Skia } from '@shopify/react-native-skia';
import { Directory, File, Paths } from 'expo-file-system';

import type { RGBA } from '@/core';

import type { OutputFormat } from './output';

/** Skia's Data.fromBytes copies the whole underlying buffer, so hand it an exact-size view. */
function exact(bytes: Uint8Array | Uint8ClampedArray): Uint8Array {
  const view = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength ? view : view.slice();
}

/** Native: the original file bytes (needed to keep its provenance metadata). */
export async function readBytes(uri: string): Promise<Uint8Array> {
  try {
    return await new File(uri).bytes();
  } catch {
    // e.g. a content:// URI the file API cannot open directly.
    return new Uint8Array(await (await fetch(uri)).arrayBuffer());
  }
}

/** Native (Android / iOS): decode with Skia into straight RGBA bytes. */
export async function decode(bytes: Uint8Array): Promise<RGBA> {
  const data = Skia.Data.fromBytes(exact(bytes));
  const image = Skia.Image.MakeImageFromEncoded(data);
  data.dispose();
  if (!image) throw new Error('decode_failed');

  const width = image.width();
  const height = image.height();
  // readPixels copies into a fresh JS array, so disposing the image afterwards is safe.
  const pixels = image.readPixels(0, 0, {
    width,
    height,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });
  image.dispose();
  if (!pixels || pixels.BYTES_PER_ELEMENT !== 1) throw new Error('decode_failed');

  const px = pixels as Uint8Array;
  return { width, height, data: new Uint8ClampedArray(px.buffer, px.byteOffset, px.length) };
}

/** Native: encode with Skia. */
export async function encode(img: RGBA, format: OutputFormat): Promise<Uint8Array> {
  const data = Skia.Data.fromBytes(exact(img.data));
  const image = Skia.Image.MakeImage(
    { width: img.width, height: img.height, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
    data,
    img.width * 4
  );
  if (!image) {
    data.dispose();
    throw new Error('encode_failed');
  }
  const bytes = image.encodeToBytes(
    format.mimeType === 'image/png' ? ImageFormat.PNG : ImageFormat.JPEG,
    format.quality
  );
  image.dispose();
  data.dispose();
  return bytes;
}

/**
 * Native: write to the app cache under the final name ("<original>-clean.png"), in its own
 * folder so names never clash and the gallery shows the right file name. Returns file://.
 */
export async function store(bytes: Uint8Array, fileName: string, _mimeType: string): Promise<string> {
  const dir = new Directory(Paths.cache, `clean-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  dir.create();
  const file = new File(dir, fileName);
  file.write(bytes);
  return file.uri;
}

/** Native: delete a cleaned file (and its folder) once it is no longer shown. */
export function release(uri: string) {
  try {
    const file = new File(uri);
    const dir = file.parentDirectory;
    if (file.exists) file.delete();
    if (dir.exists && dir.name.startsWith('clean-')) dir.delete();
  } catch {
    // Already gone, or the OS cleaned the cache.
  }
}

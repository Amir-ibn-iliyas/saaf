import { AlphaType, ColorType, ImageFormat, Skia } from '@shopify/react-native-skia';

import { invertBottomRightBox } from './invert-box';

export type SpikeResult = {
  uri: string;
  width: number;
  height: number;
  /** load file + decode */
  decodeMs: number;
  readMs: number;
  editMs: number;
  /** build image from pixels + encode PNG */
  encodeMs: number;
  totalMs: number;
};

const BOX_SIZE = 100;

/**
 * Phase 0 spike: decode an image with Skia, read raw RGBA pixels, invert a 100 × 100 box in
 * the bottom-right corner, then encode the result as PNG.
 */
export async function runSpike(sourceUri: string): Promise<SpikeResult> {
  const t0 = performance.now();
  const data = await Skia.Data.fromURI(sourceUri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  data.dispose();
  if (!image) {
    throw new Error('Could not open this image. Try a PNG or JPEG file.');
  }
  const width = image.width();
  const height = image.height();
  const t1 = performance.now();

  // Ask for straight (unpremultiplied) RGBA so the bytes mean the same thing on every platform.
  const info = {
    width,
    height,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  };
  const pixels = image.readPixels(0, 0, info);
  image.dispose();
  if (!pixels || pixels.BYTES_PER_ELEMENT !== 1) {
    throw new Error('Could not read this image. Try another image.');
  }
  const rgba = pixels as Uint8Array;
  const t2 = performance.now();

  invertBottomRightBox(rgba, width, height, BOX_SIZE);
  const t3 = performance.now();

  const editedData = Skia.Data.fromBytes(rgba);
  const edited = Skia.Image.MakeImage(info, editedData, width * 4);
  if (!edited) {
    editedData.dispose();
    throw new Error('Could not build the edited image. Try a smaller image.');
  }
  const base64 = edited.encodeToBase64(ImageFormat.PNG, 100);
  edited.dispose();
  editedData.dispose();
  const t4 = performance.now();

  return {
    uri: `data:image/png;base64,${base64}`,
    width,
    height,
    decodeMs: t1 - t0,
    readMs: t2 - t1,
    editMs: t3 - t2,
    encodeMs: t4 - t3,
    totalMs: t4 - t0,
  };
}

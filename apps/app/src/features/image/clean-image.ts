import { clean, type Detection } from '@/core';
import { getMasks } from '@/features/masks/mask-store';
import type { PickedFile } from '@/features/pick/classify';

import { decode, encode, readBytes, store } from './image-io';
import { cleanFileName, outputFormatFor } from './output';
import { carryProvenance, isPng, provenanceStatus } from './provenance';

export type CleanedImage = {
  status: 'cleaned';
  source: PickedFile;
  uri: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  detection: Detection;
  ms: number;
};

export type ImageOutcome =
  | CleanedImage
  | { status: 'no_watermark'; source: PickedFile; detection: Detection }
  /** The original carries provenance we cannot keep (WebP C2PA), so no output is made. */
  | { status: 'provenance_unsupported'; source: PickedFile }
  | { status: 'failed'; source: PickedFile };

/** Lets React paint ("Cleaning…") before the heavy synchronous work starts. */
const nextFrame = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Original bytes → decode → core.clean (detect, refine, remove, verify) → encode → copy the
 * original's provenance metadata (C2PA) into the output. Images never leave the device.
 */
export async function cleanImage(source: PickedFile): Promise<ImageOutcome> {
  const started = Date.now();
  try {
    // Remote masks when the server sent valid ones (5.2), else the bundled masks.
    const { config, templates } = getMasks();
    await nextFrame();
    const original = await readBytes(source.uri);
    const img = await decode(original);
    const { image, detection } = clean(img, templates, config);
    if (!detection.detected) return { status: 'no_watermark', source, detection };

    await nextFrame();
    // Decide by the real bytes, not the picker's MIME guess, so a PNG stays a PNG.
    const format = outputFormatFor(isPng(original) ? 'image/png' : source.mimeType);
    const name = cleanFileName(source.name, format);
    const bytes = carryProvenance(original, await encode(image, format));
    if (provenanceStatus(original, bytes) === 'lost') return { status: 'provenance_unsupported', source };
    const uri = await store(bytes, name, format.mimeType);
    return {
      status: 'cleaned',
      source,
      uri,
      name,
      mimeType: format.mimeType,
      width: image.width,
      height: image.height,
      detection,
      ms: Date.now() - started,
    };
  } catch (e) {
    if (__DEV__) console.warn('cleanImage failed', e);
    return { status: 'failed', source };
  }
}

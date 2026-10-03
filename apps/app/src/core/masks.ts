import alpha36 from './masks/alpha-36.json';
import alpha48 from './masks/alpha-48.json';
import alpha96 from './masks/alpha-96.json';
import alpha96v20260520 from './masks/alpha-96-20260520.json';
import bundledConfig from './masks.json';
import type { AlphaMask, MaskFile, MasksConfig, Template } from './types';

/** Masks shipped inside the app. Remote masks (Phase 5) use the same JSON shapes. */
export const bundledMaskFiles: Record<string, MaskFile> = {
  'alpha-36': alpha36 as MaskFile,
  'alpha-48': alpha48 as MaskFile,
  'alpha-96': alpha96 as MaskFile,
  'alpha-96-20260520': alpha96v20260520 as MaskFile,
};

export const bundledMasksConfig = bundledConfig as MasksConfig;

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = new Uint8Array(128);
for (let i = 0; i < BASE64.length; i++) BASE64_LOOKUP[BASE64.charCodeAt(i)] = i;

/** Plain base64 decoder, so core does not depend on atob/Buffer being present. */
export function decodeBase64(text: string): Uint8Array {
  const clean = text.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let bits = 0;
  let value = 0;
  let o = 0;
  for (let i = 0; i < clean.length; i++) {
    value = (value << 6) | BASE64_LOOKUP[clean.charCodeAt(i)];
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (value >> bits) & 0xff;
    }
  }
  return out;
}

export function decodeMask(file: MaskFile): AlphaMask {
  if (file.encoding !== 'base64-u8') {
    throw new Error(`Unknown mask encoding: ${file.encoding}`);
  }
  const bytes = decodeBase64(file.data);
  if (bytes.length !== file.size * file.size) {
    throw new Error(`Mask ${file.id} has ${bytes.length} values, expected ${file.size * file.size}`);
  }
  const alpha = new Float32Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) alpha[i] = bytes[i] / 255;
  return { size: file.size, alpha };
}

export type LoadedTemplate = Template & { mask: AlphaMask };

/** Decodes every template's mask once. Throws if a template points at a missing mask. */
export function loadTemplates(
  config: MasksConfig = bundledMasksConfig,
  files: Record<string, MaskFile> = bundledMaskFiles
): LoadedTemplate[] {
  const cache = new Map<string, AlphaMask>();
  return config.templates.map((t) => {
    let mask = cache.get(t.file);
    if (!mask) {
      const file = files[t.file];
      if (!file) throw new Error(`Template ${t.id} needs mask "${t.file}", which is missing`);
      mask = decodeMask(file);
      cache.set(t.file, mask);
    }
    if (mask.size !== t.size) {
      throw new Error(`Template ${t.id} is ${t.size} px but mask ${t.file} is ${mask.size} px`);
    }
    return { ...t, mask };
  });
}

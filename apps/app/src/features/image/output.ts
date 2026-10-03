export type OutputFormat = { mimeType: 'image/png' | 'image/jpeg'; extension: 'png' | 'jpg'; quality: number };

const PNG: OutputFormat = { mimeType: 'image/png', extension: 'png', quality: 100 };
const JPEG: OutputFormat = { mimeType: 'image/jpeg', extension: 'jpg', quality: 95 };

/** Keep PNG as PNG (lossless); JPEG and WebP become JPEG at quality 95. */
export function outputFormatFor(inputMimeType: string): OutputFormat {
  return inputMimeType === 'image/png' ? PNG : JPEG;
}

/** "Gemini_Generated_Image.png" → "Gemini_Generated_Image-clean.png" (extension follows the output). */
export function cleanFileName(inputName: string, format: OutputFormat): string {
  const dot = inputName.lastIndexOf('.');
  const base = dot > 0 ? inputName.slice(0, dot) : inputName || 'image';
  return `${base}-clean.${format.extension}`;
}

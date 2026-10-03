/**
 * Inverts the RGB channels of a square box in the bottom-right corner of an RGBA buffer,
 * in place. Alpha is left untouched. The box is clipped to the image size.
 */
export function invertBottomRightBox(
  pixels: Uint8Array,
  width: number,
  height: number,
  size: number
): void {
  const boxW = Math.min(size, width);
  const boxH = Math.min(size, height);
  for (let y = height - boxH; y < height; y++) {
    let i = (y * width + (width - boxW)) * 4;
    for (let x = 0; x < boxW; x++, i += 4) {
      pixels[i] = 255 - pixels[i];
      pixels[i + 1] = 255 - pixels[i + 1];
      pixels[i + 2] = 255 - pixels[i + 2];
    }
  }
}

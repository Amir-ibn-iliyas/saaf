import { invertBottomRightBox } from '../invert-box';

function solid(width: number, height: number, rgba: [number, number, number, number]) {
  const px = new Uint8Array(width * height * 4);
  for (let i = 0; i < px.length; i += 4) px.set(rgba, i);
  return px;
}

function pixelAt(px: Uint8Array, width: number, x: number, y: number) {
  const i = (y * width + x) * 4;
  return Array.from(px.slice(i, i + 4));
}

describe('invertBottomRightBox', () => {
  it('inverts RGB inside the box and keeps alpha', () => {
    const px = solid(4, 3, [10, 20, 30, 200]);
    invertBottomRightBox(px, 4, 3, 2);

    expect(pixelAt(px, 4, 3, 2)).toEqual([245, 235, 225, 200]);
    expect(pixelAt(px, 4, 2, 1)).toEqual([245, 235, 225, 200]);
    // outside the box
    expect(pixelAt(px, 4, 1, 2)).toEqual([10, 20, 30, 200]);
    expect(pixelAt(px, 4, 3, 0)).toEqual([10, 20, 30, 200]);
  });

  it('clips the box to small images', () => {
    const px = solid(2, 2, [0, 0, 0, 255]);
    invertBottomRightBox(px, 2, 2, 100);

    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        expect(pixelAt(px, 2, x, y)).toEqual([255, 255, 255, 255]);
      }
    }
  });
});

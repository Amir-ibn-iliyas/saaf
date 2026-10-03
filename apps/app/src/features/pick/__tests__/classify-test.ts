/**
 * @jest-environment node
 */
import { classify, MAX_IMAGES, toPickedFile } from '../classify';

const file = (name: string, mimeType?: string) => ({ uri: `file:///x/${name}`, name, mimeType });

describe('toPickedFile', () => {
  it('accepts the supported types by mime type or extension', () => {
    expect(toPickedFile(file('a.png', 'image/png'))?.kind).toBe('image');
    expect(toPickedFile(file('a.JPG'))).toMatchObject({ kind: 'image', mimeType: 'image/jpeg' });
    expect(toPickedFile(file('a.jpg', 'image/jpg'))?.mimeType).toBe('image/jpeg');
    expect(toPickedFile(file('a.webp'))?.mimeType).toBe('image/webp');
    expect(toPickedFile(file('clip.mov'))).toMatchObject({ kind: 'video', mimeType: 'video/quicktime' });
    expect(toPickedFile(file('clip.mp4', 'video/mp4'))?.kind).toBe('video');
  });

  it('rejects other types', () => {
    expect(toPickedFile(file('a.heic', 'image/heic'))).toBeNull();
    expect(toPickedFile(file('a.gif', 'image/gif'))).toBeNull();
    expect(toPickedFile(file('notes.pdf', 'application/pdf'))).toBeNull();
  });

  it('takes the name from the uri when the picker gives none', () => {
    expect(toPickedFile({ uri: 'file:///data/cache/Gemini%20image.png' })?.name).toBe(
      'Gemini image.png'
    );
  });

  it('makes up a name for data and blob uris', () => {
    expect(toPickedFile({ uri: 'data:image/png;base64,AAAA', mimeType: 'image/png' })?.name).toBe(
      'image.png'
    );
    expect(toPickedFile({ uri: 'blob:http://x/123', mimeType: 'video/quicktime' })?.name).toBe(
      'video.mov'
    );
  });
});

describe('classify', () => {
  it('sends images to the image flow', () => {
    expect(classify([file('a.png'), file('b.jpg')])).toMatchObject({
      route: 'images',
      images: [{ name: 'a.png' }, { name: 'b.jpg' }],
      notice: null,
    });
  });

  it('sends one video to the video flow', () => {
    expect(classify([file('clip.mp4')])).toMatchObject({
      route: 'video',
      video: { name: 'clip.mp4' },
      notice: null,
    });
  });

  it('cleans the images first when photos and a video are mixed', () => {
    const result = classify([file('a.png'), file('clip.mp4')]);
    expect(result).toMatchObject({ route: 'images', notice: 'mixed' });
    expect(result.route === 'images' && result.images).toHaveLength(1);
  });

  it('keeps only the first video when several are picked', () => {
    expect(classify([file('1.mp4'), file('2.mov')])).toMatchObject({
      route: 'video',
      video: { name: '1.mp4' },
      notice: 'multipleVideos',
    });
  });

  it(`caps images at ${MAX_IMAGES}`, () => {
    const many = Array.from({ length: 25 }, (_, i) => file(`${i}.png`));
    const result = classify(many);
    expect(result).toMatchObject({ route: 'images', notice: 'tooMany' });
    expect(result.route === 'images' && result.images).toHaveLength(MAX_IMAGES);
  });

  it('reports unsupported files', () => {
    expect(classify([file('a.heic', 'image/heic')])).toEqual({ route: 'none', notice: 'unsupported' });
    expect(classify([file('a.png'), file('b.gif')])).toMatchObject({
      route: 'images',
      notice: 'unsupported',
    });
    expect(classify([])).toEqual({ route: 'none', notice: null });
  });
});

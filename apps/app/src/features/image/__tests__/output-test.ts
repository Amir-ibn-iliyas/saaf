/**
 * @jest-environment node
 */
import { cleanFileName, outputFormatFor } from '../output';

describe('output format', () => {
  it('keeps PNG as PNG and turns JPEG / WebP into JPEG 95', () => {
    expect(outputFormatFor('image/png')).toMatchObject({ mimeType: 'image/png', extension: 'png' });
    expect(outputFormatFor('image/jpeg')).toMatchObject({ mimeType: 'image/jpeg', quality: 95 });
    expect(outputFormatFor('image/webp')).toMatchObject({ mimeType: 'image/jpeg', extension: 'jpg' });
  });

  it('adds -clean and the output extension to the name', () => {
    expect(cleanFileName('Gemini_Generated_Image.png', outputFormatFor('image/png'))).toBe(
      'Gemini_Generated_Image-clean.png'
    );
    expect(cleanFileName('photo.webp', outputFormatFor('image/webp'))).toBe('photo-clean.jpg');
    expect(cleanFileName('my.photo.JPEG', outputFormatFor('image/jpeg'))).toBe('my.photo-clean.jpg');
    expect(cleanFileName('noext', outputFormatFor('image/png'))).toBe('noext-clean.png');
    expect(cleanFileName('', outputFormatFor('image/png'))).toBe('image-clean.png');
  });
});

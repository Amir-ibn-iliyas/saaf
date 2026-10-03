/**
 * @jest-environment node
 */
import { codeFromBody } from '../errors';
import { checkVideo, MAX_VIDEO_BYTES } from '../limits';

describe('checkVideo', () => {
  it('passes videos inside the limits or with unknown size/length', () => {
    expect(checkVideo({ size: 5_000_000, durationMs: 8_000 })).toBeNull();
    expect(checkVideo({})).toBeNull();
    expect(checkVideo({ durationMs: 60_040 })).toBeNull();
  });

  it('stops videos over 100 MB or 60 s before uploading', () => {
    expect(checkVideo({ size: MAX_VIDEO_BYTES + 1 })).toBe('too_large');
    expect(checkVideo({ durationMs: 75_000 })).toBe('too_long');
  });
});

describe('codeFromBody', () => {
  it('reads contract errors and maps anything else to processing_failed', () => {
    expect(codeFromBody('{"error":"no_watermark","message":"…"}')).toBe('no_watermark');
    expect(codeFromBody('{"error":"rate_limited"}')).toBe('rate_limited');
    expect(codeFromBody('{"error":"something_new"}')).toBe('processing_failed');
    expect(codeFromBody('<html>502</html>')).toBe('processing_failed');
  });
});

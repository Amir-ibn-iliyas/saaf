/** Same limits as the server (docs/03-architecture.md), checked on the device before upload. */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_VIDEO_MS = 60_000;

export type LocalVideoProblem = 'too_large' | 'too_long';

/** Unknown size or duration passes; the server checks again. */
export function checkVideo(video: { size?: number; durationMs?: number }): LocalVideoProblem | null {
  if (video.size != null && video.size > MAX_VIDEO_BYTES) return 'too_large';
  // A little slack: containers often report 60.04 s for a "60 s" clip.
  if (video.durationMs != null && video.durationMs > MAX_VIDEO_MS + 500) return 'too_long';
  return null;
}

import { copy } from '@/ui/copy';

/** Error codes from the API contract plus the app's own (network, cancelled). */
export type VideoErrorCode =
  | 'too_large'
  | 'unsupported_type'
  | 'too_long'
  | 'too_big_resolution'
  | 'no_watermark'
  | 'rate_limited'
  | 'processing_failed'
  | 'network'
  | 'cancelled';

export class VideoApiError extends Error {
  constructor(public code: VideoErrorCode) {
    super(code);
  }
}

const KNOWN = new Set<string>([
  'too_large',
  'unsupported_type',
  'too_long',
  'too_big_resolution',
  'no_watermark',
  'rate_limited',
  'processing_failed',
]);

/** Reads `{"error": "...", "message": "..."}`; anything else counts as processing_failed. */
export function codeFromBody(body: string): VideoErrorCode {
  try {
    const code = (JSON.parse(body) as { error?: string }).error;
    return code && KNOWN.has(code) ? (code as VideoErrorCode) : 'processing_failed';
  } catch {
    return 'processing_failed';
  }
}

/** DESIGN.md copy for each code (never a bare "something went wrong"). */
export function messageFor(code: VideoErrorCode): string {
  switch (code) {
    case 'too_large':
      return copy.err.too_large;
    case 'unsupported_type':
      return copy.err.unsupported;
    case 'too_long':
      return copy.err.too_long;
    case 'too_big_resolution':
      return copy.err.too_big_resolution;
    case 'no_watermark':
      return copy.err.no_watermark;
    case 'rate_limited':
      return copy.err.rate_limited;
    case 'network':
      return copy.err.network;
    case 'cancelled':
      return '';
    default:
      return copy.err.clean_video_failed;
  }
}

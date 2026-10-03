export type PickedFile = {
  kind: 'image' | 'video';
  uri: string;
  name: string;
  mimeType: string;
  /** Bytes, when the picker or browser tells us. */
  size?: number;
  /** Video length in milliseconds, when known before upload. */
  durationMs?: number;
};

/** What a picker or a drop gives us, before we know whether we can use it. */
export type RawFile = {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
  size?: number | null;
  durationMs?: number | null;
};

export type PickNotice = 'mixed' | 'multipleVideos' | 'tooMany' | 'unsupported';

export type Classified =
  | { route: 'images'; images: PickedFile[]; notice: PickNotice | null }
  | { route: 'video'; video: PickedFile; notice: PickNotice | null }
  | { route: 'none'; notice: PickNotice | null };

export const MAX_IMAGES = 20;

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
};
const SUPPORTED = new Set(Object.values(MIME_BY_EXTENSION));

function extensionOf(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  return match ? match[1].toLowerCase() : '';
}

function fileNameOf(raw: RawFile): string {
  if (raw.name) return raw.name;
  if (raw.uri.startsWith('data:') || raw.uri.startsWith('blob:')) return '';
  const last = raw.uri.split(/[/\\]/).pop() ?? '';
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

/** Normalizes one file, or returns null if it is not a type we support. */
export function toPickedFile(raw: RawFile): PickedFile | null {
  const name = fileNameOf(raw);
  let mimeType = (raw.mimeType ?? '').toLowerCase();
  if (mimeType === 'image/jpg') mimeType = 'image/jpeg';
  if (!SUPPORTED.has(mimeType)) mimeType = MIME_BY_EXTENSION[extensionOf(name)] ?? '';
  if (!SUPPORTED.has(mimeType)) return null;

  const kind = mimeType.startsWith('video/') ? 'video' : 'image';
  const fallbackName = `${kind}.${mimeType.split('/')[1].replace('quicktime', 'mov').replace('jpeg', 'jpg')}`;
  return {
    kind,
    uri: raw.uri,
    name: name || fallbackName,
    mimeType,
    ...(raw.size != null && { size: raw.size }),
    ...(raw.durationMs != null && { durationMs: raw.durationMs }),
  };
}

/**
 * Decides where a pick goes: images → image flow (max 20), one video → video flow,
 * mixed → images first and tell the user to pick the video separately.
 */
export function classify(raws: RawFile[]): Classified {
  const files = raws.map(toPickedFile);
  const usable = files.filter((f): f is PickedFile => f !== null);
  const someUnsupported = usable.length < files.length;
  const images = usable.filter((f) => f.kind === 'image');
  const videos = usable.filter((f) => f.kind === 'video');

  if (images.length > 0) {
    let notice: PickNotice | null = null;
    if (videos.length > 0) notice = 'mixed';
    else if (images.length > MAX_IMAGES) notice = 'tooMany';
    else if (someUnsupported) notice = 'unsupported';
    return { route: 'images', images: images.slice(0, MAX_IMAGES), notice };
  }
  if (videos.length > 0) {
    const notice = videos.length > 1 ? 'multipleVideos' : someUnsupported ? 'unsupported' : null;
    return { route: 'video', video: videos[0], notice };
  }
  return { route: 'none', notice: someUnsupported ? 'unsupported' : null };
}

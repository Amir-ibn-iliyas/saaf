import { Directory, DownloadTask, File, Paths, UploadTask, UploadType } from 'expo-file-system';

import type { PickedFile } from '@/features/pick/classify';

import { API_URL } from './api';
import { codeFromBody, VideoApiError } from './errors';

export type UploadCallbacks = {
  /** 0..1 while the file is being sent. */
  onUploadProgress: (fraction: number) => void;
  /** Called once the upload is done and the server is cleaning. */
  onCleaning: () => void;
  signal: AbortSignal;
};

export type CleanedVideo = { uri: string; name: string };

const JOB_ID = /^[0-9a-f]{32}$/;

function cleanName(name: string) {
  const dot = name.lastIndexOf('.');
  return `${dot > 0 ? name.slice(0, dot) : name || 'video'}-clean.mp4`;
}

const isAbort = (e: unknown) => e instanceof Error && e.name === 'AbortError';

/** Tell the server to drop a result we will not download (cancel). Best effort. */
function forget(id: string) {
  fetch(`${API_URL}/v1/video/${id}`, { method: 'DELETE' }).catch(() => {});
}

/**
 * Android / iOS: upload with progress (expo-file-system UploadTask), then download the result
 * to a file (DownloadTask). Upload responses arrive as text, so the server answers with a
 * short-lived link (`?result=link`) instead of the MP4 itself (D-018).
 */
export async function uploadVideo(video: PickedFile, cb: UploadCallbacks): Promise<CleanedVideo> {
  let uploaded = false;
  const task = new UploadTask(new File(video.uri), `${API_URL}/v1/video?result=link`, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType: video.mimeType,
    // iOS: keep the JS promise alive (background sessions outlive the JS task).
    sessionType: 'foreground',
    signal: cb.signal,
    onProgress: ({ bytesSent, totalBytes }) => {
      if (totalBytes > 0) cb.onUploadProgress(Math.min(1, bytesSent / totalBytes));
      if (!uploaded && totalBytes > 0 && bytesSent >= totalBytes) {
        uploaded = true;
        cb.onCleaning();
      }
    },
  });

  let result;
  try {
    result = await task.uploadAsync();
  } catch (e) {
    throw new VideoApiError(isAbort(e) || cb.signal.aborted ? 'cancelled' : 'network');
  } finally {
    task.release();
  }
  if (!uploaded) cb.onCleaning();
  if (result.status !== 200) throw new VideoApiError(codeFromBody(result.body));

  let id = '';
  try {
    id = String((JSON.parse(result.body) as { id?: unknown }).id ?? '');
  } catch {
    // handled below
  }
  if (!JOB_ID.test(id)) throw new VideoApiError('processing_failed');
  if (cb.signal.aborted) {
    forget(id);
    throw new VideoApiError('cancelled');
  }

  const dir = new Directory(Paths.cache, `video-${id}`);
  dir.create({ idempotent: true });
  const name = cleanName(video.name);
  const download = new DownloadTask(`${API_URL}/v1/video/${id}`, new File(dir, name), {
    signal: cb.signal,
  });
  try {
    const file = await download.downloadAsync();
    if (!file) throw new VideoApiError('cancelled');
    return { uri: file.uri, name };
  } catch (e) {
    try {
      if (dir.exists) dir.delete();
    } catch {
      // already gone
    }
    if (e instanceof VideoApiError) {
      forget(id);
      throw e;
    }
    if (isAbort(e) || cb.signal.aborted) {
      forget(id);
      throw new VideoApiError('cancelled');
    }
    // The server answered (e.g. 404: result already gone) vs. no connection at all.
    throw new VideoApiError(/HTTP \d{3}/.test(String(e)) ? 'processing_failed' : 'network');
  } finally {
    download.release();
  }
}

/** Native: delete the downloaded result once it is no longer shown. */
export function releaseVideo(uri: string) {
  try {
    const file = new File(uri);
    const dir = file.parentDirectory;
    if (file.exists) file.delete();
    if (dir.exists && dir.name.startsWith('video-')) dir.delete();
  } catch {
    // Already gone.
  }
}

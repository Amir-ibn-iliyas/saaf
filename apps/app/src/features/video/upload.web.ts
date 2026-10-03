import type { PickedFile } from '@/features/pick/classify';

import { API_URL } from './api';
import { codeFromBody, VideoApiError } from './errors';
import type { CleanedVideo, UploadCallbacks } from './upload';

function cleanName(name: string) {
  const dot = name.lastIndexOf('.');
  return `${dot > 0 ? name.slice(0, dot) : name || 'video'}-clean.mp4`;
}

/** Web: XMLHttpRequest for upload progress; the MP4 comes back directly as a Blob. */
export async function uploadVideo(video: PickedFile, cb: UploadCallbacks): Promise<CleanedVideo> {
  if (cb.signal.aborted) throw new VideoApiError('cancelled');
  // The picked/dropped file is a blob: URL in this page, so this reads it from memory.
  const blob = await (await fetch(video.uri)).blob();
  const form = new FormData();
  form.append('file', new File([blob], video.name, { type: video.mimeType }));

  return new Promise<CleanedVideo>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const onAbort = () => xhr.abort();
    const settle = (fn: () => void) => {
      cb.signal.removeEventListener('abort', onAbort);
      fn();
    };

    xhr.open('POST', `${API_URL}/v1/video`);
    xhr.responseType = 'blob';
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) cb.onUploadProgress(Math.min(1, e.loaded / e.total));
    };
    xhr.upload.onload = () => cb.onCleaning();
    xhr.onload = () => {
      const body = xhr.response as Blob | null;
      if (xhr.status === 200 && body) {
        settle(() => resolve({ uri: URL.createObjectURL(body), name: cleanName(video.name) }));
        return;
      }
      (body ? body.text() : Promise.resolve(''))
        .then((text) => settle(() => reject(new VideoApiError(codeFromBody(text)))))
        .catch(() => settle(() => reject(new VideoApiError('processing_failed'))));
    };
    xhr.onerror = () => settle(() => reject(new VideoApiError('network')));
    xhr.onabort = () => settle(() => reject(new VideoApiError('cancelled')));

    if (cb.signal.aborted) return settle(() => reject(new VideoApiError('cancelled')));
    cb.signal.addEventListener('abort', onAbort, { once: true });
    xhr.send(form);
  });
}

/** Web: free the result's object URL once it is no longer shown. */
export function releaseVideo(uri: string) {
  if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
}

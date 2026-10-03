import { useCallback, useEffect, useRef, useState } from 'react';

import type { PickedFile } from '@/features/pick/classify';

import { VideoApiError, type VideoErrorCode } from './errors';
import { checkVideo } from './limits';
import { releaseVideo, uploadVideo, type CleanedVideo } from './upload';

export type VideoState =
  | { stage: 'uploading'; progress: number }
  | { stage: 'cleaning' }
  | { stage: 'done'; result: CleanedVideo }
  | { stage: 'error'; code: VideoErrorCode };

/**
 * Checks size and length on the device, uploads with progress, waits for the server and
 * gets the cleaned MP4 back. `cancel()` aborts the request; leaving the screen does too.
 */
export function useCleanVideo(video: PickedFile | null) {
  const [state, setState] = useState<VideoState>(() => {
    const problem = video ? checkVideo(video) : null;
    return problem ? { stage: 'error', code: problem } : { stage: 'uploading', progress: 0 };
  });
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!video || checkVideo(video)) return;
    const abort = new AbortController();
    controller.current = abort;
    // Set when this run is cleaned up (screen left, Strict Mode re-run): its late callbacks
    // must not overwrite the state of a newer run.
    let disposed = false;
    let result: CleanedVideo | null = null;
    const update = (next: VideoState) => {
      if (!disposed) setState(next);
    };

    uploadVideo(video, {
      signal: abort.signal,
      onUploadProgress: (progress) => {
        if (!abort.signal.aborted) update({ stage: 'uploading', progress });
      },
      onCleaning: () => {
        if (!abort.signal.aborted) update({ stage: 'cleaning' });
      },
    })
      .then((cleaned) => {
        result = cleaned;
        if (disposed || abort.signal.aborted) releaseVideo(cleaned.uri);
        else update({ stage: 'done', result: cleaned });
      })
      .catch((e: unknown) => {
        const code = e instanceof VideoApiError ? e.code : 'network';
        update({ stage: 'error', code: abort.signal.aborted ? 'cancelled' : code });
      });

    return () => {
      disposed = true;
      abort.abort();
      if (result) releaseVideo(result.uri);
    };
  }, [video]);

  const cancel = useCallback(() => controller.current?.abort(), []);
  return { state, cancel };
}

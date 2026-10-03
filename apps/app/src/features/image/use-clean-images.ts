import { useEffect, useState } from 'react';

import type { PickedFile } from '@/features/pick/classify';

import { cleanImage, type ImageOutcome } from './clean-image';
import { release } from './image-io';

/** Cleans the images one by one (so the UI keeps painting) and returns one entry per image. */
export function useCleanImages(images: PickedFile[]) {
  const [outcomes, setOutcomes] = useState<(ImageOutcome | null)[]>([]);
  const [source, setSource] = useState(images);

  // Reset when a new set of images comes in (render-time state adjustment, no effect).
  if (source !== images) {
    setSource(images);
    setOutcomes([]);
  }

  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    (async () => {
      for (let i = 0; i < images.length; i++) {
        const outcome = await cleanImage(images[i]);
        if (cancelled) {
          if (outcome.status === 'cleaned') release(outcome.uri);
          return;
        }
        if (outcome.status === 'cleaned') created.push(outcome.uri);
        setOutcomes((prev) => {
          const next = prev.slice();
          next[i] = outcome;
          return next;
        });
      }
    })();
    return () => {
      cancelled = true;
      // Free the cleaned outputs (web blob URLs, native cache files) when this set is left.
      created.forEach(release);
    };
  }, [images]);

  const done = outcomes.filter(Boolean).length;
  return { outcomes, done, total: images.length, finished: done === images.length };
}

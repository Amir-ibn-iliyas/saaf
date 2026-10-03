import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { revokeBlobUris, session } from '@/features/session/session';
import { copy, useToast } from '@/ui';

import { classify, type PickNotice, type RawFile } from './classify';
import { pickFiles } from './pick-files';

const NOTICE_TEXT: Record<PickNotice, { message: string; tone: 'info' | 'error' }> = {
  mixed: { message: copy.pick.mixed, tone: 'info' },
  multipleVideos: { message: copy.pick.multipleVideos, tone: 'info' },
  tooMany: { message: copy.pick.tooMany, tone: 'info' },
  unsupported: { message: copy.err.unsupported, tone: 'error' },
};

/** Pick (or drop) → classify → remember in the session → open the right screen. */
export function usePick() {
  const router = useRouter();
  const toast = useToast();
  const [picking, setPicking] = useState(false);

  const handleFiles = useCallback(
    (files: RawFile[]) => {
      const result = classify(files);
      const used = new Set(
        result.route === 'images'
          ? result.images.map((f) => f.uri)
          : result.route === 'video'
            ? [result.video.uri]
            : []
      );
      revokeBlobUris(files.map((f) => f.uri).filter((uri) => !used.has(uri)));

      if (result.notice) {
        const { message, tone } = NOTICE_TEXT[result.notice];
        toast(message, tone);
      }
      if (result.route === 'images') {
        session.setImages(result.images);
        router.push('/result');
      } else if (result.route === 'video') {
        session.setVideo(result.video);
        router.push('/video');
      }
    },
    [router, toast]
  );

  const pick = useCallback(async () => {
    setPicking(true);
    try {
      const files = await pickFiles();
      if (files) handleFiles(files);
    } catch {
      toast(copy.err.pick, 'error');
    } finally {
      setPicking(false);
    }
  }, [handleFiles, toast]);

  return { pick, handleFiles, picking };
}

import { useSyncExternalStore } from 'react';

import type { PickedFile } from '@/features/pick/classify';

/** What the user picked, shared between Home and the Result / Video screens. In memory only. */
export type Session = { images: PickedFile[]; video: PickedFile | null };

let state: Session = { images: [], video: null };
const listeners = new Set<() => void>();

/** Web: picked and dropped files are blob: URLs; free them once nothing uses them. */
export function revokeBlobUris(uris: (string | null | undefined)[]) {
  for (const uri of uris) {
    if (uri?.startsWith('blob:')) URL.revokeObjectURL(uri);
  }
}

function set(next: Session) {
  const keep = new Set([...next.images.map((f) => f.uri), next.video?.uri]);
  revokeBlobUris(
    [...state.images.map((f) => f.uri), state.video?.uri].filter((uri) => !keep.has(uri))
  );
  state = next;
  listeners.forEach((l) => l());
}

export const session = {
  get: () => state,
  setImages: (images: PickedFile[]) => set({ ...state, images }),
  setVideo: (video: PickedFile | null) => set({ ...state, video }),
  clear: () => set({ images: [], video: null }),
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useSession(): Session {
  return useSyncExternalStore(session.subscribe, session.get, session.get);
}

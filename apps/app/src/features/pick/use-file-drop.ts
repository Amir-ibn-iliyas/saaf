import { useRef } from 'react';
import type { View } from 'react-native';

import type { RawFile } from './classify';

/** Drag and drop exists only on web (see use-file-drop.web.ts). */
export function useFileDrop(_onFiles: (files: RawFile[]) => void, _disabled = false) {
  const ref = useRef<View>(null);
  return { ref, dragging: false, supported: false };
}

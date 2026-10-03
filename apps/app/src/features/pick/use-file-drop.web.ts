import { useEffect, useRef, useState } from 'react';
import type { View } from 'react-native';

import type { RawFile } from './classify';

const hasFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes('Files');

/**
 * Web: lets the user drop files on the element behind `ref` (the pick area). Drops anywhere
 * else on the page are swallowed, so a near miss does not make the browser open the file.
 */
export function useFileDrop(onFiles: (files: RawFile[]) => void, disabled = false) {
  const ref = useRef<View>(null);
  const [dragging, setDragging] = useState(false);
  const onFilesRef = useRef(onFiles);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onFilesRef.current = onFiles;
    disabledRef.current = disabled;
  }, [onFiles, disabled]);

  useEffect(() => {
    // On web, a react-native-web View ref is the DOM element.
    const el = ref.current as unknown as HTMLElement | null;
    if (!el) return;
    // dragenter/dragleave fire for every child; count them so the highlight does not flicker.
    let depth = 0;

    const enter = (e: DragEvent) => {
      if (!hasFiles(e) || disabledRef.current) return;
      depth++;
      setDragging(true);
    };
    const over = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const leave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      e.preventDefault();
      depth = 0;
      setDragging(false);
      if (disabledRef.current) return;
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length === 0) return;
      onFilesRef.current(
        files.map((f) => ({ uri: URL.createObjectURL(f), name: f.name, mimeType: f.type, size: f.size }))
      );
    };
    const swallow = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };

    el.addEventListener('dragenter', enter);
    el.addEventListener('dragover', over);
    el.addEventListener('dragleave', leave);
    el.addEventListener('drop', drop);
    window.addEventListener('dragover', swallow);
    window.addEventListener('drop', swallow);
    return () => {
      el.removeEventListener('dragenter', enter);
      el.removeEventListener('dragover', over);
      el.removeEventListener('dragleave', leave);
      el.removeEventListener('drop', drop);
      window.removeEventListener('dragover', swallow);
      window.removeEventListener('drop', swallow);
    };
  }, []);

  return { ref, dragging, supported: true };
}

import { useEffect, useRef, type RefObject } from 'react';
import type { View } from 'react-native';

/** Web: Left/Right (and Down/Up) arrows on the focused element call onStep(-1 / +1). */
export function useArrowKeys(ref: RefObject<View | null>, onStep: (dir: 1 | -1) => void) {
  const onStepRef = useRef(onStep);

  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    // On web, a react-native-web View ref is the DOM element.
    const el = ref.current as unknown as HTMLElement | null;
    if (!el) return;
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onStepRef.current(1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onStepRef.current(-1);
      else return;
      e.preventDefault();
    };
    el.addEventListener('keydown', keydown);
    return () => el.removeEventListener('keydown', keydown);
  }, [ref]);
}

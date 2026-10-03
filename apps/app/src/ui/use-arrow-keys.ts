import type { RefObject } from 'react';
import type { View } from 'react-native';

/** Arrow keys are a web feature (see use-arrow-keys.web.ts). Native uses accessibility actions. */
export function useArrowKeys(_ref: RefObject<View | null>, _onStep: (dir: 1 | -1) => void) {}

import { useWindowDimensions } from 'react-native';

import { layoutFor, type Layout } from './responsive-layout';

export { fitMedia, layoutFor, type Layout, type SizeClass } from './responsive-layout';

/** Live layout for the current window (updates on rotate / browser resize). */
export function useResponsive(): Layout {
  const { width, height } = useWindowDimensions();
  return layoutFor(width, height);
}

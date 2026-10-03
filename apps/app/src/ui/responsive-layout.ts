import { layout as tokens, space } from './theme';

/**
 * Size classes (same breakpoints on iOS, Android and web):
 *  - compact: small phones (< 360 px wide) or very short screens (< 640 px tall)
 *  - phone:   normal phones
 *  - tablet:  ≥ 600 px wide (tablets in portrait, large foldables, narrow browser windows)
 *  - desktop: ≥ 1024 px wide (tablets in landscape, laptops, desktop browsers)
 */
export type SizeClass = 'compact' | 'phone' | 'tablet' | 'desktop';

export type Layout = {
  sizeClass: SizeClass;
  width: number;
  height: number;
  /** Side padding of the content column. */
  gutter: number;
  /** Max width of a single content column. */
  columnWidth: number;
  /** Max width of both columns together when `split`. */
  splitWidth: number;
  /** Media left, actions right (result and video screens) instead of one column. */
  split: boolean;
  /** Screen title font size (Unbounded). */
  titleSize: number;
  /** Home pick area height. */
  pickHeight: number;
  /** Tallest a photo/video may be so the actions stay on screen. */
  mediaMaxHeight: number;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Pure, so it can be unit-tested; `useResponsive` feeds it the live window size. */
export function layoutFor(width: number, height: number): Layout {
  const sizeClass: SizeClass =
    width >= 1024 ? 'desktop' : width >= 600 ? 'tablet' : width < 360 || height < 640 ? 'compact' : 'phone';

  const gutter = { compact: space.lg, phone: space.xl, tablet: space.xxl, desktop: space.xxl + space.sm }[
    sizeClass
  ];
  // Side-by-side only when there is room for a real media column and a readable action column.
  const split = sizeClass === 'desktop' && height >= 560;
  const columnWidth = sizeClass === 'tablet' || sizeClass === 'desktop' ? 560 : tokens.maxContentWidth;
  const splitWidth = 1040;
  const titleSize = { compact: 22, phone: 28, tablet: 32, desktop: 32 }[sizeClass];
  const pickHeight = Math.round(clamp(height * 0.32, 180, 340));
  // Single column: leave room for the header and a two-button footer (~300 px). Split: most of
  // the height, since the actions sit beside the media.
  const mediaMaxHeight = Math.round(split ? clamp(height - 2 * space.xxl - 120, 320, 900) : clamp(height - 300, 200, 760));

  return { sizeClass, width, height, gutter, columnWidth, splitWidth, split, titleSize, pickHeight, mediaMaxHeight };
}

/** Fits a media box of this aspect ratio into the available width and the layout's max height. */
export function fitMedia(aspectRatio: number, availableWidth: number, maxHeight: number) {
  const width = Math.min(availableWidth, maxHeight * aspectRatio);
  return { width, height: width / aspectRatio };
}

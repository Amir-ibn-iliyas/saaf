import type { SaveResult, Shareable } from './save';

/** Web: "Download" — a link click with the "<original>-clean.<ext>" file name. */
export async function saveMedia(item: Shareable): Promise<SaveResult> {
  try {
    const link = document.createElement('a');
    link.href = item.uri;
    link.download = item.name;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return 'saved';
  } catch {
    return 'failed';
  }
}

export const saveImage = saveMedia;

async function asFile(item: Shareable): Promise<File> {
  const blob = await (await fetch(item.uri)).blob();
  return new File([blob], item.name, { type: item.mimeType });
}

/** Web Share with files exists on most phones and some desktops; hide the button elsewhere. */
export function canShare(mimeType = 'image/png'): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [new File([], 'x', { type: mimeType })] })
  );
}

/** False only when sharing failed; closing the share sheet is not an error. */
export async function shareMedia(item: Shareable): Promise<boolean> {
  try {
    await navigator.share({ files: [await asFile(item)] });
    return true;
  } catch (e) {
    return e instanceof DOMException && e.name === 'AbortError';
  }
}

export const shareImage = shareMedia;

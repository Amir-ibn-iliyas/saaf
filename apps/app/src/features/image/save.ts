import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export type SaveResult = 'saved' | 'permission_denied' | 'failed';

/** Anything we can save or share: a cleaned photo or video file. */
export type Shareable = { uri: string; name: string; mimeType: string };

/** Android / iOS: "Save to gallery". Asks only for write access to photos or videos. */
export async function saveMedia(item: Shareable): Promise<SaveResult> {
  try {
    const kind = item.mimeType.startsWith('video/') ? 'video' : 'photo';
    const permission = await requestPermissionsAsync(true, [kind]);
    if (!permission.granted) return 'permission_denied';
    await Asset.create(item.uri);
    return 'saved';
  } catch {
    return 'failed';
  }
}

export const saveImage = saveMedia;

export function canShare(_mimeType?: string): boolean {
  return true;
}

/** Android / iOS: system share sheet with the cleaned file. False if sharing failed. */
export async function shareMedia(item: Shareable): Promise<boolean> {
  try {
    if (!(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(item.uri, { mimeType: item.mimeType, dialogTitle: item.name });
    return true;
  } catch {
    return false;
  }
}

export const shareImage = shareMedia;

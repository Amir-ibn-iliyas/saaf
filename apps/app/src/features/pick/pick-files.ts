import * as ImagePicker from 'expo-image-picker';

import { MAX_IMAGES, type RawFile } from './classify';

/** Opens the system picker for photos and videos. Returns null when the user cancels. */
export async function pickFiles(): Promise<RawFile[] | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: true,
    selectionLimit: MAX_IMAGES,
    // Keep the original bytes: no re-encoding, no editing.
    quality: 1,
    allowsEditing: false,
  });
  if (result.canceled) return null;
  return result.assets.map((a) => ({
    uri: a.uri,
    name: a.fileName ?? a.file?.name ?? null,
    mimeType: a.mimeType ?? a.file?.type ?? null,
    size: a.fileSize ?? a.file?.size ?? null,
    durationMs: a.duration ?? null,
  }));
}

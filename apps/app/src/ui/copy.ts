/** App copy from design/DESIGN.md. Keep the two in sync. */
export const copy = {
  home: {
    title: 'Clean your AI photos and videos',
    pick: 'Choose photos or a video',
    formats: 'JPG, PNG, WebP, MP4, MOV',
    drop: 'or drop files here',
    privacy:
      'Photos are cleaned on your device. Videos are processed on our server and deleted right after.',
    button: 'Choose files',
    about: 'About',
  },
  pick: {
    mixed: 'Cleaning your photos now. Pick the video on its own afterwards.',
    multipleVideos: 'One video at a time. Cleaning the first one.',
    tooMany: 'Up to 20 photos at a time. Cleaning the first 20.',
  },
  state: {
    cleaning: 'Cleaning…',
    uploading: (n: number) => `Uploading ${n}%`,
    cleaningVideo: 'Cleaning video…',
  },
  result: {
    chip: 'Watermark removed',
    save: 'Save to gallery',
    download: 'Download',
    saveAll: 'Save all',
    downloadAll: 'Download all',
    share: 'Share',
    again: 'Clean another',
  },
  slider: {
    label: 'Compare before and after',
    after: 'After',
    before: 'Before',
    value: (percent: number) => `${percent}% after`,
  },
  toast: { saved: 'Saved to gallery' },
  err: {
    no_watermark: "No Gemini watermark found in this file. It's unchanged.",
    too_large: 'This video is over 100 MB. Export a smaller version and try again.',
    too_long: 'Videos up to 60 seconds are supported. Trim it and try again.',
    too_big_resolution: 'Videos up to 1080p are supported. Export a smaller version and try again.',
    rate_limited: "You've cleaned 10 videos this hour. Try again later.",
    unsupported: "This file type isn't supported. Use JPG, PNG, WebP, MP4 or MOV.",
    network: "Can't reach the server. Check your connection and try again.",
    permission: 'Allow photo access in Settings to save files to your gallery.',
    pick: "Couldn't open your photos. Try again.",
    save_failed: "Couldn't save the photo. Check your storage space and try again.",
    save_partial: (saved: number, total: number) =>
      `Saved ${saved} of ${total}. Check your storage space and try again.`,
    share_failed: "Couldn't open sharing. Save the photo and share it from your gallery.",
    provenance_unsupported:
      "This WebP file has Content Credentials we can't keep yet. Save it as PNG or JPG and try again.",
    save_video_failed: "Couldn't save the video. Check your storage space and try again.",
    share_video_failed: "Couldn't open sharing. Save the video and share it from your gallery.",
    clean_video_failed: "Couldn't clean this video. Try again in a minute.",
    clean_failed: "Couldn't clean this photo. Try again or pick another one.",
  },
  video: {
    uploading: 'Uploading',
    cleaning: 'Cleaning',
    done: 'Done',
    keepOpen:
      "Keep the app open. Your video is deleted from the server right after it's sent back, or within 15 minutes at most.",
    cancel: 'Cancel',
    seconds: (s: number) => `${Math.round(s)} seconds`,
  },
  about: {
    theme: 'Theme',
    synthid:
      "Saaf removes only the visible logo. Google's invisible SynthID watermark stays in the file.",
  },
} as const;

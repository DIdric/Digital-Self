export type MediaDetection = {
  type: "linkedin" | "youtube" | "vimeo" | "download";
  url: string;
  videoId?: string;
  filename?: string;
} | null;

const LINKEDIN_RE = /https?:\/\/(?:www\.)?linkedin\.com\/\S+/i;
const YOUTUBE_RE = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i;
const VIMEO_RE = /https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i;
const GDRIVE_RE = /https?:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)\S+/i;
const DIRECT_FILE_RE = /https?:\/\/\S+\.(?:pdf|pptx?|docx?|xlsx?)(?:\?\S*)?/i;

function extractFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && /\.\w+$/.test(last)) return decodeURIComponent(last);
  } catch { /* ignore */ }
  return "Case Study";
}

export function detectMedia(text: string): MediaDetection {
  const yt = text.match(YOUTUBE_RE);
  if (yt) return { type: "youtube", url: yt[0], videoId: yt[1] };

  const vim = text.match(VIMEO_RE);
  if (vim) return { type: "vimeo", url: vim[0], videoId: vim[1] };

  const li = text.match(LINKEDIN_RE);
  if (li) return { type: "linkedin", url: li[0] };

  const gd = text.match(GDRIVE_RE);
  if (gd) return { type: "download", url: gd[0], filename: "Case Study" };

  const df = text.match(DIRECT_FILE_RE);
  if (df) return { type: "download", url: df[0], filename: extractFilename(df[0]) };

  return null;
}

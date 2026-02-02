export type MediaDetection = {
  type: "linkedin" | "youtube" | "vimeo";
  url: string;
  videoId?: string;
} | null;

const LINKEDIN_RE = /https?:\/\/(?:www\.)?linkedin\.com\/\S+/i;
const YOUTUBE_RE = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i;
const VIMEO_RE = /https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i;

export function detectMedia(text: string): MediaDetection {
  const yt = text.match(YOUTUBE_RE);
  if (yt) return { type: "youtube", url: yt[0], videoId: yt[1] };

  const vim = text.match(VIMEO_RE);
  if (vim) return { type: "vimeo", url: vim[0], videoId: vim[1] };

  const li = text.match(LINKEDIN_RE);
  if (li) return { type: "linkedin", url: li[0] };

  return null;
}

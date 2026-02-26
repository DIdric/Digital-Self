export type StructuredItem =
  | { type: "idea"; text: string }
  | { type: "slide"; title: string }
  | { type: "video"; url: string; title?: string }
  | { type: "connect" }
  | { type: "email"; subject: string; body: string };

const IDEA_RE = /\[IDEA:\s*(.+?)\]/gi;
const SLIDE_RE = /\[SLIDE:\s*(.+?)\]/gi;
// [VIDEO: url] or [VIDEO: url | optional title]
const VIDEO_RE = /\[VIDEO:\s*(https?:\/\/[^\]|]+?)(?:\s*\|\s*([^\]]+?))?\]/gi;
const CONNECT_RE = /\[CONNECT\]/i;
// [EMAIL: subject | body]
const EMAIL_RE = /\[EMAIL:\s*([^\]|]+?)\s*\|\s*([^\]]+?)\]/i;

/** Parse [IDEA:], [SLIDE:], [VIDEO:], and [CONNECT] tags from agent response text. */
export function detectStructured(text: string): StructuredItem[] {
  const items: StructuredItem[] = [];

  let match: RegExpExecArray | null;

  IDEA_RE.lastIndex = 0;
  while ((match = IDEA_RE.exec(text)) !== null) {
    items.push({ type: "idea", text: match[1].trim() });
  }

  SLIDE_RE.lastIndex = 0;
  while ((match = SLIDE_RE.exec(text)) !== null) {
    items.push({ type: "slide", title: match[1].trim() });
  }

  VIDEO_RE.lastIndex = 0;
  while ((match = VIDEO_RE.exec(text)) !== null) {
    items.push({
      type: "video",
      url: match[1].trim(),
      title: match[2]?.trim(),
    });
  }

  if (CONNECT_RE.test(text)) {
    items.push({ type: "connect" });
  }

  const emailMatch = EMAIL_RE.exec(text);
  if (emailMatch) {
    items.push({ type: "email", subject: emailMatch[1].trim(), body: emailMatch[2].trim() });
  }

  return items;
}

/** Strip all structured tags from text for clean display/TTS. */
export function stripStructuredTags(text: string): string {
  return text
    .replace(/\[IDEA:\s*.+?\]/gi, "")
    .replace(/\[SLIDE:\s*.+?\]/gi, "")
    .replace(/\[VIDEO:\s*https?:\/\/[^\]]+?\]/gi, "")
    .replace(/\[CONNECT\]/gi, "")
    .replace(/\[EMAIL:\s*[^\]]+?\]/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

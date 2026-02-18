export type StructuredItem =
  | { type: "idea"; text: string }
  | { type: "slide"; title: string }
  | { type: "connect" };

const IDEA_RE = /\[IDEA:\s*(.+?)\]/gi;
const SLIDE_RE = /\[SLIDE:\s*(.+?)\]/gi;
const CONNECT_RE = /\[CONNECT\]/i;

/** Parse [IDEA:], [SLIDE:], and [CONNECT] tags from agent response text. */
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

  if (CONNECT_RE.test(text)) {
    items.push({ type: "connect" });
  }

  return items;
}

/** Strip [IDEA:], [SLIDE:], and [CONNECT] tags from text for clean display/TTS. */
export function stripStructuredTags(text: string): string {
  return text
    .replace(/\[IDEA:\s*.+?\]/gi, "")
    .replace(/\[SLIDE:\s*.+?\]/gi, "")
    .replace(/\[CONNECT\]/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

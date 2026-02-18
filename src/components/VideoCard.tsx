"use client";

interface VideoCardProps {
  url: string;
  title?: string;
}

/** Extract a Vimeo embed URL from a Vimeo link. */
function vimeoEmbedUrl(url: string): string | null {
  // Matches: vimeo.com/123456789 or vimeo.com/channels/x/123456789 etc.
  const match = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
  if (!match) return null;
  return `https://player.vimeo.com/video/${match[1]}?autoplay=0&color=04818f&title=0&byline=0&portrait=0`;
}

/** Extract a YouTube embed URL from a YouTube link. */
function youtubeEmbedUrl(url: string): string | null {
  // Matches: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0`;
}

export default function VideoCard({ url, title }: VideoCardProps) {
  const embedUrl = vimeoEmbedUrl(url) ?? youtubeEmbedUrl(url);

  // Fallback: just a link card if we can't make an embed URL
  if (!embedUrl) {
    return (
      <div className="animate-[slide-in_300ms_ease-out] w-full max-w-[480px]">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-[#04818f] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-white text-sm hover:underline truncate">
            {title ?? "Watch video"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-[slide-in_300ms_ease-out] w-full max-w-[480px]">
      <div className="bg-[#1a1a1a] border border-[#04818f]/40 rounded-lg overflow-hidden">
        {title && (
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <svg className="w-4 h-4 text-[#04818f] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span className="text-white/70 text-xs truncate">{title}</span>
          </div>
        )}
        {/* 16:9 responsive embed */}
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={title ?? "Video"}
          />
        </div>
      </div>
    </div>
  );
}

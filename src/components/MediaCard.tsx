"use client";

import { useState } from "react";
import type { MediaDetection } from "@/lib/detectMedia";
import VideoModal from "./VideoModal";

interface MediaCardProps {
  media: NonNullable<MediaDetection>;
}

export default function MediaCard({ media }: MediaCardProps) {
  const [showVideo, setShowVideo] = useState(false);

  if (media.type === "linkedin") {
    return (
      <a
        href={media.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block animate-[slide-in_300ms_ease-out] max-w-[320px]"
      >
        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 hover:border-[#04818f]/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            {/* LinkedIn icon */}
            <svg
              className="w-5 h-5 text-[#0a66c2] shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
              LinkedIn
            </span>
          </div>
          <p className="text-white text-sm truncate">{media.url}</p>
          <p className="text-[#04818f] text-xs mt-2">View on LinkedIn &rarr;</p>
        </div>
      </a>
    );
  }

  if (media.type === "download") {
    return (
      <a
        href={media.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block animate-[slide-in_300ms_ease-out] max-w-[320px]"
      >
        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 hover:border-[#04818f]/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            {/* Download / document icon */}
            <svg
              className="w-5 h-5 text-[#04818f] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9 15 12 18 15 15" />
            </svg>
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
              Case Study
            </span>
          </div>
          <p className="text-white text-sm truncate">{media.filename || "Download"}</p>
          <p className="text-[#04818f] text-xs mt-2">View document &rarr;</p>
        </div>
      </a>
    );
  }

  // YouTube or Vimeo
  return (
    <>
      <button
        onClick={() => setShowVideo(true)}
        className="animate-[slide-in_300ms_ease-out] max-w-[320px] w-full text-left cursor-pointer"
      >
        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 hover:border-[#04818f]/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            {/* Play icon */}
            <svg
              className="w-5 h-5 text-red-500 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
              {media.type === "youtube" ? "YouTube" : "Vimeo"}
            </span>
          </div>
          <p className="text-white text-sm">Watch Case Study</p>
          <p className="text-[#04818f] text-xs mt-2">Click to play &rarr;</p>
        </div>
      </button>

      {showVideo && media.videoId && (
        <VideoModal
          type={media.type as "youtube" | "vimeo"}
          videoId={media.videoId}
          onClose={() => setShowVideo(false)}
        />
      )}
    </>
  );
}

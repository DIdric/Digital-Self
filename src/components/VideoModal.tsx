"use client";

import { useEffect } from "react";

interface VideoModalProps {
  type: "youtube" | "vimeo";
  videoId: string;
  onClose: () => void;
}

export default function VideoModal({ type, videoId, onClose }: VideoModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const src =
    type === "youtube"
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1`
      : `https://player.vimeo.com/video/${videoId}?autoplay=1`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-[fade-in_200ms_ease-out]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-[90vw] max-w-[900px] animate-[slide-in_300ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white text-2xl cursor-pointer"
        >
          &#x2715;
        </button>

        {/* 16:9 responsive iframe */}
        <div className="relative w-full pb-[56.25%] rounded-lg overflow-hidden bg-black">
          <iframe
            src={src}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

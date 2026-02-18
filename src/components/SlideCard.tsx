"use client";

interface SlideCardProps {
  title: string;
  slideNumber: number;
  totalSlides: number;
}

export default function SlideCard({ title, slideNumber, totalSlides }: SlideCardProps) {
  return (
    <div className="animate-[slide-in_300ms_ease-out] w-full max-w-[480px]">
      <div className="bg-[#1a1a1a] border border-[#04818f]/40 rounded-lg px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          {/* Presentation icon */}
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[#04818f] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            <span className="text-[#04818f] text-xs font-medium uppercase tracking-wider">
              Pitch
            </span>
          </div>
          <span className="text-white/30 text-xs">
            {slideNumber} / {totalSlides}
          </span>
        </div>

        {/* Slide progress bar */}
        <div className="w-full h-0.5 bg-white/10 rounded-full mb-4">
          <div
            className="h-full bg-[#04818f] rounded-full transition-all duration-500"
            style={{ width: `${(slideNumber / totalSlides) * 100}%` }}
          />
        </div>

        <h3 className="text-white text-lg font-semibold leading-snug">{title}</h3>
      </div>
    </div>
  );
}

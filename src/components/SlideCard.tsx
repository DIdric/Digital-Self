"use client";

import { useCallback } from "react";

interface Slide {
  title: string;
  body?: string;
}

interface SlideCardProps {
  slides: Slide[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export default function SlideCard({ slides, currentIndex, onNavigate }: SlideCardProps) {
  const total = slides.length;
  const slide = slides[currentIndex];

  const prev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  const next = useCallback(() => {
    if (currentIndex < total - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, total, onNavigate]);

  return (
    <div className="animate-[slide-in_300ms_ease-out] w-full max-w-[480px]">
      <div className="bg-[#1a1a1a] border border-[#04818f]/40 rounded-lg px-6 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
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
          <span className="text-white/30 text-xs">{currentIndex + 1} / {total}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-0.5 bg-white/10 rounded-full mb-4">
          <div
            className="h-full bg-[#04818f] rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>

        {/* Slide title */}
        <h3 className="text-white text-lg font-semibold leading-snug mb-2">{slide.title}</h3>

        {/* Slide body — only shown when the agent includes body text */}
        {slide.body && (
          <p className="text-white/60 text-sm leading-relaxed mb-4">{slide.body}</p>
        )}

        {/* Navigation arrows — only shown when there's more than one slide */}
        {total > 1 && (
          <div className={`flex items-center justify-between ${slide.body ? "" : "mt-3"}`}>
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              aria-label="Previous slide"
              className="flex items-center gap-1.5 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Prev
            </button>

            {/* Dot indicators */}
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIndex ? "bg-[#04818f] w-3" : "bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              disabled={currentIndex === total - 1}
              aria-label="Next slide"
              className="flex items-center gap-1.5 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Next
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

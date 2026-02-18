"use client";

interface IdeaCardProps {
  text: string;
  index: number;
}

export default function IdeaCard({ text, index }: IdeaCardProps) {
  return (
    <div
      className="animate-[slide-in_300ms_ease-out] w-full max-w-[480px]"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 flex items-start gap-3">
        {/* Lightbulb icon */}
        <svg
          className="w-4 h-4 text-[#04818f] shrink-0 mt-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L15 17H9l-.7-2C6.3 13.7 5 11.5 5 9a7 7 0 0 1 7-7z" />
        </svg>
        <p className="text-white text-sm leading-snug">{text}</p>
      </div>
    </div>
  );
}

"use client";

interface TopicBubblesProps {
  topics: string[];
  onSelect: (topic: string) => void;
  externalLink?: { label: string; href: string };
}

export default function TopicBubbles({ topics, onSelect, externalLink }: TopicBubblesProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {externalLink && (
        <a
          href={externalLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm rounded-full border border-[#04818f] text-white bg-[#04818f] hover:bg-[#03707c] transition-colors cursor-pointer"
        >
          {externalLink.label}
        </a>
      )}
      {topics.map((topic) => (
        <button
          key={topic}
          onClick={() => onSelect(topic)}
          className="px-3 py-1.5 text-sm rounded-full border border-white/30 text-white/80 hover:border-white hover:text-white backdrop-blur-sm transition-colors cursor-pointer"
        >
          {topic}
        </button>
      ))}
    </div>
  );
}

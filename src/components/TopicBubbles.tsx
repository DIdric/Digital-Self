"use client";

interface TopicBubblesProps {
  topics: string[];
  onSelect: (topic: string) => void;
}

export default function TopicBubbles({ topics, onSelect }: TopicBubblesProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
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

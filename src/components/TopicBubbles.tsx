"use client";

interface TopicBubblesProps {
  topics: string[];
  onSelect: (topic: string) => void;
  disabled?: boolean;
}

export default function TopicBubbles({ topics, onSelect, disabled }: TopicBubblesProps) {
  if (disabled) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {topics.map((topic) => (
        <button
          key={topic}
          onClick={() => onSelect(topic)}
          className="px-3 py-1.5 text-sm rounded-full border border-zinc-700 text-zinc-300 hover:border-indigo-500 hover:text-white transition-colors cursor-pointer"
        >
          {topic}
        </button>
      ))}
    </div>
  );
}

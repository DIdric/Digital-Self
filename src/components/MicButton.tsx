"use client";

type Status = "idle" | "connecting" | "listening" | "speaking";

interface MicButtonProps {
  status: Status;
  onClick: () => void;
}

const statusConfig: Record<Status, { bg: string; ring: string; label: string }> = {
  idle: { bg: "bg-zinc-700", ring: "", label: "Start conversation" },
  connecting: { bg: "bg-yellow-600", ring: "animate-pulse", label: "Connecting..." },
  listening: { bg: "bg-green-600", ring: "", label: "Listening... tap to end" },
  speaking: { bg: "bg-indigo-600", ring: "", label: "Speaking... tap to end" },
};

export default function MicButton({ status, onClick }: MicButtonProps) {
  const { bg, ring, label } = statusConfig[status];
  const isActive = status === "listening" || status === "speaking";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onClick}
        className={`relative w-16 h-16 rounded-full ${bg} ${ring} flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer`}
        aria-label={label}
      >
        {isActive && (
          <span
            className="absolute inset-0 rounded-full border-2 border-current opacity-40"
            style={{ animation: "pulse-ring 1.5s ease-out infinite" }}
          />
        )}
        {isActive ? (
          // Stop icon
          <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
            <rect x="4" y="4" width="12" height="12" rx="2" />
          </svg>
        ) : (
          // Mic icon
          <svg width="20" height="28" viewBox="0 0 20 28" fill="white">
            <rect x="5" y="1" width="10" height="17" rx="5" />
            <path
              d="M2 13a8 8 0 0016 0"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
            <line x1="10" y1="23" x2="10" y2="27" stroke="white" strokeWidth="2" />
            <line x1="6" y1="27" x2="14" y2="27" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}

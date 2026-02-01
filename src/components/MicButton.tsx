"use client";

type Status = "idle" | "connecting" | "listening" | "speaking";

interface MicButtonProps {
  status: Status;
  onClick: () => void;
}

export default function MicButton({ status, onClick }: MicButtonProps) {
  const isActive = status === "listening" || status === "speaking";
  const isConnecting = status === "connecting";

  return (
    <button
      onClick={onClick}
      className={`relative w-16 h-16 rounded-full bg-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${isConnecting ? "animate-pulse" : ""}`}
      aria-label={
        isActive
          ? "End conversation"
          : isConnecting
            ? "Connecting..."
            : "Start conversation"
      }
    >
      {isActive && (
        <span
          className="absolute inset-0 rounded-full border-2 border-[#04818f] opacity-40"
          style={{ animation: "pulse-ring 1.5s ease-out infinite" }}
        />
      )}
      {isActive ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="#04818f">
          <rect x="4" y="4" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg width="18" height="28" viewBox="0 0 18 28" fill="none">
          <rect x="4" y="0" width="10" height="17" rx="5" fill="#04818f" />
          <path d="M1 13a8 8 0 0016 0" stroke="#04818f" strokeWidth="2" />
          <line x1="9" y1="22" x2="9" y2="26" stroke="#04818f" strokeWidth="2" />
          <line x1="5" y1="26" x2="13" y2="26" stroke="#04818f" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

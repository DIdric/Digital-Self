"use client";

type Status = "idle" | "connecting" | "listening" | "speaking";

const config: Record<Status, { color: string; label: string }> = {
  idle: { color: "bg-zinc-600", label: "Ready" },
  connecting: { color: "bg-yellow-500 animate-pulse", label: "Connecting" },
  listening: { color: "bg-green-500", label: "Listening" },
  speaking: { color: "bg-indigo-500", label: "Speaking" },
};

export default function StatusIndicator({ status }: { status: Status }) {
  const { color, label } = config[status];

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}

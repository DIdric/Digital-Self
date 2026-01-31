"use client";

import { useState, useCallback, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import Waveform from "./Waveform";
import MicButton from "./MicButton";
import TopicBubbles from "./TopicBubbles";
import StatusIndicator from "./StatusIndicator";

type AppStatus = "idle" | "connecting" | "listening" | "speaking";

const TOPICS = [
  "What's the DOSE framework?",
  "How do you think about loyalty?",
  "Tell me about your background",
  "What are you working on now?",
];

export default function ConversationPanel() {
  const [appStatus, setAppStatus] = useState<AppStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const conversationRef = useRef<ReturnType<typeof useConversation>>(null);

  const conversation = useConversation({
    onConnect: () => {
      setAppStatus("listening");
      setError(null);
    },
    onDisconnect: () => {
      setAppStatus("idle");
    },
    onError: (message: string) => {
      setError(message || "Connection error");
      setAppStatus("idle");
    },
    onModeChange: (mode: { mode: string }) => {
      if (mode.mode === "speaking") {
        setAppStatus("speaking");
      } else if (mode.mode === "listening") {
        setAppStatus("listening");
      }
    },
  });

  // Store ref for waveform access
  conversationRef.current = conversation;

  const startConversation = useCallback(async () => {
    setError(null);
    setAppStatus("connecting");

    try {
      const res = await fetch("/api/get-signed-url");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to connect (${res.status})`);
      }
      const { signedUrl } = await res.json();
      await conversation.startSession({ signedUrl });
      setHasStarted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start";
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("microphone")) {
        setError("Microphone access is required. Please allow mic permissions and try again.");
      } else {
        setError(msg);
      }
      setAppStatus("idle");
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setAppStatus("idle");
  }, [conversation]);

  const handleMicClick = useCallback(() => {
    if (appStatus === "idle") {
      startConversation();
    } else if (appStatus !== "connecting") {
      stopConversation();
    }
  }, [appStatus, startConversation, stopConversation]);

  const handleTopicSelect = useCallback(
    async (topic: string) => {
      if (appStatus === "idle") {
        await startConversation();
        // Small delay to let connection establish before sending
        setTimeout(() => {
          conversation.sendUserMessage(topic);
        }, 500);
      } else {
        conversation.sendUserMessage(topic);
      }
      setHasStarted(true);
    },
    [appStatus, conversation, startConversation]
  );

  const handleTextSend = useCallback(() => {
    const msg = textInput.trim();
    if (!msg) return;

    if (appStatus === "idle") {
      startConversation().then(() => {
        setTimeout(() => conversation.sendUserMessage(msg), 500);
      });
    } else {
      conversation.sendUserMessage(msg);
    }
    setTextInput("");
    setHasStarted(true);
  }, [textInput, appStatus, conversation, startConversation]);

  const getFreqData = useCallback((): Uint8Array => {
    if (!conversationRef.current) return new Uint8Array(0);
    if (appStatus === "speaking") {
      return conversationRef.current.getOutputByteFrequencyData() ?? new Uint8Array(0);
    }
    return conversationRef.current.getInputByteFrequencyData() ?? new Uint8Array(0);
  }, [appStatus]);

  const isActive = appStatus !== "idle" && appStatus !== "connecting";
  const waveColor = appStatus === "speaking" ? "#6366f1" : "#22c55e";

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <StatusIndicator status={appStatus} />

      <Waveform
        getFrequencyData={isActive ? getFreqData : null}
        isActive={isActive}
        color={waveColor}
      />

      <MicButton status={appStatus} onClick={handleMicClick} />

      {error && (
        <p className="text-red-400 text-sm text-center px-4">{error}</p>
      )}

      <TopicBubbles
        topics={TOPICS}
        onSelect={handleTopicSelect}
        disabled={hasStarted}
      />

      {/* Text input fallback */}
      <div className="flex w-full gap-2 mt-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleTextSend()}
          placeholder="Or type a message..."
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          onClick={handleTextSend}
          disabled={!textInput.trim()}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  );
}

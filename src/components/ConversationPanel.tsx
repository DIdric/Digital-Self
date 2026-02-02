"use client";

import { useState, useCallback, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import Waveform from "./Waveform";
import MicButton from "./MicButton";
import TopicBubbles from "./TopicBubbles";
import StatusIndicator from "./StatusIndicator";
import MediaCard from "./MediaCard";
import { detectMedia, type MediaDetection } from "@/lib/detectMedia";

type AppStatus = "idle" | "connecting" | "listening" | "speaking";

const TOPICS = [
  "How do you think about loyalty?",
  "Tell me about your background",
  "What are you working on now?",
];

const DOSE_LINK = "https://www.dose.didric.nl";

interface ConversationPanelProps {
  onConversationStart?: () => void;
}

export default function ConversationPanel({ onConversationStart }: ConversationPanelProps) {
  const [appStatus, setAppStatus] = useState<AppStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [activeMedia, setActiveMedia] = useState<NonNullable<MediaDetection> | null>(null);
  const conversationRef = useRef<ReturnType<typeof useConversation>>(null);

  const markStarted = useCallback(() => {
    setHasStarted(true);
    onConversationStart?.();
  }, [onConversationStart]);

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
    onMessage: (message: { message: string; source: string }) => {
      // Scan agent messages for rich media URLs
      if (message.source === "ai") {
        const media = detectMedia(message.message);
        if (media) {
          setActiveMedia(media);
        }
      }
    },
  });

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
      markStarted();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start";
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("microphone")) {
        setError("Microphone access is required. Please allow mic permissions and try again.");
      } else {
        setError(msg);
      }
      setAppStatus("idle");
    }
  }, [conversation, markStarted]);

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
        setTimeout(() => {
          conversation.sendUserMessage(topic);
        }, 500);
      } else {
        conversation.sendUserMessage(topic);
      }
      markStarted();
    },
    [appStatus, conversation, startConversation, markStarted]
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
    markStarted();
  }, [textInput, appStatus, conversation, startConversation, markStarted]);

  const getFreqData = useCallback((): Uint8Array => {
    if (!conversationRef.current) return new Uint8Array(0);
    if (appStatus === "speaking") {
      return conversationRef.current.getOutputByteFrequencyData() ?? new Uint8Array(0);
    }
    return conversationRef.current.getInputByteFrequencyData() ?? new Uint8Array(0);
  }, [appStatus]);

  const isActive = appStatus !== "idle" && appStatus !== "connecting";
  const waveColor = appStatus === "speaking" ? "#04818f" : "#ffffff";

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Media card overlay */}
      {activeMedia && (
        <div className="w-full flex justify-center mb-2">
          <MediaCard media={activeMedia} />
        </div>
      )}

      {/* Status + Waveform only when active */}
      {isActive && (
        <>
          <StatusIndicator status={appStatus} />
          <Waveform
            getFrequencyData={getFreqData}
            isActive={isActive}
            color={waveColor}
          />
        </>
      )}

      {/* Mic button */}
      <MicButton status={appStatus} onClick={handleMicClick} />

      {error && (
        <p className="text-red-300 text-sm text-center px-4">{error}</p>
      )}

      {/* Topic bubbles only before conversation starts */}
      {!hasStarted && (
        <TopicBubbles
          topics={TOPICS}
          onSelect={handleTopicSelect}
          externalLink={{ label: "Take the DOSE scan", href: DOSE_LINK }}
        />
      )}

      {/* Text input */}
      <div className="flex w-full gap-2.5">
        <div className="flex flex-1">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTextSend()}
            placeholder="Or type a message..."
            className="w-full bg-white border border-white rounded-lg px-6 py-5 text-sm text-[#5c5c5c] placeholder-[#5c5c5c] focus:outline-none transition-colors"
          />
        </div>
        <button
          onClick={handleTextSend}
          disabled={!textInput.trim()}
          className="px-6 py-5 bg-[#04818f] text-white text-sm font-bold rounded-lg hover:bg-[#03707c] disabled:opacity-100 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SimliClient, SimliClientConfig } from "simli-client";
import ConversationPanelWithAvatar from "@/components/ConversationPanelWithAvatar";

const GREETING =
  "Hey! Welcome my digital self—always available, never needs coffee. I'm Didric, ask me anything.";

export default function Home() {
  const [started, setStarted] = useState(false);
  const [simliConfig, setSimliConfig] = useState<{ apiKey: string; faceId: string } | null>(null);
  const [simliClient, setSimliClient] = useState<SimliClient | null>(null);
  const [simliReady, setSimliReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch Simli config on mount
  useEffect(() => {
    fetch("/api/simli-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.apiKey && data.faceId) {
          setSimliConfig(data);
        }
      })
      .catch(console.error);
  }, []);

  // Initialize Simli when config and refs are ready
  useEffect(() => {
    if (!simliConfig || !videoRef.current || !audioRef.current || simliClient) {
      return;
    }

    const client = new SimliClient();

    const config: SimliClientConfig = {
      apiKey: simliConfig.apiKey,
      faceID: simliConfig.faceId,
      handleSilence: true,
      maxSessionLength: 3600,
      maxIdleTime: 600,
      session_token: "",
      videoRef: videoRef.current,
      audioRef: audioRef.current,
      enableConsoleLogs: true,
      SimliURL: "https://api.simli.ai",
      maxRetryAttempts: 100,
      retryDelay_ms: 2000,
      videoReceivedTimeout: 15000,
      enableSFU: true,
      model: "fasttalk",
    };

    client.Initialize(config);

    client.on("connected", () => {
      console.log("[Simli] Connected - avatar ready");
      setSimliReady(true);
    });

    client.on("failed", (reason: string) => {
      console.error("[Simli] Failed:", reason);
    });

    client.start().catch((err) => {
      console.error("[Simli] Start error:", err);
    });

    setSimliClient(client);

    // Cleanup on unmount
    return () => {
      client.close();
    };
  }, [simliConfig, simliClient]);

  const handleConversationStart = useCallback(() => {
    setStarted(true);
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#0a2223] to-[#699a9b]">
      {/* Simli Avatar Video - always visible as the main visual */}
      <div className="absolute inset-0 z-[1]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ transform: "scaleX(-1)" }}
        />
        <audio ref={audioRef} autoPlay className="hidden" />
      </div>

      {/* Content pinned to bottom */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-end px-4 pb-8 sm:px-10 md:pb-16">
        <div className="w-full max-w-[640px] flex flex-col items-center gap-4">
          {/* Greeting card — hidden after conversation starts */}
          {!started && (
            <div className="self-start animate-[fade-in_400ms_ease-out]">
              <div className="bg-[rgba(10,34,35,0.5)] rounded-lg p-6 backdrop-blur-sm">
                <p className="text-white text-base leading-normal">{GREETING}</p>
              </div>
            </div>
          )}

          {/* Conversation interface with Simli integration */}
          <ConversationPanelWithAvatar
            onConversationStart={handleConversationStart}
            simliClient={simliClient}
            simliReady={simliReady}
          />
        </div>
      </div>
    </main>
  );
}

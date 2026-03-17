"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SimliClient, generateSimliSessionToken, generateIceServers } from "simli-client";
import ConversationPanelWithAvatar from "@/components/ConversationPanelWithAvatar";
import TopicBubbles from "@/components/TopicBubbles";

const GREETING =
  "Hey! I'm Digital Didric—always available, never needs coffee. Ask me anything.";

const TOPICS = [
  "How do you think about loyalty?",
  "Tell me about your background",
  "What are you working on now?",
];

const DOSE_LINK = "https://dose.didric.nl";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "anonymous";
  const key = "didric_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [triggerStart, setTriggerStart] = useState(false);
  const [pendingTopic, setPendingTopic] = useState<string | undefined>(undefined);
  const [simliConfig, setSimliConfig] = useState<{ apiKey: string; faceId: string } | null>(null);
  const [simliClient, setSimliClient] = useState<SimliClient | null>(null);
  const [simliReady, setSimliReady] = useState(false);
  const [visitorId, setVisitorId] = useState("anonymous");
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate persistent visitor ID on mount
  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

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
    if (!simliConfig || !videoRef.current || !audioRef.current) {
      return;
    }

    let client: SimliClient | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { session_token } = await generateSimliSessionToken({
          config: {
            faceId: simliConfig.faceId,
            handleSilence: true,
            maxSessionLength: 3600,
            maxIdleTime: 600,
            model: "fasttalk",
          },
          apiKey: simliConfig.apiKey,
        });

        const iceServers = await generateIceServers(simliConfig.apiKey);

        if (cancelled || !videoRef.current || !audioRef.current) return;

        client = new SimliClient(
          session_token,
          videoRef.current,
          audioRef.current,
          iceServers
        );

        client.on("connected", () => {
          console.log("[Simli] Connected - avatar ready");
          setSimliReady(true);
        });

        client.on("failed", (reason: string) => {
          console.error("[Simli] Failed:", reason);
        });

        setSimliClient(client);
        await client.start();
      } catch (err) {
        console.error("[Simli] Init error:", err);
      }
    })();

    return () => {
      cancelled = true;
      client?.stop();
    };
  }, [simliConfig]);

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

      {/* Content overlay - split into top and bottom sections */}
      <div className="relative z-10 flex min-h-screen flex-col justify-between px-4 sm:px-10">
        {/* Top section - greeting and topic bubbles */}
        <div className="w-full max-w-[640px] mx-auto pt-8 md:pt-12">
          {/* Greeting card — hidden after conversation starts */}
          {!started && (
            <div className="flex flex-col gap-4 animate-[fade-in_400ms_ease-out]">
              <div className="bg-[rgba(10,34,35,0.5)] rounded-lg p-6 backdrop-blur-sm">
                <p className="text-white text-base leading-normal">{GREETING}</p>
                {/* Loading indicator while avatar connects */}
                {!simliReady && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#04818f] animate-[loading-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: "0s" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#04818f] animate-[loading-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: "0.2s" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#04818f] animate-[loading-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: "0.4s" }} />
                    </div>
                    <span className="text-white/50 text-xs">Loading avatar...</span>
                  </div>
                )}
              </div>
              <TopicBubbles
                topics={TOPICS}
                onSelect={(topic) => {
                  setPendingTopic(topic);
                  setStarted(true);
                  setTriggerStart(true);
                }}
                externalLink={{ label: "Take the DOSE scan", href: DOSE_LINK }}
              />
            </div>
          )}
        </div>

        {/* Bottom section - mic button and input */}
        <div className="w-full max-w-[640px] mx-auto pb-8 md:pb-16">
          {/* Conversation interface with Simli integration */}
          <ConversationPanelWithAvatar
            onConversationStart={handleConversationStart}
            simliClient={simliClient}
            simliReady={simliReady}
            hasStarted={started}
            triggerStart={triggerStart}
            pendingTopic={pendingTopic}
            visitorId={visitorId}
          />
        </div>
      </div>
    </main>
  );
}

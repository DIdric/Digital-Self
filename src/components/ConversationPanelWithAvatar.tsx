"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SimliClient } from "simli-client";
import MicButton from "./MicButton";
import TopicBubbles from "./TopicBubbles";
import StatusIndicator from "./StatusIndicator";
import MediaCard from "./MediaCard";
import { detectMedia, type MediaDetection } from "@/lib/detectMedia";
import { detectStructured } from "@/lib/detectStructured";
import IdeaCard from "./IdeaCard";
import SlideCard from "./SlideCard";
import ConnectCard from "./ConnectCard";
import VideoCard from "./VideoCard";

/** Convert an ArrayBuffer (Int16 PCM) to a base64 string for WebSocket transmission. */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Inline AudioWorklet processor source.
 * Runs on the audio thread: resamples mic input from the native rate to the
 * target rate (negotiated by ElevenLabs), converts to Int16 PCM, and posts
 * the buffer back to the main thread for WebSocket transmission.
 */
const MIC_WORKLET_SRC = `
class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 16000;
    this.buffer = [];
    // ~250ms chunks (targetRate / 4 samples), matching the ElevenLabs SDK
    this.chunkSize = this.targetRate / 4;
    this.port.onmessage = (e) => {
      if (e.data.type === 'setRate') {
        this.targetRate = e.data.rate;
        this.chunkSize = Math.round(this.targetRate / 4);
        this.buffer = [];
      }
    };
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;

    // Linear interpolation resample from native rate to targetRate
    const ratio = sampleRate / this.targetRate;
    const outLen = Math.round(input.length / ratio);
    for (let i = 0; i < outLen; i++) {
      const s = i * ratio;
      const lo = Math.floor(s);
      const hi = Math.min(lo + 1, input.length - 1);
      const frac = s - lo;
      this.buffer.push(input[lo] * (1 - frac) + input[hi] * frac);
    }

    // Flush in chunks so latency stays low
    while (this.buffer.length >= this.chunkSize) {
      const chunk = this.buffer.splice(0, this.chunkSize);
      const int16 = new Int16Array(this.chunkSize);
      for (let i = 0; i < this.chunkSize; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]));
        int16[i] = s < 0 ? s * 32768 : s * 32767;
      }
      this.port.postMessage(int16.buffer, [int16.buffer]);
    }
    return true;
  }
}
registerProcessor('mic-processor', MicProcessor);
`;

type AppStatus = "idle" | "connecting" | "listening" | "speaking";

const TOPICS = [
  "How do you think about loyalty?",
  "Tell me about your background",
  "What are you working on now?",
];

const DOSE_LINK = "https://dose.didric.nl";

interface ConversationPanelWithAvatarProps {
  onConversationStart?: () => void;
  simliClient: SimliClient | null;
  simliReady: boolean;
  hasStarted?: boolean;
  onTopicSelect?: (topic: string) => void;
  triggerStart?: boolean;
  visitorId?: string;
}

export default function ConversationPanelWithAvatar({
  onConversationStart,
  simliClient,
  simliReady,
  hasStarted: hasStartedProp,
  onTopicSelect: onTopicSelectProp,
  triggerStart,
  visitorId = "anonymous",
}: ConversationPanelWithAvatarProps) {
  const [appStatus, setAppStatus] = useState<AppStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [activeMedia, setActiveMedia] = useState<NonNullable<MediaDetection> | null>(null);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [slides, setSlides] = useState<string[]>([]);
  const [videos, setVideos] = useState<{ url: string; title?: string }[]>([]);
  const [showConnect, setShowConnect] = useState(false);

  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const conversationReadyRef = useRef<boolean>(false);
  // Negotiated by ElevenLabs server in conversation_initiation_metadata
  const targetSampleRateRef = useRef<number>(16000);
  // When true, incoming ElevenLabs audio is not forwarded to Simli (e.g. video is playing)
  const suppressAudioRef = useRef<boolean>(false);

  const markStarted = useCallback(() => {
    setHasStarted(true);
    onConversationStart?.();
  }, [onConversationStart]);

  // Convert base64 to Uint8Array
  const base64ToUint8Array = useCallback((base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }, []);

  // Initialize ElevenLabs WebSocket connection
  const initElevenLabs = useCallback(
    async (signedUrl: string) => {
      return new Promise<WebSocket>((resolve, reject) => {
        // Use the signed URL directly
        const ws = new WebSocket(signedUrl);
        websocketRef.current = ws;

        ws.onopen = () => {
          console.log("[ElevenLabs] WebSocket connected");

          // Send conversation initiation with visitor_id for persistent memory
          ws.send(
            JSON.stringify({
              type: "conversation_initiation_client_data",
              dynamic_variables: {
                visitor_id: visitorId,
              },
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case "conversation_initiation_metadata": {
                const meta = data.conversation_initiation_metadata_event;
                console.log("[ElevenLabs] Conversation initialized", meta?.conversation_id);
                // Read the server-negotiated input audio format (e.g. "pcm_16000")
                // and update the worklet so it resamples to the correct rate.
                const fmtStr: string = meta?.user_input_audio_format ?? "pcm_16000";
                const negotiatedRate = parseInt(fmtStr.split("_")[1]) || 16000;
                console.log(`[ElevenLabs] Negotiated input format: ${fmtStr} (${negotiatedRate}Hz)`);
                targetSampleRateRef.current = negotiatedRate;
                // Tell the already-running worklet to use the correct rate
                workletNodeRef.current?.port.postMessage({ type: "setRate", rate: negotiatedRate });
                conversationReadyRef.current = true;
                resolve(ws);
                break;
              }

              case "audio":
                // 🎯 THE HANDSHAKE: Send ElevenLabs audio to Simli (unless a video is playing)
                if (data.audio_event?.audio_base_64 && simliClient && !suppressAudioRef.current) {
                  const audioData = base64ToUint8Array(data.audio_event.audio_base_64);
                  simliClient.sendAudioData(audioData);
                }
                break;

              case "user_transcript":
                console.log("[User]", data.user_transcription_event?.user_transcript);
                setAppStatus("listening");
                break;

              case "agent_response": {
                const response = data.agent_response_event?.agent_response;
                console.log("[Agent]", response);
                setAppStatus("speaking");

                if (response) {
                  // Check for rich media (LinkedIn, YouTube, etc.)
                  const media = detectMedia(response);
                  if (media) setActiveMedia(media);

                  // Check for structured content (brainstorm ideas, pitch slides, connect CTA)
                  const structured = detectStructured(response);
                  for (const item of structured) {
                    if (item.type === "idea") {
                      setIdeas((prev) => [...prev, item.text]);
                    } else if (item.type === "slide") {
                      setSlides((prev) => [...prev, item.title]);
                    } else if (item.type === "video") {
                      setVideos((prev) => [...prev, { url: item.url, title: item.title }]);
                      // Stop the avatar talking so the visitor can watch in silence
                      suppressAudioRef.current = true;
                      ws.send(JSON.stringify({ type: "user_activity" }));
                    } else if (item.type === "connect") {
                      setShowConnect(true);
                    }
                  }
                }
                break;
              }

              case "agent_response_correction":
                // Agent was interrupted
                break;

              case "ping":
                ws.send(JSON.stringify({ type: "pong", event_id: data.ping_event?.event_id }));
                break;

              case "interruption":
                console.log("[ElevenLabs] Interruption");
                break;

              case "error":
                console.error("[ElevenLabs] Error:", data);
                setError(data.message || "ElevenLabs error");
                break;

              default:
                console.log("[ElevenLabs] Unknown message type:", data.type);
            }
          } catch (e) {
            console.error("[ElevenLabs] Failed to parse message:", e);
          }
        };

        ws.onerror = (err) => {
          console.error("[ElevenLabs] WebSocket error:", err);
          reject(new Error("WebSocket connection failed"));
        };

        ws.onclose = (event) => {
          console.log("[ElevenLabs] WebSocket closed", event.code, event.reason);
          conversationReadyRef.current = false;
          if (event.code !== 1000) {
            console.warn("[ElevenLabs] Unexpected close, code:", event.code);
          }
        };

        // Timeout for initialization
        setTimeout(() => reject(new Error("Connection timeout")), 15000);
      });
    },
    [base64ToUint8Array, simliClient, visitorId]
  );

  // Start microphone streaming to ElevenLabs via AudioWorkletNode
  const startMicrophoneStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // AudioContext at native device rate — worklet handles resampling
      audioContextRef.current = new AudioContext();
      // Mobile browsers start AudioContext suspended until a user gesture resumes it
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
      const nativeRate = audioContextRef.current.sampleRate;
      console.log(`[Mic] AudioContext at ${nativeRate}Hz (worklet will resample to target rate)`);

      // Load the inline worklet via a Blob URL (avoids needing a public .js file)
      const blob = new Blob([MIC_WORKLET_SRC], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      await audioContextRef.current.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContextRef.current, "mic-processor");
      workletNodeRef.current = workletNode;

      // Pre-set the initial target rate (may be updated once metadata arrives)
      workletNode.port.postMessage({ type: "setRate", rate: targetSampleRateRef.current });

      // Each message from the worklet is a buffer of Int16 PCM at the target rate
      workletNode.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
        const ws = websocketRef.current;
        if (ws && ws.readyState === WebSocket.OPEN && conversationReadyRef.current) {
          ws.send(JSON.stringify({ user_audio_chunk: arrayBufferToBase64(e.data) }));
        }
      };

      // Connect mic → worklet. No destination connection: worklet has no audio output.
      source.connect(workletNode);

      console.log("[Mic] AudioWorklet streaming ready");
    } catch (err) {
      console.error("[Mic] Error:", err);
      throw new Error("Microphone access denied");
    }
  }, []);

  // Cleanup function (only closes ElevenLabs + mic, NOT Simli - avatar stays on)
  const cleanup = useCallback(() => {
    console.log("[Cleanup] Closing conversation connections...");

    conversationReadyRef.current = false;

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current.port.close();
      workletNodeRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    // NOTE: Simli client is NOT closed here - avatar stays visible

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Start the full conversation
  const startConversation = useCallback(async () => {
    setError(null);
    setAppStatus("connecting");
    setIdeas([]);
    setSlides([]);
    setVideos([]);
    setShowConnect(false);
    setActiveMedia(null);
    suppressAudioRef.current = false;

    try {
      // Check if Simli avatar is ready
      if (!simliReady || !simliClient) {
        throw new Error("Avatar not ready yet. Please wait a moment and try again.");
      }

      // Get ElevenLabs signed URL
      const res = await fetch("/api/get-signed-url");
      if (!res.ok) throw new Error("Failed to get ElevenLabs config");

      const { signedUrl } = await res.json();
      if (!signedUrl) {
        throw new Error("No ElevenLabs signed URL received");
      }

      console.log("[Init] Got signed URL");

      // Initialize microphone
      console.log("[Init] Setting up microphone...");
      await startMicrophoneStream();

      // Connect to ElevenLabs (conversation will be initialized)
      console.log("[Init] Connecting to ElevenLabs...");
      await initElevenLabs(signedUrl);

      // Now we're ready - audio will start flowing
      console.log("[Init] All systems ready!");
      setAppStatus("listening");
      markStarted();
    } catch (err) {
      console.error("[Start] Error:", err);
      const msg = err instanceof Error ? err.message : "Failed to start";
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("microphone")) {
        setError("Microphone access is required. Please allow mic permissions and try again.");
      } else {
        setError(msg);
      }
      setAppStatus("idle");
      cleanup();
    }
  }, [simliReady, simliClient, initElevenLabs, startMicrophoneStream, markStarted, cleanup]);

  const stopConversation = useCallback(() => {
    cleanup();
    setAppStatus("idle");
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Trigger start from outside (e.g., topic bubble click)
  useEffect(() => {
    if (triggerStart && appStatus === "idle") {
      startConversation();
    }
  }, [triggerStart, appStatus, startConversation]);

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
      }
      markStarted();
      onTopicSelectProp?.(topic);
    },
    [appStatus, startConversation, markStarted, onTopicSelectProp]
  );

  const handleTextSend = useCallback(() => {
    const msg = textInput.trim();
    if (!msg) return;

    if (appStatus === "idle") {
      startConversation();
    }
    setTextInput("");
    markStarted();
  }, [textInput, appStatus, startConversation, markStarted]);

  // Dismiss all cards at once — also re-enable avatar audio
  const dismissCards = useCallback(() => {
    setIdeas([]);
    setSlides([]);
    setVideos([]);
    setActiveMedia(null);
    setShowConnect(false);
    suppressAudioRef.current = false;
  }, []);

  const isActive = appStatus !== "idle" && appStatus !== "connecting";
  const hasCards = slides.length > 0 || ideas.length > 0 || videos.length > 0 || !!activeMedia || showConnect;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Card overlay — only appears when the agent sends something to present.
          Slides up smoothly, dismissed with the × button in the top-right corner. */}
      {hasCards && (
        <div className="animate-[slide-in_300ms_ease-out] w-full relative">
          {/* Dismiss button */}
          <button
            onClick={dismissCards}
            aria-label="Dismiss"
            className="absolute -top-1 -right-1 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white/50 hover:text-white transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Card stack — padded right so content doesn't sit under the × */}
          <div className="flex flex-col items-center gap-2 pr-6">
            {/* Pitch slide — shows the latest slide with a progress bar */}
            {slides.length > 0 && (
              <div className="w-full flex justify-center">
                <SlideCard
                  title={slides[slides.length - 1]}
                  slideNumber={slides.length}
                  totalSlides={Math.max(slides.length, 4)}
                />
              </div>
            )}

            {/* Brainstorm idea cards */}
            {ideas.length > 0 && (
              <div className="w-full flex flex-col items-center gap-2">
                {ideas.map((idea, i) => (
                  <IdeaCard key={i} text={idea} index={i} />
                ))}
              </div>
            )}

            {/* Rich media card (LinkedIn, YouTube, download) */}
            {activeMedia && (
              <div className="w-full flex justify-center">
                <MediaCard media={activeMedia} />
              </div>
            )}

            {/* Video embeds (Vimeo / YouTube case videos) */}
            {videos.length > 0 && (
              <div className="w-full flex flex-col items-center gap-2">
                {videos.map((v, i) => (
                  <VideoCard key={i} url={v.url} title={v.title} />
                ))}
              </div>
            )}

            {/* Connect CTA */}
            {showConnect && (
              <div className="w-full flex justify-center">
                <ConnectCard />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status indicator only when active */}
      {isActive && <StatusIndicator status={appStatus} />}

      {/* Mic button */}
      <MicButton status={appStatus} onClick={handleMicClick} />

      {error && <p className="text-red-300 text-sm text-center px-4">{error}</p>}

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

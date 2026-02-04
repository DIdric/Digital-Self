"use client";

import { useState, useCallback, useRef, useEffect, RefObject } from "react";
import { SimliClient, SimliClientConfig } from "simli-client";
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

const DOSE_LINK = "https://dose.didric.nl";

interface ConversationPanelWithAvatarProps {
  onConversationStart?: () => void;
  simliConfig: { apiKey: string; faceId: string } | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  audioRef: RefObject<HTMLAudioElement | null>;
}

export default function ConversationPanelWithAvatar({
  onConversationStart,
  simliConfig,
  videoRef,
  audioRef,
}: ConversationPanelWithAvatarProps) {
  const [appStatus, setAppStatus] = useState<AppStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [activeMedia, setActiveMedia] = useState<NonNullable<MediaDetection> | null>(null);

  const simliClientRef = useRef<SimliClient | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const conversationReadyRef = useRef<boolean>(false);

  const markStarted = useCallback(() => {
    setHasStarted(true);
    onConversationStart?.();
  }, [onConversationStart]);

  // Initialize Simli client
  const initSimli = useCallback(async () => {
    if (!simliConfig || !videoRef.current || !audioRef.current) {
      console.warn("[Simli] Missing config or refs");
      return null;
    }

    const client = new SimliClient();
    simliClientRef.current = client;

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

    return new Promise<SimliClient>((resolve, reject) => {
      client.on("connected", () => {
        console.log("[Simli] Connected");
        resolve(client);
      });

      client.on("failed", (reason: string) => {
        console.error("[Simli] Failed:", reason);
        reject(new Error(reason));
      });

      client.start().catch((err) => reject(err));
    });
  }, [simliConfig, videoRef, audioRef]);

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

          // Send minimal conversation initiation
          ws.send(
            JSON.stringify({
              type: "conversation_initiation_client_data",
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case "conversation_initiation_metadata":
                console.log("[ElevenLabs] Conversation initialized", data.conversation_initiation_metadata_event?.conversation_id);
                conversationReadyRef.current = true;
                resolve(ws);
                break;

              case "audio":
                // 🎯 THE HANDSHAKE: Send ElevenLabs audio to Simli
                if (data.audio_event?.audio_base_64 && simliClientRef.current) {
                  const audioData = base64ToUint8Array(data.audio_event.audio_base_64);
                  simliClientRef.current.sendAudioData(audioData);
                }
                break;

              case "user_transcript":
                console.log("[User]", data.user_transcription_event?.user_transcript);
                setAppStatus("listening");
                break;

              case "agent_response":
                console.log("[Agent]", data.agent_response_event?.agent_response);
                setAppStatus("speaking");

                // Check for media in response
                const response = data.agent_response_event?.agent_response;
                if (response) {
                  const media = detectMedia(response);
                  if (media) {
                    setActiveMedia(media);
                  }
                }
                break;

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
    [base64ToUint8Array]
  );

  // Start microphone streaming to ElevenLabs
  const startMicrophoneStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaStreamRef.current = stream;

      // Create AudioContext
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // Use ScriptProcessor for audio processing
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      processor.onaudioprocess = (e) => {
        const ws = websocketRef.current;
        // Only send audio when conversation is ready and websocket is open
        if (ws && ws.readyState === WebSocket.OPEN && conversationReadyRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);

          // Convert Float32 [-1, 1] to Int16 PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const sample = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          }

          // Convert to base64
          const bytes = new Uint8Array(pcmData.buffer);
          let binary = "";
          const chunkSize = 0x8000;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
            binary += String.fromCharCode.apply(null, Array.from(chunk));
          }
          const base64Audio = btoa(binary);

          // Send user audio chunk
          ws.send(JSON.stringify({
            user_audio_chunk: base64Audio
          }));
        }
      };

      console.log("[Mic] Streaming ready");
    } catch (err) {
      console.error("[Mic] Error:", err);
      throw new Error("Microphone access denied");
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log("[Cleanup] Closing connections...");

    conversationReadyRef.current = false;

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    if (simliClientRef.current) {
      simliClientRef.current.close();
      simliClientRef.current = null;
    }

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

    try {
      // Get ElevenLabs signed URL
      const res = await fetch("/api/get-signed-url");
      if (!res.ok) throw new Error("Failed to get ElevenLabs config");

      const { signedUrl } = await res.json();
      if (!signedUrl) {
        throw new Error("No ElevenLabs signed URL received");
      }

      console.log("[Init] Got signed URL");

      // Initialize Simli first
      console.log("[Init] Starting Simli...");
      await initSimli();

      // Initialize microphone (but don't send yet)
      console.log("[Init] Setting up microphone...");
      await startMicrophoneStream();

      // Then connect to ElevenLabs (conversation will be initialized)
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
  }, [initSimli, initElevenLabs, startMicrophoneStream, markStarted, cleanup]);

  const stopConversation = useCallback(() => {
    cleanup();
    setAppStatus("idle");
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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
    },
    [appStatus, startConversation, markStarted]
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

  const isActive = appStatus !== "idle" && appStatus !== "connecting";

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Media card overlay */}
      {activeMedia && (
        <div className="w-full flex justify-center mb-2">
          <MediaCard media={activeMedia} />
        </div>
      )}

      {/* Status indicator only when active */}
      {isActive && (
        <StatusIndicator status={appStatus} />
      )}

      {/* Mic button */}
      <MicButton status={appStatus} onClick={handleMicClick} />

      {error && <p className="text-red-300 text-sm text-center px-4">{error}</p>}

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

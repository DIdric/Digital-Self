"use client";

import { useState } from "react";
import Image from "next/image";
import ConversationPanel from "@/components/ConversationPanel";
import FloatingParticles from "@/components/FloatingParticles";

const GREETING =
  "Hey! Welcome my digital self\u2014always available, never needs coffee. I\u2019m Didric, ask me anything.";

export default function Home() {
  const [started, setStarted] = useState(false);

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#0a2223] to-[#699a9b]"
    >
      {/* Animated particles behind everything */}
      <FloatingParticles />

      {/* Photo on top of particles */}
      <Image
        src="/didric.png"
        alt=""
        fill
        className="object-cover object-center z-[1]"
        priority
      />

      {/* Content pinned to bottom */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-end px-4 pb-8 sm:px-10 md:pb-16">
        <div className="w-full max-w-[640px] flex flex-col items-center gap-4">
          {/* Greeting card — hidden after conversation starts */}
          {!started && (
            <div className="self-start animate-[fade-in_400ms_ease-out]">
              <div className="bg-[rgba(10,34,35,0.5)] rounded-lg p-6 backdrop-blur-sm">
                <p className="text-white text-base leading-normal">
                  {GREETING}
                </p>
              </div>
            </div>
          )}

          {/* Conversation interface */}
          <ConversationPanel onConversationStart={() => setStarted(true)} />
        </div>
      </div>
    </main>
  );
}

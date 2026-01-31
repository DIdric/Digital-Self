import Image from "next/image";
import ConversationPanel from "@/components/ConversationPanel";

const GREETING = `Hey! Welcome to the digital version of me\u2014always available, never needs coffee. I\u2019m Didric, and I help brands engineer belonging instead of just optimizing behavior. Ask me about emotional loyalty, my frameworks, or how I think about experience design.`;

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        {/* Profile photo */}
        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center">
          <Image
            src="/didric.jpg"
            alt="Didric"
            width={112}
            height={112}
            className="object-cover w-full h-full"
            priority
          />
        </div>

        {/* Greeting */}
        <p className="text-center text-sm text-zinc-400 leading-relaxed px-2">
          {GREETING}
        </p>

        {/* Conversation interface */}
        <ConversationPanel />
      </div>
    </main>
  );
}

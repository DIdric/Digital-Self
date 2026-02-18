"use client";

const LINKEDIN_URL = "https://www.linkedin.com/in/didricvandenborne/";
const EMAIL = "didric@didric.nl";
const EMAIL_SUBJECT = "Following up on our conversation";

export default function ConnectCard() {
  return (
    <div className="animate-[slide-in_300ms_ease-out] w-full max-w-[480px]">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-5 py-4">
        <p className="text-white/70 text-sm mb-4">Want to continue this conversation?</p>
        <div className="flex gap-3">
          {/* LinkedIn */}
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#0a66c2] hover:bg-[#0958a8] text-white text-sm font-medium rounded-lg px-4 py-3 transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Connect on LinkedIn
          </a>

          {/* Email */}
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent(EMAIL_SUBJECT)}`}
            className="flex-1 flex items-center justify-center gap-2 bg-[#04818f] hover:bg-[#03707c] text-white text-sm font-medium rounded-lg px-4 py-3 transition-colors"
          >
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Send an email
          </a>
        </div>
      </div>
    </div>
  );
}

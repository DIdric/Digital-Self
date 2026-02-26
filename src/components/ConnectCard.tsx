"use client";

import { useState, useCallback } from "react";

const LINKEDIN_URL = "https://www.linkedin.com/in/didric/";
const EMAIL = "didric@didric.nl";
const DEFAULT_SUBJECT = "Following up on our conversation";

interface ConnectCardProps {
  emailSubject?: string;
  emailBody?: string;
}

export default function ConnectCard({ emailSubject, emailBody }: ConnectCardProps) {
  const subject = emailSubject || DEFAULT_SUBJECT;
  const mailtoHref = emailBody
    ? `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`
    : `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;

  const [copied, setCopied] = useState(false);

  const copyDraft = useCallback(async () => {
    const text = `To: ${EMAIL}\nSubject: ${subject}\n\n${emailBody ?? ""}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers that block clipboard API
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [subject, emailBody]);

  return (
    <div className="animate-[slide-in_300ms_ease-out] w-full max-w-[480px]">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-5 py-4">
        <p className="text-white/70 text-sm mb-4">Want to continue this conversation?</p>

        <div className="flex gap-3 mb-4">
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
            LinkedIn
          </a>

          {/* Email — mailto opens email app; fallback shown below */}
          <a
            href={mailtoHref}
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
            Send email
          </a>
        </div>

        {/* Prefilled email draft — visible fallback for when mailto doesn't open */}
        {emailBody && (
          <div className="border border-white/10 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between bg-white/5 px-3 py-2">
              <div className="min-w-0">
                <p className="text-white/40 text-xs">
                  To: <span className="text-white/70">{EMAIL}</span>
                </p>
                <p className="text-white/40 text-xs truncate">
                  Subject: <span className="text-white/70">{subject}</span>
                </p>
              </div>
              <button
                onClick={copyDraft}
                className="ml-3 shrink-0 flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-green-400">Copied</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-white/60 text-xs leading-relaxed px-3 py-2.5 whitespace-pre-wrap">
              {emailBody}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useRef } from "react";
import { TranscriptEntry } from "../types";

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
}

export function TranscriptPanel({ entries }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="font-mono text-xs text-[rgb(255,119,130)] tracking-widest">
          AWAITING TRANSMISSION
        </div>
        <div className="mt-2 w-16 h-px bg-[rgb(255,119,130)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`flex gap-3 items-start animate-slide-up ${
            entry.role === "user" ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {/* Avatar */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
              entry.role === "assistant"
                ? "bg-teal-[rgb(255,119,130)] text-[rgb(255,109,120)] border border-[rgb(255,90,100)]"
                : "bg-slate-600/40 text-slate-300 border border-slate-500/40"
            }`}
          >
            {entry.role === "assistant" ? "AI" : "You"}
          </div>

          {/* Message */}
          <div
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed font-body ${
              entry.role === "assistant"
                ? "bg-teal-500/10 border border-[rgb(255,119,130)] text-slate-200"
                : "bg-slate-700/50 border border-slate-500 text-slate-300"
            }`}
          >
            {entry.text}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

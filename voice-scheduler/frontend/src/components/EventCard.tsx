import React from "react";
import { CreatedEvent } from "../types";

interface EventCardProps {
  event: CreatedEvent;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function EventCard({ event }: EventCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[rgb(255,119,130)] bg-gradient-to-br from-teal-900/20 to-base-900 p-6 animate-slide-up">
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-[rgba(255,119,130, 0.3)] rotate-45 translate-x-8 -translate-y-8" />
      </div>

      <div className="flex items-start gap-4">
        {/* Calendar icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[rgb(255,119,130, 0.3)] border border-[rgb(255,119,130)] flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,119,130, 0.8)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-[rgb(255,119,130)] tracking-widest mb-1">
            EVENT CREATED
          </div>
          <h3 className="font-display text-lg font-semibold text-white truncate">
            {event.summary}
          </h3>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{formatDate(event.start.dateTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Ends: {formatDate(event.end.dateTime)}</span>
            </div>
          </div>

          {event.eventLink && (
            <a
              href={event.eventLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 font-mono text-xs text-[rgb(255,119,130)] hover:text-[rgb(255,90,100)] transition-colors border border-[rgb(255,119,130)] hover:border-[rgb(255,90,100)] rounded px-3 py-1.5"
            >
              VIEW IN GOOGLE CALENDAR
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

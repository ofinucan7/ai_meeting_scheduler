import React, { useEffect, useState } from "react";
import { useRealtimeVoice } from "./hooks/useRealtimeVoice";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { EventCard } from "./components/EventCard";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

function App() {
  const {
    status,
    transcript,
    createdEvent,
    errorMsg,
    startSession,
    stopSession,
  } = useRealtimeVoice();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Check auth status on mount and after redirect
  useEffect(() => {
    checkAuth();
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "success") {
      window.history.replaceState({}, "", "/");
    }
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/status`, {
        credentials: "include",
      });
      const data = await res.json();
      setIsAuthenticated(data.isAuthenticated);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setAuthChecked(true);
    }
  }

  function handleGoogleAuth() {
    window.location.href = `${BACKEND_URL}/auth/google`;
  }

  async function handleLogout() {
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setIsAuthenticated(false);
    stopSession();
  }

  const isActive = [
    "ready",
    "listening",
    "thinking",
    "speaking",
    "success",
  ].includes(status);

  return (
    <div className="min-h-screen bg-base-950 text-white font-body overflow-hidden">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 213, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 213, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Ambient glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0,255,213,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* ── Header ── */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,119,130,0.2), rgba(255,119,130,0.1))",
                border: "1px solid rgba(255,119,130,0.3)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,119,130,0.9)"
                strokeWidth="1.5"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
            <div>
              <div className="font-display font-bold text-white tracking-tight leading-none">
                VOICE SCHEDULER
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* System status */}
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-500">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: isAuthenticated
                    ? "rgba(34,197,94,0.8)"
                    : "rgba(100,116,139,0.8)",
                  boxShadow: isAuthenticated
                    ? "0 0 6px rgba(34,197,94,0.5)"
                    : "none",
                }}
              />
              {isAuthenticated ? "CALENDAR CONNECTED" : "CALENDAR DISCONNECTED"}
            </div>

            {authChecked &&
              (isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="font-mono text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded border border-slate-700 hover:border-slate-500"
                >
                  LOGOUT
                </button>
              ) : (
                <button
                  onClick={handleGoogleAuth}
                  className="font-mono text-xs text-[rgb(255,119,130)] transition-colors px-3 py-1.5 rounded border border-[rgb(255,119,130)] hover:border-[rgb(255,80,90)] flex items-center gap-2"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  CONNECT GOOGLE
                </button>
              ))}
          </div>
        </header>

        {/* ── Main ── */}
        <main className="flex-1 flex flex-col lg:flex-row gap-0">
          {/* Left panel — voice interface */}
          <div className="lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16 gap-8">
            {/* Not authenticated state */}
            {!isAuthenticated && authChecked && (
              <div className="text-center space-y-4 max-w-sm animate-fade-in">
                <div
                  className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.05))",
                    border: "1px solid rgba(251,191,36,0.3)",
                  }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(251,191,36,0.8)"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h2 className="font-display text-xl font-semibold">
                  Google Calendar Required
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Please connect your Google Calendar so I can schedule your
                  events.
                </p>
                <button
                  onClick={handleGoogleAuth}
                  className="mt-4 w-full py-3 px-6 rounded-lg font-mono text-sm text-[rgb(255,119,130)] border border-[rgb(255,119,130)] hover:border-[rgb(255,80,90)] hover:bg-[#0b1120] transition-all"
                >
                  CONNECT GOOGLE CALENDAR
                </button>
              </div>
            )}

            {/* Authenticated — voice UI */}
            {isAuthenticated && (
              <>
                {/* Orb */}
                <div className="relative">
                  <AudioVisualizer status={status} />
                </div>

                {/* Title */}
                <div className="text-center">
                  <h1 className="font-display text-3xl font-bold tracking-tight">
                    {status === "idle" ? (
                      <>Schedule now</>
                    ) : status === "success" ? (
                      <span style={{ color: "rgba(34,197,94,0.9)" }}>
                        Event Created!
                      </span>
                    ) : status === "error" ? (
                      <span style={{ color: "rgba(239,68,68,0.9)" }}>
                        Connection Error
                      </span>
                    ) : (
                      <>
                        Currently{" "}
                        <span style={{ color: "rgba(0,255,213,0.9)" }}>
                          {status === "listening"
                            ? "listening..."
                            : status === "thinking"
                              ? "thinking..."
                              : status === "speaking"
                                ? "speaking..."
                                : status === "connecting"
                                  ? "connecting..."
                                  : "ready"}
                        </span>
                      </>
                    )}
                  </h1>
                  {status === "idle" && (
                    <p className="mt-2 text-slate-400 text-sm">
                      Press the button below to get started scheduling.
                    </p>
                  )}
                  {errorMsg && (
                    <p className="mt-2 text-red-400 text-sm font-mono">
                      {errorMsg}
                    </p>
                  )}
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-4">
                  {!isActive ? (
                    <button
                      onClick={startSession}
                      disabled={status === "connecting"}
                      className="relative group overflow-hidden rounded-full px-8 py-4 font-mono text-sm tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(255,119,130,0.15), rgba(255,119,130,0.1))",
                        border: "1px solid rgba(255,119,130,0.4)",
                        color: "rgba(255,119,130,0.9)",
                        boxShadow: "0 0 20px rgba(255,119,130,0.1)",
                      }}
                    >
                      <span className="relative z-10">
                        {status === "connecting"
                          ? "INITIALIZING..."
                          : status === "error"
                            ? "RETRY CONNECTION"
                            : "START SESSION"}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={stopSession}
                      className="rounded-full px-8 py-4 font-mono text-sm tracking-wider transition-all duration-300"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.05))",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "rgba(239,68,68,0.8)",
                      }}
                    >
                      END SESSION
                    </button>
                  )}

                  {/* Hint */}
                  {status === "ready" && (
                    <p className="font-mono text-xs text-slate-500 animate-pulse">
                      SPEAK TO BEGIN
                    </p>
                  )}
                </div>

                {/* Created event card */}
                {createdEvent && (
                  <div className="w-full max-w-sm">
                    <EventCard event={createdEvent} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right panel — transcript */}
          <div
            className="lg:w-1/2 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-800/60"
            style={{ minHeight: "400px", maxHeight: "calc(100vh - 73px)" }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background:
                      transcript.length > 0
                        ? "rgba(0,255,213,0.8)"
                        : "rgba(100,116,139,0.5)",
                    boxShadow:
                      transcript.length > 0
                        ? "0 0 6px rgba(0,255,213,0.4)"
                        : "none",
                  }}
                />
                <span className="font-mono text-xs text-slate-500 tracking-widest">
                  TRANSCRIPT
                </span>
              </div>
              <span className="font-mono text-xs text-slate-600">
                {transcript.length}{" "}
                {transcript.length === 1 ? "ENTRY" : "ENTRIES"}
              </span>
            </div>

            {/* Scrollable transcript */}
            <div className="flex-1 overflow-y-auto">
              <TranscriptPanel entries={transcript} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

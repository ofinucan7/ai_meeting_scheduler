import React from "react";
import { AgentStatus } from "../types";

interface AudioVisualizerProps {
  status: AgentStatus;
}

const statusConfig: Record<AgentStatus, { color: string; rings: number; label: string }> = {
  idle: { color: "rgba(51, 65, 85, 0.8)", rings: 0, label: "STANDBY" },
  connecting: { color: "rgba(251, 191, 36, 0.8)", rings: 1, label: "CONNECTING" },
  ready: { color: "rgba(0, 255, 213, 0.6)", rings: 1, label: "READY" },
  listening: { color: "rgba(0, 255, 213, 1)", rings: 3, label: "LISTENING" },
  thinking: { color: "rgba(139, 92, 246, 0.9)", rings: 2, label: "PROCESSING" },
  speaking: { color: "rgba(45, 212, 191, 0.9)", rings: 3, label: "SPEAKING" },
  error: { color: "rgba(239, 68, 68, 0.9)", rings: 1, label: "ERROR" },
  success: { color: "rgba(34, 197, 94, 0.9)", rings: 2, label: "DONE" },
};

export function AudioVisualizer({ status }: AudioVisualizerProps) {
  const config = statusConfig[status];
  const isActive = ["listening", "speaking", "thinking"].includes(status);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* Ripple rings */}
      {config.rings > 0 &&
        Array.from({ length: config.rings }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 160 + i * 20,
              height: 160 + i * 20,
              border: `1px solid ${config.color}`,
              animation: `ripple ${1.5 + i * 0.4}s ease-out infinite`,
              animationDelay: `${i * 0.3}s`,
              opacity: 0.6 - i * 0.15,
            }}
          />
        ))}

      {/* Core orb */}
      <div
        className="relative rounded-full flex items-center justify-center transition-all duration-500"
        style={{
          width: 120,
          height: 120,
          background: `radial-gradient(circle at 35% 35%, ${config.color}33, ${config.color}11 60%, transparent)`,
          border: `2px solid ${config.color}`,
          boxShadow: isActive
            ? `0 0 40px ${config.color}50, inset 0 0 30px ${config.color}20`
            : `0 0 15px ${config.color}20`,
        }}
      >
        {/* Inner waveform animation */}
        {status === "listening" && (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 3,
                  background: config.color,
                  animation: `waveBar ${0.6 + i * 0.1}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.08}s`,
                  height: Math.random() * 20 + 10,
                }}
              />
            ))}
          </div>
        )}
        {status === "speaking" && (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 3,
                  background: config.color,
                  animation: `speakBar ${0.4 + i * 0.05}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.06}s`,
                  height: 6,
                }}
              />
            ))}
          </div>
        )}
        {status === "thinking" && (
          <div
            className="rounded-full"
            style={{
              width: 24,
              height: 24,
              border: `2px solid ${config.color}`,
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }}
          />
        )}
        {status === "success" && (
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d="M8 18L15 25L28 11"
              stroke={config.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {(status === "idle" || status === "connecting" || status === "ready") && (
          <div
            className="rounded-full transition-all duration-500"
            style={{
              width: 16,
              height: 16,
              background: config.color,
              opacity: status === "idle" ? 0.3 : 0.8,
              boxShadow: `0 0 10px ${config.color}`,
            }}
          />
        )}
        {status === "error" && (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M10 10L22 22M22 10L10 22"
              stroke={config.color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* Status label */}
      <div
        className="absolute bottom-0 font-mono text-xs tracking-widest"
        style={{ color: config.color }}
      >
        {config.label}
      </div>

      <style>{`
        @keyframes waveBar {
          0% { height: 6px; }
          100% { height: 30px; }
        }
        @keyframes speakBar {
          0% { height: 4px; }
          100% { height: 28px; }
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

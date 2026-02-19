import { useState, useRef, useCallback } from "react";
import { AgentStatus, TranscriptEntry, EventDetails, CreatedEvent } from "../types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "";

export function useRealtimeVoice() {
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const addTranscript = useCallback((role: "user" | "assistant", text: string) => {
    setTranscript((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role, text, timestamp: new Date() },
    ]);
  }, []);

  const sendDataChannelMessage = useCallback((message: object) => {
    if (dataChannelRef.current?.readyState === "open") {
      dataChannelRef.current.send(JSON.stringify(message));
    }
  }, []);

  // ── Tool handler: create_calendar_event ───────────────────────────────────

  const handleCreateCalendarEvent = useCallback(
    async (args: EventDetails, callId: string) => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/calendar/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(args),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Failed to create event");

        setCreatedEvent(data);
        setStatus("success");

        // Send tool result back to OpenAI Realtime
        sendDataChannelMessage({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: callId,
            output: JSON.stringify({
              success: true,
              message: `Event "${data.summary}" has been successfully added to Google Calendar!`,
              event_link: data.eventLink,
            }),
          },
        });

        // Trigger the model to respond with confirmation
        sendDataChannelMessage({ type: "response.create" });
      } catch (err: any) {
        sendDataChannelMessage({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: callId,
            output: JSON.stringify({
              success: false,
              error: err.message,
            }),
          },
        });
        sendDataChannelMessage({ type: "response.create" });
      }
    },
    [sendDataChannelMessage]
  );

  // ── Data channel message handler ──────────────────────────────────────────

  const handleDataChannelMessage = useCallback(
    (event: MessageEvent) => {
      let msg: any;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case "session.created":
        case "session.updated":
          setStatus("ready");
          break;

        case "input_audio_buffer.speech_started":
          setStatus("listening");
          break;

        case "input_audio_buffer.speech_stopped":
          setStatus("thinking");
          break;

        case "response.audio.delta":
          setStatus("speaking");
          break;

        case "response.audio.done":
          setStatus("ready");
          break;

        case "response.audio_transcript.done":
          if (msg.transcript) {
            addTranscript("assistant", msg.transcript);
          }
          break;

        case "conversation.item.input_audio_transcription.completed":
          if (msg.transcript) {
            addTranscript("user", msg.transcript);
          }
          break;

        case "response.function_call_arguments.done":
          if (msg.name === "create_calendar_event") {
            try {
              const args: EventDetails = JSON.parse(msg.arguments);
              handleCreateCalendarEvent(args, msg.call_id);
            } catch (err) {
              console.error("Error parsing function args:", err);
            }
          }
          break;

        case "error":
          console.error("Realtime error:", msg.error);
          setErrorMsg(msg.error?.message || "An error occurred");
          setStatus("error");
          break;
      }
    },
    [addTranscript, handleCreateCalendarEvent]
  );

  // ── Start session ──────────────────────────────────────────────────────────

  const startSession = useCallback(async () => {
    setStatus("connecting");
    setErrorMsg(null);
    setTranscript([]);
    setCreatedEvent(null);

    try {
      // 1. Get ephemeral token from backend
      const tokenRes = await fetch(`${BACKEND_URL}/api/session`, {
        method: "POST",
        credentials: "include",
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to get session token");
      }

      const sessionData = await tokenRes.json();
      const ephemeralKey = sessionData.client_secret?.value;

      if (!ephemeralKey) {
        throw new Error("Invalid session data from server");
      }

      // 2. Set up WebRTC peer connection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // 3. Set up remote audio playback
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // 4. Capture local microphone audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(stream.getTracks()[0]);

      // 5. Create data channel for events
      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;
      dc.onmessage = handleDataChannelMessage;
      dc.onopen = () => {
        setStatus("ready");
        dc.send(JSON.stringify({ type: "response.create" }));
      };

      // 6. Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpRes.ok) {
        throw new Error("Failed to connect to OpenAI Realtime");
      }

      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: await sdpRes.text(),
      };

      await pc.setRemoteDescription(answer);
    } catch (err: any) {
      console.error("Session start error:", err);
      setErrorMsg(err.message || "Failed to start session");
      setStatus("error");
    }
  }, [handleDataChannelMessage]);

  // ── Stop session ───────────────────────────────────────────────────────────

  const stopSession = useCallback(() => {
    dataChannelRef.current?.close();
    peerConnectionRef.current?.close();
    dataChannelRef.current = null;
    peerConnectionRef.current = null;

    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
    }

    setStatus("idle");
  }, []);

  return {
    status,
    transcript,
    createdEvent,
    errorMsg,
    startSession,
    stopSession,
  };
}

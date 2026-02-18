export type AgentStatus =
  | "idle"
  | "connecting"
  | "ready"
  | "listening"
  | "thinking"
  | "speaking"
  | "error"
  | "success";

export interface EventDetails {
  title: string;
  attendee_name: string;
  start_datetime: string;
  end_datetime: string;
  description?: string;
}

export interface TranscriptEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export interface CreatedEvent {
  eventId: string;
  eventLink: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
}

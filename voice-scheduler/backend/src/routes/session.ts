import { Router, Request, Response } from "express";
import OpenAI from "openai";

export const sessionRouter = Router();

const AGENT_INSTRUCTIONS = `
You are a friendly and professional scheduling assistant.
Your job is to help users book calendar events through a natural conversation.

OPENING: When the conversation starts, immediately say exactly this:
"Hey there! What is your name, preferred date and time for the meeting, where's it going to be, and who should I list in the meeting notes as attendees?"

Then listen and collect all the details from their response. If they don't provide everything in one go, ask follow-up questions for anything missing.

CONVERSATION FLOW:
1. Always start by saying the opening line (ie full name, prefered date and time, where the meeting is going to be, and who should be in the notes)
2. Repeat back any details the user says and have them verify it
3. Ask for a meeting title or purpose (let them know this is optional — default to "Meeting with [name]")
4. Ask for confirmation ("Shall I go ahead and create this event?")
5. When confirmed, call the create_calendar_event function with the details

IMPORTANT RULES:
- Be conversational, warm, and concise — don't be robotic
- Interpret date/time naturally. Today's date is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
- Make sure to follow the user's time exactly and assume that they are in EST, state that to them to that if they need to adjust the time
- When confirming, format date/time in a clear, human-readable way
- If the user changes their mind, gracefully update and re-confirm
- After creating the event, let the user know it's been added to their Google Calendar and wish them well
- Duration defaults to 1 hour unless the user specifies otherwise
`.trim();

// POST /api/session — create an OpenAI Realtime ephemeral session
sessionRouter.post("/", async (req: Request, res: Response) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create a realtime session with tool definitions
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "shimmer",
          instructions: AGENT_INSTRUCTIONS,
          input_audio_transcription: { model: "whisper-1" },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 600,
          },
          tools: [
            {
              type: "function",
              name: "create_calendar_event",
              description:
                "Create a calendar event in Google Calendar after the user has confirmed all details.",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "The title/subject of the calendar event",
                  },
                  attendee_name: {
                    type: "string",
                    description: "The full name of the person scheduling",
                  },
                  start_datetime: {
                    type: "string",
                    description:
                      "ISO 8601 datetime string for the event start (e.g. 2024-12-25T14:00:00)",
                  },
                  end_datetime: {
                    type: "string",
                    description:
                      "ISO 8601 datetime string for the event end (e.g. 2024-12-25T15:00:00)",
                  },
                  description: {
                    type: "string",
                    description: "Optional description or notes for the event",
                  },
                },
                required: ["title", "attendee_name", "start_datetime", "end_datetime"],
              },
            },
          ],
          tool_choice: "auto",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI session error:", error);
      return res.status(500).json({ error: "Failed to create OpenAI session" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Session creation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

import { Router, Request, Response } from "express";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export const calendarRouter = Router();

function getOAuth2Client(req: Request): OAuth2Client {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/auth/google/callback"
  );

  if (req.session.googleTokens) {
    oauth2Client.setCredentials(req.session.googleTokens);
  }

  return oauth2Client;
}

// POST /api/calendar/create — create a calendar event
calendarRouter.post("/create", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated || !req.session.googleTokens) {
    return res.status(401).json({ error: "Not authenticated with Google" });
  }

  const { title, attendee_name, start_datetime, end_datetime, description } = req.body;

  if (!title || !start_datetime || !end_datetime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const auth = getOAuth2Client(req);
    const calendar = google.calendar({ version: "v3", auth });

    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        description: description
          ? `${description}\n\nScheduled by: ${attendee_name}`
          : `Scheduled by: ${attendee_name}`,
        start: {
          dateTime: start_datetime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: end_datetime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 15 },
          ],
        },
      },
    });

    // Refresh tokens if they were updated
    const newTokens = auth.credentials;
    if (newTokens.access_token !== req.session.googleTokens.access_token) {
      req.session.googleTokens = {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || req.session.googleTokens.refresh_token,
        expiry_date: newTokens.expiry_date,
      };
    }

    res.json({
      success: true,
      eventId: event.data.id,
      eventLink: event.data.htmlLink,
      summary: event.data.summary,
      start: event.data.start,
      end: event.data.end,
    });
  } catch (err: any) {
    console.error("Calendar creation error:", err);
    res.status(500).json({
      error: "Failed to create calendar event",
      details: err.message,
    });
  }
});

// GET /api/calendar/status — check if calendar is accessible
calendarRouter.get("/status", async (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    return res.json({ connected: false });
  }

  try {
    const auth = getOAuth2Client(req);
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.calendarList.list({ maxResults: 1 });
    res.json({ connected: true });
  } catch {
    res.json({ connected: false });
  }
});

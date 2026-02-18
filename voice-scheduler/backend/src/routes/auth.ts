import { Router, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";

declare module "express-session" {
  interface SessionData {
    googleTokens?: {
      access_token?: string | null;
      refresh_token?: string | null;
      expiry_date?: number | null;
    };
    isAuthenticated?: boolean;
  }
}

export const authRouter = Router();

function getOAuth2Client() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/auth/google/callback"
  );
}

// GET /auth/google — start OAuth flow
authRouter.get("/google", (_req: Request, res: Response) => {
  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
  });
  res.redirect(authUrl);
});

// GET /auth/google/callback — handle OAuth callback
authRouter.get("/google/callback", async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    req.session.googleTokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    };
    req.session.isAuthenticated = true;

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}?auth=success`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}?auth=error`);
  }
});

// GET /auth/status — check if user is authenticated
authRouter.get("/status", (req: Request, res: Response) => {
  res.json({
    isAuthenticated: !!req.session.isAuthenticated,
  });
});

// POST /auth/logout
authRouter.post("/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

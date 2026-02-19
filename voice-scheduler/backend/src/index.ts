import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";
import { sessionRouter } from "./routes/session";
import { calendarRouter } from "./routes/calendar";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "voice-scheduler-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/auth", authRouter);
app.use("/api/session", sessionRouter);
app.use("/api/calendar", calendarRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Voice Scheduler backend running on http://localhost:${PORT}`);
});

export default app;

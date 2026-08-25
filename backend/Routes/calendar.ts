import express from "express";
import { google } from "googleapis";
import path from "path";

const router = express.Router();

router.get("/", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Missing user email" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), "google-service-account.json"),
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
      clientOptions: {
        subject: email as string,
      },
    });

    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.list({
      calendarId: email as string,
      timeMin: new Date().toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const realEvents =
      response.data.items?.map((item) => ({
        id: item.id,
        title: item.summary || "Untitled Meeting",
        description: item.description || "No description provided.",
        startTime: item.start?.dateTime || item.start?.date,
        endTime: item.end?.dateTime || item.end?.date,
        organizer: item.organizer?.email || email,
        location: item.location || "Virtual Meeting",
        isTomorrow:
          new Date(item.start?.dateTime || item.start?.date || "").toDateString() ===
          new Date(Date.now() + 86400000).toDateString(),
      })) || [];

    return res.status(200).json(realEvents);
  } catch (error) {
    console.error(`Google Calendar API Error for ${email}:`, error);
    return res.status(200).json([]);
  }
});

export default router;

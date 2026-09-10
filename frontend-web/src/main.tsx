import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SplashScreen } from "@capacitor/splash-screen";
import * as Sentry from "@sentry/react"; // <-- Sentry Import

// Initialize Sentry to catch all unhandled React/Browser crashes
Sentry.init({
  dsn: "", // Replace this with the free DSN link from your Sentry.io account
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0, // Captures a video replay of the screen when an error hits!
});

// Wait for the native container to finish loading the initial DOM
window.addEventListener("DOMContentLoaded", () => {
  // Render the React application
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  // Hide the native splash screen immediately after React mounts
  setTimeout(() => {
    SplashScreen.hide().catch((err) => {
      console.warn("Splash screen error:", err);
    });
  }, 100); // Small 100ms buffer ensures the UI is fully painted before revealing
});

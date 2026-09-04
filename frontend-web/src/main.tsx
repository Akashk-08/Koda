import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SplashScreen } from '@capacitor/splash-screen';

// Wait for the native container to finish loading the initial DOM
window.addEventListener('DOMContentLoaded', () => {
  
  // Render the React application
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  // Hide the native splash screen immediately after React mounts
  setTimeout(() => {
    SplashScreen.hide().catch(err => {
      console.warn("Splash screen error:", err);
    });
  }, 100); // Small 100ms buffer ensures the UI is fully painted before revealing
  
});
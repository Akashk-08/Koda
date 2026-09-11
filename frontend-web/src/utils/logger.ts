const API_URL = import.meta.env.VITE_API_URL;

export const logToBackend = async (
  level: "info" | "warn" | "error",
  message: string,
  errorObj?: Error,
) => {
  try {
    await fetch(`${API_URL}/api/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level,
        message,
        source: "ReactApp",
        stack: errorObj?.stack || "",
      }),
    });
  } catch (err) {
    // Fallback if the backend is totally unreachable
    console.error("Critical: Failed to send log to backend", err);
  }
};

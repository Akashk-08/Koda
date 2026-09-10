import express from "express";
import logger from "../utils/logger.js";

const router = express.Router();

router.post("/", (req, res) => {
  const { level = "error", message, source, stack } = req.body;
  const logMessage = `[Frontend - ${source}] ${message} | Stack: ${stack || "No stack"}`;

  if (level === "error") {
    logger.error(logMessage);
  } else if (level === "warn") {
    logger.warn(logMessage);
  } else {
    logger.info(logMessage);
  }

  res.status(200).json({ success: true });
});

export default router;

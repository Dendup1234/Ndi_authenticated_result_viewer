import express from "express";

import {
    handleNDIWebhook,
    handleNDIEvents,
    handleNDILoginStatus,
} from "../controllers/ndiController.js";

const router = express.Router();

router.get("/events/:threadId", handleNDIEvents);
router.get("/status/:threadId", handleNDILoginStatus);
router.post("/webhook/callbacks", handleNDIWebhook);

export default router;
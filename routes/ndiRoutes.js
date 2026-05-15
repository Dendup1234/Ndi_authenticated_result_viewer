import express from "express";

import {
    handleNDIWebhook
} from "../controllers/ndiController.js"

const router = express.Router();

router.post("/webhook/callback", handleNDIWebhook);

export default router;
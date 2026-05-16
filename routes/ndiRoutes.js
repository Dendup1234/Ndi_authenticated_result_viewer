import express from "express";
import {
    startNDILogin,
    checkNDILoginStatus,
} from "../controllers/ndiController.js";

const router = express.Router();

router.post("/login/start", startNDILogin);
router.get("/login/status/:threadId", checkNDILoginStatus);

export default router;
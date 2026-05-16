import express from "express";
import {
    getProfile
} from "../../controllers/profile/student.profile.js"
import {
    protect
} from "../../middleware/protect.js"

const router = express.Router();

router.get("/profile", protect, getProfile);


export default router;
import mongoose from "mongoose";

const ndiLoginSessionSchema = new mongoose.Schema(
    {
        threadId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "verified", "failed"],
            default: "pending",
        },
        token: {
            type: String,
            default: "",
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            default: null,
        },
        error: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const NdiLoginSession = mongoose.model("NdiLoginSession", ndiLoginSessionSchema);

export default NdiLoginSession;
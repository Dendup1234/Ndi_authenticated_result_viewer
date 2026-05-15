import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
    {
        cid: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        fullName: {
            type: String,
            trim: true,
            default: "",
        },
        dob: {
            type: String,
            default: "",
        },
        ndiVerified: {
            type: Boolean,
            default: false,
        },
        ndiPayload: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Student = mongoose.model("Student", studentSchema);

export default Student;

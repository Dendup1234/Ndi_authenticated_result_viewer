// controllers/ndiController.js

import Student from "../models/Student.js";
import { signToken } from "../utils/jwt.js";
import NdiLoginSession from "../models/NdiLoginSession.js";
import {
    addClient,
    removeClient,
    sendToClient,
} from "../utils/ndiSse.js";

const getProofPayload = (payload) =>
    payload?.data?.requested_presentation
        ? payload.data
        : payload?.proof?.requested_presentation
            ? payload.proof
            : payload;

const getRevealedAttribute = (revealedAttributes, names) => {
    for (const name of names) {
        const attribute = revealedAttributes?.[name];

        if (Array.isArray(attribute) && attribute[0]?.value) {
            return attribute[0].value;
        }

        if (attribute?.value) {
            return attribute.value;
        }

        if (typeof attribute === "string") {
            return attribute;
        }
    }

    return "";
};

export const handleNDIWebhook = async (req, res) => {
    try {
        console.log("NDI webhook payload:", JSON.stringify(req.body, null, 2));

        const payload = req.body;
        const proofData = getProofPayload(payload);

        if (
            proofData?.type === "present-proof/presentation-result" &&
            proofData?.verification_result !== "ProofValidated"
        ) {
            return res.status(202).json({
                message: "NDI proof response received but proof was not validated",
                verificationResult: proofData?.verification_result,
            });
        }

        const revealedAttributes =
            proofData?.requested_presentation?.revealed_attrs || {};

        const cid =
            getRevealedAttribute(revealedAttributes, [
                "ID Number",
                "CID",
                "cid",
                "Citizenship ID Number",
            ]) ||
            proofData?.cid ||
            proofData?.attributes?.cid;

        const fullName =
            getRevealedAttribute(revealedAttributes, [
                "Full Name",
                "fullName",
                "Name",
                "name",
            ]) ||
            proofData?.fullName ||
            proofData?.attributes?.fullName;

        const dob =
            getRevealedAttribute(revealedAttributes, [
                "Date of Birth",
                "DOB",
                "dob",
                "Birth Date",
            ]) ||
            proofData?.dob ||
            proofData?.attributes?.dob;

        if (!cid) {
            return res.status(400).json({
                message: "CID not found in NDI proof response",
                revealedAttributeNames: Object.keys(revealedAttributes),
                receivedPayload: payload,
            });
        }

        let student = await Student.findOne({ cid });

        let isNewUser = false;

        if (!student) {
            student = await Student.create({
                cid,
                fullName,
                dob,
                ndiVerified: true,
                ndiPayload: payload,
            });

            isNewUser = true;
        }

        // SSE trigger for frontend
        const threadId = proofData?.thid;

        const accessToken = signToken({
            id: student._id,
            cid: student.cid,
            fullName: student.fullName,
        });

        if (threadId) {
            await NdiLoginSession.findOneAndUpdate(
                { threadId },
                {
                    threadId,
                    status: "verified",
                    token: accessToken,
                    student: student._id,
                },
                {
                    upsert: true,
                    new: true,
                }
            );

            sendToClient(threadId, "ndi-verified", {
                token: accessToken,
                user: {
                    id: student._id,
                    cid: student.cid,
                    fullName: student.fullName,
                },
            });

            removeClient(threadId);
        }

        return res.status(202).json({
            message: isNewUser
                ? "New student created and logged in successfully"
                : "Existing student logged in successfully",
            isNewUser,
            accessToken,
            student,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to process NDI webhook",
            error: error.message,
        });
    }
};

// handle ndi events
export const handleNDIEvents = async (req, res) => {
    const { threadId } = req.params;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ status: "waiting", threadId })}\n\n`);

    addClient(threadId, res);

    const existingSession = await NdiLoginSession.findOne({ threadId }).populate("student");

    if (existingSession?.status === "verified") {
        res.write(`event: ndi-verified\n`);
        res.write(
            `data: ${JSON.stringify({
                token: existingSession.token,
                user: existingSession.student,
            })}\n\n`
        );
        res.end();
        removeClient(threadId);
        return;
    }

    req.on("close", () => {
        removeClient(threadId);
    });
};

// check ndi status
export const handleNDILoginStatus = async (req, res) => {
    const { threadId } = req.params;

    const session = await NdiLoginSession.findOne({ threadId }).populate("student");

    if (!session) {
        return res.status(404).json({
            status: "not_found",
        });
    }

    return res.status(200).json({
        status: session.status,
        token: session.token,
        user: session.student,
        error: session.error,
    });
};

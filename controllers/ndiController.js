// controllers/ndiController.js

import QRCode from "qrcode";
import Student from "../models/Student.js";
import { signToken } from "../utils/jwt.js";
import { ndiSessions } from "../utils/ndiSessionStore.js";
import { getNDIAccessToken } from "../services/ndiAuth.js";

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

export const startNDILogin = async (req, res) => {
    try {
        const accessToken = await getNDIAccessToken();

        const response = await fetch(
            "https://demo-client.bhutanndi.com/verifier/v1/proof-request",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    proofName: "Sign in with NDI",
                    proofAttributes: [
                        {
                            name: "Full Name",
                            restrictions: [
                                {
                                    schema_name: "https://dev-schema.ngotag.com/schemas/c7952a0a-e9b5-4a4b-a714-1e5d0a1ae076",
                                },
                            ],
                        },
                        {
                            name: "ID Number",
                            restrictions: [
                                {
                                    schema_name: "https://dev-schema.ngotag.com/schemas/c7952a0a-e9b5-4a4b-a714-1e5d0a1ae076",
                                },
                            ],
                        },
                    ],
                    purpose: "login",
                    authenticationLevel: "Standard",
                    isShortenUrl: true,
                }),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(result);
        }

        const proofData = result.data || result;
        const threadId =
            proofData.proofRequestThreadId ||
            proofData.threadId ||
            proofData.thid;

        if (!threadId || !proofData.proofRequestURL) {
            return res.status(502).json({
                message: "NDI proof request response did not include threadId or proofRequestURL",
                result,
            });
        }

        ndiSessions.set(threadId, {
            status: "pending",
        });

        const qrSvg = await QRCode.toString(proofData.proofRequestURL, {
            type: "svg",
            margin: 0,
        });

        return res.status(201).json({
            threadId,
            proofRequestURL: proofData.proofRequestURL,
            deepLinkURL: proofData.deepLinkURL,
            qrSvg,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to start NDI login",
            error: error.message,
        });
    }
};

export const handleNDIProofResult = async (threadId, payload) => {
    const proofData = payload?.data || payload;

    if (
        proofData?.type === "present-proof/presentation-result" &&
        proofData?.verification_result !== "ProofValidated"
    ) {
        ndiSessions.set(threadId, {
            status: "failed",
            reason: proofData?.verification_result || "Proof not validated",
        });
        return;
    }

    const revealedAttributes =
        proofData?.requested_presentation?.revealed_attrs || {};

    const cid = getRevealedAttribute(revealedAttributes, [
        "ID Number",
        "CID",
        "cid",
    ]);

    const fullName = getRevealedAttribute(revealedAttributes, [
        "Full Name",
        "fullName",
        "Name",
    ]);

    if (!cid) {
        ndiSessions.set(threadId, {
            status: "failed",
            reason: "CID not found",
        });
        return;
    }

    const existingStudent = await Student.findOne({ cid });
    let isNewUser = false;

    const student = await Student.findOneAndUpdate(
        { cid },
        {
            cid,
            fullName,
            dob: getRevealedAttribute(revealedAttributes, [
                "Date of Birth",
                "DOB",
                "dob",
                "Birth Date",
            ]),
            ndiVerified: true,
            ndiPayload: payload,
        },
        {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }
    );

    isNewUser = !existingStudent;

    const accessToken = signToken({
        id: student._id,
        cid: student.cid,
        fullName: student.fullName,
    });

    ndiSessions.set(threadId, {
        status: "verified",
        accessToken,
        student,
        isNewUser,
    });

    console.log("✅ NDI login verified:", {
        threadId,
        cid,
        fullName,
    });
};

export const checkNDILoginStatus = async (req, res) => {
    const { threadId } = req.params;

    const session = ndiSessions.get(threadId);

    if (!session || session.status === "pending") {
        return res.status(202).json({
            verified: false,
            message: "Waiting for NDI approval",
        });
    }

    if (session.status === "failed") {
        return res.status(400).json({
            verified: false,
            message: "NDI verification failed",
            reason: session.reason,
        });
    }

    return res.status(200).json({
        verified: true,
        accessToken: session.accessToken,
        student: session.student,
        isNewUser: session.isNewUser,
    });
};

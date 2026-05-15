// controllers/ndiController.js

import Student from "../models/Student.js";

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

        const student = await Student.findOneAndUpdate(
            { cid },
            {
                cid,
                fullName,
                dob,
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

        return res.status(202).json({
            message: "NDI student information received successfully",
            student,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to process NDI webhook",
            error: error.message,
        });
    }
};

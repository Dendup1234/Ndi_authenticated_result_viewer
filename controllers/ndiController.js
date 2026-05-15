// controllers/ndiController.js

export const handleNDIWebhook = async (req, res) => {
    try {
        console.log("NDI webhook payload:", JSON.stringify(req.body, null, 2));

        const payload = req.body;

        // Example only: adjust keys based on actual NDI webhook response
        const proofData = payload?.data || payload?.proof || payload;

        const cid =
            proofData?.cid ||
            proofData?.attributes?.cid ||
            proofData?.revealedAttributes?.cid;

        const fullName =
            proofData?.fullName ||
            proofData?.attributes?.fullName ||
            proofData?.revealedAttributes?.fullName;

        const dob =
            proofData?.dob ||
            proofData?.attributes?.dob ||
            proofData?.revealedAttributes?.dob;

        if (!cid) {
            return res.status(400).json({
                message: "CID not found in NDI proof response",
                receivedPayload: payload,
            });
        }

        // Save or update student in your DB
        // const student = await Student.findOneAndUpdate(
        //   { cid },
        //   {
        //     cid,
        //     fullName,
        //     dob,
        //     ndiVerified: true,
        //     ndiPayload: payload,
        //   },
        //   { new: true, upsert: true }
        // );

        return res.status(200).json({
            message: "NDI student information received successfully",
            cid,
            fullName,
            dob,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to process NDI webhook",
            error: error.message,
        });
    }
};
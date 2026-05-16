// services/ndiNats.js

import { connect, nkeyAuthenticator, StringCodec } from "nats";
import { handleNDIProofResult } from "../controllers/ndiController.js";

const getNatsPayload = (payload) => payload?.data || payload;

const getThreadId = (subject, payload) => {
    const proofData = getNatsPayload(payload);

    return (
        proofData?.thid ||
        proofData?.threadId ||
        proofData?.thread_id ||
        payload?.pattern ||
        payload?.data?.thid ||
        payload?.data?.threadId ||
        payload?.data?.thread_id ||
        subject
    );
};

export const startNDINats = async () => {
    if (!process.env.NDI_NATS_SEED) {
        console.warn("NDI NATS skipped: add NDI_NATS_SEED to .env to enable it.");
        return;
    }

    const server = process.env.NDI_NATS_URL || "wss://natsdemoclient.bhutanndi.com";
    const subject = process.env.NDI_NATS_SUBJECT || ">";
    const stringCodec = StringCodec();

    const nc = await connect({
        servers: [server],
        authenticator: nkeyAuthenticator(
            new TextEncoder().encode(process.env.NDI_NATS_SEED)
        ),
    });

    console.log(`Connected to NDI NATS at ${server}`);
    console.log(`Listening for NDI proof results on subject: ${subject}`);

    const sub = nc.subscribe(subject);

    (async () => {
        for await (const msg of sub) {
            try {
                const rawMessage = stringCodec.decode(msg.data);
                const payload = JSON.parse(rawMessage);
                const proofData = getNatsPayload(payload);

                if (
                    proofData?.type &&
                    proofData.type !== "present-proof/presentation-result"
                ) {
                    continue;
                }

                const threadId = getThreadId(msg.subject, payload);

                if (!threadId) {
                    console.warn("NDI NATS message ignored: missing thread id");
                    continue;
                }

                await handleNDIProofResult(threadId, payload);
            } catch (error) {
                console.error("NDI NATS message error:", error.message);
            }
        }
    })().catch((error) => {
        console.error("NDI NATS subscription error:", error.message);
    });

    nc.closed()
        .then((error) => {
            if (error) {
                console.error("NDI NATS connection closed:", error.message);
            }
        })
        .catch((error) => {
            console.error("NDI NATS close error:", error.message);
        });

    return nc;
};

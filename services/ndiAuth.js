let cachedToken = null;
let tokenExpiresAt = 0;

const getTokenFromResponse = (payload) =>
    payload?.access_token ||
    payload?.accessToken ||
    payload?.data?.access_token ||
    payload?.data?.accessToken;

const getExpiresIn = (payload) =>
    payload?.expires_in ||
    payload?.expiresIn ||
    payload?.data?.expires_in ||
    payload?.data?.expiresIn ||
    3600;

export const getNDIAccessToken = async () => {
    if (cachedToken && Date.now() < tokenExpiresAt) {
        return cachedToken;
    }

    const clientId = process.env.NDI_CLIENT_ID;
    const clientSecret = process.env.NDI_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        if (process.env.NDI_ACCESS_TOKEN) {
            return process.env.NDI_ACCESS_TOKEN;
        }

        throw new Error(
            "NDI_CLIENT_ID and NDI_CLIENT_SECRET are required to generate an NDI access token"
        );
    }

    const authUrl =
        process.env.NDI_AUTH_URL ||
        "https://staging.bhutanndi.com/authentication/v1/authenticate";

    const response = await fetch(authUrl, {
        method: "POST",
        headers: {
            accept: "*/*",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "client_credentials",
        }),
    });

    const payload = await response.json();

    if (!response.ok) {
        throw new Error(
            payload?.message ||
                payload?.error_description ||
                payload?.error ||
                "Failed to authenticate with NDI"
        );
    }

    const accessToken = getTokenFromResponse(payload);

    if (!accessToken) {
        throw new Error("NDI authentication response did not include an access token");
    }

    const expiresIn = Number(getExpiresIn(payload));
    cachedToken = accessToken;
    tokenExpiresAt = Date.now() + Math.max(expiresIn - 60, 60) * 1000;

    return cachedToken;
};

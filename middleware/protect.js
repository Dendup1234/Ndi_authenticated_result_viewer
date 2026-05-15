import { verifyToken } from "../utils/jwt.js";

// Protect middleware
export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }
        //Spliting the token
        const token = authHeader.split(" ")[1];

        const payload = await verifyToken(token);
        req.user = payload;
        next();
    } catch (err) {
        console.log(err);
        res.status(401).json({ message: "Invalid or expired token" });
    }
};
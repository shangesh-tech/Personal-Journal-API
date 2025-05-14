const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET 

const authMiddleware = (req, res, next) => {
    const token = req.cookies?.auth_token;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.username = decoded.username;

        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
};

module.exports = authMiddleware;

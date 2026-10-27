const { CognitoJwtVerifier } = require("aws-jwt-verify");

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    tokenUse: "access",
    clientId: process.env.COGNITO_CLIENT_ID
});

async function authenticateToken(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Authentication required"
        });
    }

    const token = authorization.slice(7);

    try {
        const payload = await verifier.verify(token);

        req.user = {
            id: payload.sub,
            username: payload.username,
            groups: payload["cognito:groups"] || []
        };

        next();
    } catch (error) {
        console.error("Cognito token verification failed:", error.message);

        return res.status(401).json({
            error: "Invalid or expired access token"
        });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user?.groups.includes("RaaS-Admins")) {
        return res.status(403).json({
            error: "Administrator access required"
        });
    }

    next();
}

module.exports = {
    authenticateToken,
    requireAdmin
};
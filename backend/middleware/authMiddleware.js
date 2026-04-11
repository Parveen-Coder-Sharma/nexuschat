const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Get the token from the request headers
    const authHeader = req.header('Authorization');
    
    // 2. If no token is found, deny access
    if (!authHeader) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    try {
        // 3. The token usually comes as "Bearer <token_string>", so we split it
        const token = authHeader.split(" ")[1];
        
        // 4. Verify the token using our secret key
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // 5. Add the user info to the request object so the next function can use it
        req.user = verified;
        next(); // Pass control to the next function
    } catch (error) {
        res.status(400).json({ message: "Invalid Token." });
    }
};
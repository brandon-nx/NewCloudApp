const admin = require("../config/firebase");

const protect = async (req, res, next) => {
  // Check for token in Cookies OR Authorization Header
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    console.log("🔒 Access Denied: No token found");
    return res.status(403).json({ message: "No token provided. Please log in." });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    console.log(`👤 [User Activity]: ${decodedToken.email} is accessing ${req.originalUrl}`);
    
    // Attach the Firebase user data (uid, email) to the request
    req.user = decodedToken; 
    next(); 
  } catch (error) {
    console.error("❌ Token Verification Failed:", error.message);
    return res.status(401).json({ message: "Unauthorized access. Invalid or expired token." });
  }
};

module.exports = { protect };
import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  try {
    const { token } = req.headers;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not Authorized. Login Again' });
    }

    const token_decode = jwt.decode(token);

    if (!token_decode || !token_decode.clerkId) {
      return res.status(401).json({ success: false, message: 'Invalid token or missing clerkId' });
    }

    // Ensure req.body exists to prevent "Cannot set properties of undefined"
    if (!req.body) req.body = {};

    req.body.clerkId = token_decode.clerkId;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).json({ success: false, message: 'Unauthorized access' });
  }
};

export default authUser;

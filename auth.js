const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the Bearer token and attaches req.user
async function protect(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Sign in to continue" });
  }
  try {
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "This account no longer exists" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Your session expired. Sign in again." });
  }
}

// Usage: router.get("/", protect, allow("admin"), handler)
const allow = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You don't have access to this area" });
  }
  next();
};

module.exports = { protect, allow };

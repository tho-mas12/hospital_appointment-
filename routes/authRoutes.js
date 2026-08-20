const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const { protect } = require("../middleware/auth");

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || "7d" });

const shape = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role });

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, phone, role = "patient", doctorProfile } = req.body;

    if (await User.findOne({ email })) {
      return res.status(409).json({ message: "That email is already registered. Log in instead." });
    }

    const user = await User.create({ name, email, password, phone, role });

    // A doctor account needs a matching profile row before it appears in search.
    if (role === "doctor" && doctorProfile) {
      await Doctor.create({ user: user._id, name, ...doctorProfile });
    }

    res.status(201).json({ token: sign(user._id), user: shape(user) });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Email or password is incorrect" });
    }
    res.json({ token: sign(user._id), user: shape(user) });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => res.json({ user: shape(req.user) }));

// PUT /api/auth/me — update the signed-in profile
router.put("/me", protect, async (req, res, next) => {
  try {
    const allowed = ["name", "phone", "age", "gender", "bloodGroup", "allergies", "address"];
    allowed.forEach((k) => { if (req.body[k] !== undefined) req.user[k] = req.body[k]; });
    await req.user.save();
    res.json({ user: shape(req.user) });
  } catch (err) { next(err); }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  // Always the same reply, so the endpoint can't be used to discover which emails exist.
  res.json({ message: "If that email is registered, a reset link is on its way." });
});

module.exports = router;

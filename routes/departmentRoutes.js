const router = require("express").Router();
const Department = require("../models/Department");
const { protect, allow } = require("../middleware/auth");

// GET /api/departments — list all departments (public)
router.get("/", async (req, res, next) => {
  try {
    const departments = await Department.find({}).sort({ name: 1 });
    res.json({ count: departments.length, departments });
  } catch (err) {
    next(err);
  }
});

// POST /api/departments — add new department (admin only)
router.post("/", protect, allow("admin"), async (req, res, next) => {
  try {
    const { id, name, emoji, blurb } = req.body;
    
    if (!id || !name) {
      return res.status(400).json({ message: "Department ID and Name are required" });
    }

    const exists = await Department.findOne({ id: id.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "A department with this ID already exists." });
    }

    const department = await Department.create({ id, name, emoji, blurb });
    res.status(201).json({ department });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

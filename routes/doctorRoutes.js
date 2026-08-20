const router = require("express").Router();
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const { protect, allow } = require("../middleware/auth");

// GET /api/doctors?department=cardiology&search=heart&sort=rating
router.get("/", async (req, res, next) => {
  try {
    const { department, search, sort = "rating" } = req.query;
    const query = { active: true };
    if (department && department !== "all") query.department = department;
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { specialization: new RegExp(search, "i") },
      ];
    }
    const order = { rating: { rating: -1 }, experience: { experience: -1 }, fee: { fee: 1 } };
    const doctors = await Doctor.find(query).sort(order[sort] || order.rating);
    res.json({ count: doctors.length, doctors });
  } catch (err) { next(err); }
});

// GET /api/doctors/:id
router.get("/:id", async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "No doctor with that id" });
    res.json({ doctor });
  } catch (err) { next(err); }
});

// GET /api/doctors/:id/slots?date=2026-07-25
// Returns every slot the doctor offers, flagged taken or free.
router.get("/:id/slots", async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "Add a date, for example ?date=2026-07-25" });

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "No doctor with that id" });

    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(date + "T00:00:00").getDay()];
    if (!doctor.availableDays.includes(day)) {
      return res.json({
        date, day, consulting: false, slots: [],
        message: `${doctor.name} doesn't consult on ${day}. Available: ${doctor.availableDays.join(", ")}`,
      });
    }

    const booked = await Appointment.find({
      doctor: doctor._id, date, status: { $in: ["Pending", "Confirmed"] },
    }).select("slot");
    const taken = booked.map((b) => b.slot);

    res.json({
      date, day, consulting: true,
      slots: doctor.slots.map((s) => ({ slot: s, available: !taken.includes(s) })),
    });
  } catch (err) { next(err); }
});

// PUT /api/doctors/:id/availability — doctor or admin
router.put("/:id/availability", protect, allow("doctor", "admin"), async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "No doctor with that id" });
    if (req.user.role === "doctor" && String(doctor.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only change your own availability" });
    }
    if (req.body.availableDays) doctor.availableDays = req.body.availableDays;
    if (req.body.slots) doctor.slots = req.body.slots;
    await doctor.save();
    res.json({ doctor });
  } catch (err) { next(err); }
});

module.exports = router;

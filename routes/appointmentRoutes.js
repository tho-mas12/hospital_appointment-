const router = require("express").Router();
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const { protect, allow } = require("../middleware/auth");

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// POST /api/appointments — book
router.post("/", protect, async (req, res, next) => {
  try {
    const { doctorId, date, slot, patientName, age, gender, phone, email, symptoms } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.active) return res.status(404).json({ message: "That doctor isn't taking appointments" });

    const todayStr = new Date().toISOString().slice(0, 10);
    if (date < todayStr) return res.status(400).json({ message: "Pick today or a later date" });

    const day = DAYS[new Date(date + "T00:00:00").getDay()];
    if (!doctor.availableDays.includes(day)) {
      return res.status(400).json({
        message: `${doctor.name} doesn't consult on ${day}. Available: ${doctor.availableDays.join(", ")}`,
      });
    }
    if (!doctor.slots.includes(slot)) {
      return res.status(400).json({ message: "That slot isn't offered. Refresh and pick another." });
    }

    const clash = await Appointment.findOne({
      doctor: doctor._id, date, slot, status: { $in: ["Pending", "Confirmed"] },
    });
    if (clash) return res.status(409).json({ message: "That slot was just taken. Pick another time." });

    const appointment = await Appointment.create({
      patient: req.user._id, doctor: doctor._id,
      patientName, age, gender, phone, email,
      department: doctor.department, date, slot, symptoms, fee: doctor.fee,
    });

    res.status(201).json({ appointment });
  } catch (err) { next(err); }
});

// GET /api/appointments — scoped to the caller's role
router.get("/", protect, async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === "patient") {
      query.patient = req.user._id;
    } else if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) return res.json({ appointments: [] });
      query.doctor = doctor._id;
    }
    if (req.query.status) query.status = req.query.status;
    if (req.query.date) query.date = req.query.date;

    const appointments = await Appointment.find(query)
      .populate("doctor", "name specialization department room fee")
      .sort({ date: -1, slot: 1 });

    res.json({ count: appointments.length, appointments });
  } catch (err) { next(err); }
});

// PATCH /api/appointments/:id/status — approve, complete, cancel
router.patch("/:id/status", protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Confirmed", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Unknown status" });
    }
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: "No appointment with that id" });

    // A patient may only cancel, and only their own.
    if (req.user.role === "patient") {
      if (String(appt.patient) !== String(req.user._id)) {
        return res.status(403).json({ message: "That isn't your appointment" });
      }
      if (status !== "Cancelled") {
        return res.status(403).json({ message: "You can cancel or reschedule, nothing else" });
      }
    }

    appt.status = status;
    await appt.save();
    res.json({ appointment: appt });
  } catch (err) { next(err); }
});

// PATCH /api/appointments/:id/reschedule
router.patch("/:id/reschedule", protect, async (req, res, next) => {
  try {
    const { date, slot } = req.body;
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: "No appointment with that id" });
    if (req.user.role === "patient" && String(appt.patient) !== String(req.user._id)) {
      return res.status(403).json({ message: "That isn't your appointment" });
    }

    const clash = await Appointment.findOne({
      doctor: appt.doctor, date, slot, _id: { $ne: appt._id },
      status: { $in: ["Pending", "Confirmed"] },
    });
    if (clash) return res.status(409).json({ message: "That slot is taken. Pick another time." });

    appt.date = date;
    appt.slot = slot;
    appt.status = "Pending";
    await appt.save();
    res.json({ appointment: appt });
  } catch (err) { next(err); }
});

// PATCH /api/appointments/:id/prescription — doctor only
router.patch("/:id/prescription", protect, allow("doctor", "admin"), async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: "No appointment with that id" });

    appt.prescription = req.body.prescription ?? appt.prescription;
    appt.notes = req.body.notes ?? appt.notes;
    if (req.body.complete) appt.status = "Completed";
    await appt.save();
    res.json({ appointment: appt });
  } catch (err) { next(err); }
});

module.exports = router;

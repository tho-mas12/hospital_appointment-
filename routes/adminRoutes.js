const router = require("express").Router();
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const { protect, allow } = require("../middleware/auth");

router.use(protect, allow("admin"));

// GET /api/admin/stats — the numbers behind the dashboard cards and charts
router.get("/stats", async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [totalPatients, totalDoctors, todaysAppointments, pending, revenueAgg, byDepartment, byStatus] =
      await Promise.all([
        User.countDocuments({ role: "patient" }),
        Doctor.countDocuments({ active: true }),
        Appointment.countDocuments({ date: today }),
        Appointment.countDocuments({ status: "Pending" }),
        Appointment.aggregate([
          { $match: { status: { $ne: "Cancelled" } } },
          { $group: { _id: null, total: { $sum: "$fee" } } },
        ]),
        Appointment.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]),
        Appointment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      ]);

    // Last 7 days of bookings, for the trend line
    const since = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
    const trend = await Appointment.aggregate([
      { $match: { date: { $gte: since } } },
      { $group: { _id: "$date", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalPatients,
      totalDoctors,
      todaysAppointments,
      pending,
      revenue: revenueAgg[0]?.total || 0,
      byDepartment,
      byStatus,
      trend,
    });
  } catch (err) { next(err); }
});

// GET /api/admin/users?role=patient
router.get("/users", async (req, res, next) => {
  try {
    const query = req.query.role ? { role: req.query.role } : {};
    const users = await User.find(query).sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Doctor.findOneAndDelete({ user: req.params.id });
    res.json({ message: "Account removed" });
  } catch (err) { next(err); }
});

// PATCH /api/admin/doctors/:id — activate, deactivate, adjust fee
router.patch("/doctors/:id", async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doctor) return res.status(404).json({ message: "No doctor with that id" });
    res.json({ doctor });
  } catch (err) { next(err); }
});

module.exports = router;

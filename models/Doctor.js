const mongoose = require("mongoose");

const DEPARTMENTS = [
  "cardiology", "neurology", "orthopedics", "pediatrics",
  "dermatology", "general", "ent", "dental",
];

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    specialization: { type: String, required: true },
    qualification: { type: String, required: true },
    experience: { type: Number, default: 0 },
    fee: { type: Number, required: true, min: 0 },
    room: String,
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
    availableDays: [{ type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }],
    slots: [String],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

doctorSchema.index({ department: 1, active: 1 });

const Doctor = mongoose.model("Doctor", doctorSchema);
Doctor.DEPARTMENTS = DEPARTMENTS;
module.exports = Doctor;

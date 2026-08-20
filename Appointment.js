const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },

    patientName: { type: String, required: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, enum: ["Female", "Male", "Other"], required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },

    department: { type: String, required: true },
    date: { type: String, required: true },   // YYYY-MM-DD
    slot: { type: String, required: true },   // "10:00 AM"
    symptoms: { type: String, required: true },
    fee: { type: Number, required: true },

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
      default: "Pending",
    },
    prescription: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// A doctor cannot hold two live appointments in the same slot.
appointmentSchema.index(
  { doctor: 1, date: 1, slot: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["Pending", "Confirmed"] } } }
);

appointmentSchema.pre("save", function (next) {
  if (!this.reference) this.reference = "APT-" + Date.now().toString().slice(-6);
  next();
});

module.exports = mongoose.model("Appointment", appointmentSchema);

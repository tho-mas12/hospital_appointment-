const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    emoji: { type: String, default: "🩺" },
    blurb: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);

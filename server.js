require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(null, process.env.CLIENT_URL || "*");
      }
    },
    credentials: true,
  })
);
app.use(express.json());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// Sign-in and registration are the endpoints worth throttling.
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 40 }));

app.get("/", (req, res) =>
  res.json({ message: "Medicare Hospital Appointment API is running!", health: "/api/health" })
);

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/departments", require("./routes/departmentRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

module.exports = app;

/**
 * Seeds the database with the same demo data the front end ships with.
 * Run once: npm run seed
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Doctor = require("./models/Doctor");
const Appointment = require("./models/Appointment");
const Department = require("./models/Department");


const SLOTS = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM"];

const DOCTORS = [
  { name: "Dr. Ananya Rao", department: "cardiology", specialization: "Interventional Cardiologist", qualification: "MBBS, MD, DM (Cardiology)", experience: 14, fee: 700, room: "B-204", rating: 4.9, reviews: 312, availableDays: ["Mon", "Tue", "Thu", "Fri"] },
  { name: "Dr. Vikram Iyer", department: "cardiology", specialization: "Cardiac Electrophysiologist", qualification: "MBBS, MD, DNB", experience: 9, fee: 650, room: "B-207", rating: 4.7, reviews: 158, availableDays: ["Wed", "Fri", "Sat"] },
  { name: "Dr. Meera Krishnan", department: "neurology", specialization: "Consultant Neurologist", qualification: "MBBS, MD, DM (Neurology)", experience: 17, fee: 800, room: "C-112", rating: 4.8, reviews: 289, availableDays: ["Mon", "Wed", "Fri"] },
  { name: "Dr. Arjun Menon", department: "orthopedics", specialization: "Joint Replacement Surgeon", qualification: "MBBS, MS (Ortho)", experience: 12, fee: 600, room: "A-018", rating: 4.6, reviews: 204, availableDays: ["Tue", "Thu", "Sat"] },
  { name: "Dr. Priya Suresh", department: "pediatrics", specialization: "Neonatologist", qualification: "MBBS, MD (Paediatrics)", experience: 11, fee: 500, room: "D-005", rating: 4.9, reviews: 401, availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { name: "Dr. Karthik Balan", department: "dermatology", specialization: "Clinical Dermatologist", qualification: "MBBS, MD (DVL)", experience: 8, fee: 550, room: "A-221", rating: 4.5, reviews: 137, availableDays: ["Wed", "Thu", "Sat"] },
  { name: "Dr. Fathima Noor", department: "general", specialization: "General Physician", qualification: "MBBS, MD (Gen. Med)", experience: 15, fee: 400, room: "G-101", rating: 4.7, reviews: 356, availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
  { name: "Dr. Rohan Desai", department: "ent", specialization: "ENT & Cochlear Surgeon", qualification: "MBBS, MS (ENT)", experience: 10, fee: 550, room: "C-330", rating: 4.6, reviews: 172, availableDays: ["Mon", "Thu", "Fri"] },
  { name: "Dr. Sneha Pillai", department: "dental", specialization: "Orthodontist", qualification: "BDS, MDS", experience: 7, fee: 450, room: "E-014", rating: 4.8, reviews: 221, availableDays: ["Tue", "Wed", "Fri", "Sat"] },
  { name: "Dr. Hari Prasad", department: "orthopedics", specialization: "Spine Surgeon", qualification: "MBBS, MS, Fellowship (Spine)", experience: 19, fee: 850, room: "A-024", rating: 4.9, reviews: 268, availableDays: ["Mon", "Wed", "Sat"] },
];

const slug = (n) => n.replace("Dr. ", "").toLowerCase().replace(/\s+/g, ".");

(async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Doctor.deleteMany({}),
    Appointment.deleteMany({}),
    Department.deleteMany({}),
  ]);

  const DEPARTMENTS = [
    { id: "cardiology", name: "Cardiology", emoji: "❤️", blurb: "Heart, rhythm and vascular care" },
    { id: "neurology", name: "Neurology", emoji: "🧠", blurb: "Brain, spine and nerve disorders" },
    { id: "orthopedics", name: "Orthopedics", emoji: "🦴", blurb: "Bones, joints and sports injury" },
    { id: "pediatrics", name: "Pediatrics", emoji: "👶", blurb: "Newborn to adolescent health" },
    { id: "dermatology", name: "Dermatology", emoji: "🩺", blurb: "Skin, hair and allergy clinics" },
    { id: "general", name: "General Medicine", emoji: "🏥", blurb: "Everyday illness and check-ups" },
    { id: "ent", name: "ENT", emoji: "👂", blurb: "Ear, nose, throat and hearing" },
    { id: "dental", name: "Dental", emoji: "🦷", blurb: "Oral surgery and orthodontics" },
  ];
  await Department.create(DEPARTMENTS);

  await User.create({ name: "Hospital Admin", email: "admin@medicare-hospital.in", password: "admin123", phone: "+91 431 4001200", role: "admin" });

  const patient = await User.create({
    name: "Nithya Raman", email: "nithya@mail.com", password: "patient123",
    phone: "+91 98400 11223", role: "patient", age: 29, gender: "Female", bloodGroup: "O+",
  });

  const created = [];
  for (const d of DOCTORS) {
    const u = await User.create({
      name: d.name, email: `${slug(d.name)}@medicare-hospital.in`,
      password: "doctor123", phone: "+91 98400 00000", role: "doctor",
    });
    created.push(await Doctor.create({ user: u._id, slots: SLOTS, ...d }));
  }

  const today = new Date();
  const day = (n) => new Date(today.getTime() + n * 864e5).toISOString().slice(0, 10);

  await Appointment.create([
    { patient: patient._id, doctor: created[0]._id, patientName: patient.name, age: 29, gender: "Female", phone: patient.phone, email: patient.email, department: "cardiology", date: day(1), slot: "10:00 AM", symptoms: "Chest tightness while climbing stairs", fee: 700, status: "Confirmed", reference: "APT-10041" },
    { patient: patient._id, doctor: created[6]._id, patientName: patient.name, age: 29, gender: "Female", phone: patient.phone, email: patient.email, department: "general", date: day(4), slot: "05:00 PM", symptoms: "Recurring fever, mild cough", fee: 400, status: "Pending", reference: "APT-10042" },
    { patient: patient._id, doctor: created[5]._id, patientName: patient.name, age: 29, gender: "Female", phone: patient.phone, email: patient.email, department: "dermatology", date: day(-6), slot: "11:00 AM", symptoms: "Skin rash on forearm", fee: 550, status: "Completed", prescription: "Mometasone 0.1% cream, at night, 10 days", notes: "Contact dermatitis. Review only if it spreads.", reference: "APT-10038" },
  ]);

  console.log("Seeded. Log in with:");
  console.log("  admin@medicare-hospital.in / admin123");
  console.log("  nithya@mail.com / patient123");
  console.log("  ananya.rao@medicare-hospital.in / doctor123");
  await mongoose.connection.close();
})();

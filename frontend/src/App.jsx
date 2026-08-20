import React, { useState, useEffect, useMemo } from "react";
import {
  Menu, X, Sun, Moon, Search, Calendar, Clock, User, Users, Phone, Mail,
  MapPin, ChevronRight, ChevronDown, Star, Check, CheckCircle2, XCircle,
  Download, LogOut, Activity, Shield, Stethoscope, Filter, Bell,
  TrendingUp, FileText, Settings, AlertTriangle, ArrowRight, Loader2,
  ClipboardList, HeartPulse, Building2, Award, Ambulance, Globe,
  Share2, RefreshCw, Trash2, Plus, Quote
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

/* ------------------------------------------------------------------ */
/*  API Client Configuration                                          */
/* ------------------------------------------------------------------ */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function apiCall(path, method = "GET", body = null, token = null) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const config = {
    method,
    headers,
  };
  if (body) {
    config.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_URL}${path}`, config);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "An unexpected error occurred.");
  }
  return data;
}

const INITIAL_DEPARTMENTS = [
  { id: "cardiology", name: "Cardiology", emoji: "❤️", blurb: "Heart, rhythm and vascular care", doctors: 14 },
  { id: "neurology", name: "Neurology", emoji: "🧠", blurb: "Brain, spine and nerve disorders", doctors: 11 },
  { id: "orthopedics", name: "Orthopedics", emoji: "🦴", blurb: "Bones, joints and sports injury", doctors: 13 },
  { id: "pediatrics", name: "Pediatrics", emoji: "👶", blurb: "Newborn to adolescent health", doctors: 16 },
  { id: "dermatology", name: "Dermatology", emoji: "🩺", blurb: "Skin, hair and allergy clinics", doctors: 9 },
  { id: "general", name: "General Medicine", emoji: "🏥", blurb: "Everyday illness and check-ups", doctors: 21 },
  { id: "ent", name: "ENT", emoji: "👂", blurb: "Ear, nose, throat and hearing", doctors: 8 },
  { id: "dental", name: "Dental", emoji: "🦷", blurb: "Oral surgery and orthodontics", doctors: 10 },
];

const SLOTS = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM"];

const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };

const TESTIMONIALS = [
  { name: "Lakshmi N.", role: "Booked with Cardiology", text: "I booked a slot at 11 at night and walked in the next morning at 10. No queue, no phone calls, no arguing with a receptionist." },
  { name: "Imran S.", role: "Parent, Pediatrics", text: "Seeing which days a paediatrician actually sits saved me two wasted trips with a sick child in the car." },
  { name: "Deepa R.", role: "Follow-up patient", text: "My prescription from the last visit was already in the app, so I stopped carrying a folder of paper to every appointment." },
];

const HEALTH_TIPS = [
  { tag: "Heart", title: "What your resting heart rate is telling you", read: "4 min", text: "A resting rate that drifts upward over months is worth a conversation, even when you feel fine." },
  { tag: "Nutrition", title: "Reading a food label in under ten seconds", read: "3 min", text: "Start at the bottom: added sugar and sodium per serving say more than the calorie count on top." },
  { tag: "Sleep", title: "Why the 3 a.m. wake-up keeps happening", read: "5 min", text: "Fragmented sleep is usually a timing problem, not a duration problem. Fix the schedule first." },
];

const FAQS = [
  { q: "How far in advance can I book?", a: "Up to 30 days ahead. Slots open at midnight for the new day, and same-day booking stays open until two hours before the slot." },
  { q: "Can I cancel or move my appointment?", a: "Yes. Cancel or reschedule from your dashboard any time up to two hours before the slot. After that, call the front desk on 0431 400 1200." },
  { q: "Do I pay online?", a: "Not in this release. Consultation fees are collected at the counter. Online payment is planned for the next version." },
  { q: "Will I get a reminder?", a: "You get a confirmation immediately, then a reminder 24 hours and 2 hours before your slot by email and SMS." },
  { q: "What if it's an emergency?", a: "Don't book online. Call 0431 400 1188 or come straight to the emergency entrance on Gate 2, open 24/7." },
];

const AV_COLORS = ["from-blue-500 to-sky-400", "from-emerald-500 to-teal-400", "from-indigo-500 to-blue-400",
  "from-teal-500 to-emerald-400", "from-sky-600 to-cyan-400", "from-violet-500 to-indigo-400"];

/* ------------------------------------------------------------------ */
/*  Root Component                                                    */
/* ------------------------------------------------------------------ */

export default function App() {
  const [dark, setDark] = useState(false);
  const [booting, setBooting] = useState(true);
  const [route, setRoute] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [appts, setAppts] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [prefill, setPrefill] = useState(null);
  const [reschedule, setReschedule] = useState(null);

  const DEPT_NAME = (id) => (departments.find((d) => d.id === id) || {}).name || id;
  const INITIALS = (n) => n.replace("Dr. ", "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  // Fetch doctors, departments, and appointments on boot
  useEffect(() => {
    async function loadInitialData() {
      try {
        const docData = await apiCall("/doctors");
        setDoctors(docData.doctors || []);
        
        try {
          const deptData = await apiCall("/departments");
          if (deptData.departments && deptData.departments.length > 0) {
            setDepartments(deptData.departments);
          }
        } catch (err) {
          console.error("Failed to load departments from API, using defaults:", err.message);
        }

        if (token) {
          try {
            const userData = await apiCall("/auth/me", "GET", null, token);
            setUser(userData.user);
            const apptData = await apiCall("/appointments", "GET", null, token);
            setAppts(apptData.appointments || []);
          } catch (err) {
            // Token expired or invalid
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Initial load failed:", err.message);
      } finally {
        setBooting(false);
      }
    }
    loadInitialData();
  }, [token]);

  // Load appointments whenever token changes or route is accessed
  const refreshAppointments = async () => {
    if (!token) return;
    try {
      const apptData = await apiCall("/appointments", "GET", null, token);
      setAppts(apptData.appointments || []);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const go = (r, opts = {}) => {
    setRoute(r);
    setMenuOpen(false);
    if (opts.prefill !== undefined) setPrefill(opts.prefill);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toast = (msg, kind = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setAppts([]);
    go("home");
    toast("Signed out", "info");
  };

  const DOC = (id) => doctors.find((d) => String(d._id || d.id) === String(id)) || {};

  const S = theme(dark);

  if (booting) return <Splash dark={dark} />;

  const guard = (r) => {
    const need = { patient: "patient", doctor: "doctor", admin: "admin" }[r];
    if (!need) return r;
    if (!user) return "login";
    if (user.role !== need) return user.role;
    return r;
  };
  const active = guard(route);

  return (
    <div className={`min-h-screen ${S.page} transition-colors duration-300`}>
      <Styles />
      <EmergencyBanner />
      <Nav {...{ S, dark, setDark, route: active, go, user, logout, menuOpen, setMenuOpen, toast }} />

      <main>
        {active === "home" && <Home {...{ S, go, doctors, departments }} />}
        {active === "doctors" && <DoctorsPage {...{ S, go, doctors, DOC, departments, DEPT_NAME }} />}
        {active === "departments" && <DepartmentsPage {...{ S, go, departments }} />}
        {active === "book" && (
          <BookPage {...{ S, go, toast, appts, setAppts, user, token, prefill, setPrefill, reschedule, setReschedule, doctors, DOC, refreshAppointments, departments, DEPT_NAME }} />
        )}
        {active === "about" && <AboutPage {...{ S, go, departments }} />}
        {active === "contact" && <ContactPage {...{ S, toast }} />}
        {(active === "login" || active === "register") && (
          <AuthPage {...{ S, mode: active, go, setUser, setToken, toast, departments, DEPT_NAME }} />
        )}
        {active === "patient" && (
          <PatientDash {...{ S, user, token, appts, setAppts, toast, go, setReschedule, doctors, DOC, refreshAppointments, departments, DEPT_NAME }} />
        )}
        {active === "doctor" && <DoctorDash {...{ S, user, token, appts, setAppts, toast, doctors, DOC, refreshAppointments, departments, DEPT_NAME }} />}
        {active === "admin" && <AdminDash {...{ S, appts, setAppts, toast, token, doctors, setDoctors, DOC, refreshAppointments, departments, setDepartments, DEPT_NAME }} />}
      </main>

      <Footer {...{ S, go, departments }} />
      <Toasts {...{ toasts, S }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Theme + global styles                                              */
/* ------------------------------------------------------------------ */

function theme(dark) {
  return {
    dark,
    page: dark ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-700",
    head: dark ? "text-white" : "text-slate-900",
    sub: dark ? "text-slate-400" : "text-slate-500",
    card: dark
      ? "bg-slate-900/70 border border-slate-800 backdrop-blur-md"
      : "bg-white/80 border border-slate-200 backdrop-blur-md",
    solid: dark ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200",
    soft: dark ? "bg-slate-800/60" : "bg-slate-100",
    line: dark ? "border-slate-800" : "border-slate-200",
    input: dark
      ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-sky-500"
      : "bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-sky-500",
    navBg: dark ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200",
    chip: dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600",
    hoverRow: dark ? "hover:bg-slate-800/50" : "hover:bg-slate-50",
  };
}

function Styles() {
  return (
    <style>{`
      @keyframes fadeUp { from { opacity:0; transform: translateY(14px);} to {opacity:1; transform:none;} }
      @keyframes floaty { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      @keyframes ring { 0%{box-shadow:0 0 0 0 rgba(14,165,233,.45)} 70%{box-shadow:0 0 0 16px rgba(14,165,233,0)} 100%{box-shadow:0 0 0 0 rgba(14,165,233,0)} }
      @keyframes slideIn { from{opacity:0; transform:translateX(28px)} to{opacity:1;transform:none} }
      @keyframes beat { 0%,100%{transform:scale(1)} 14%{transform:scale(1.18)} 28%{transform:scale(1)} 42%{transform:scale(1.12)} 56%{transform:scale(1)} }
      @keyframes sweep { from{background-position:0% 50%} to{background-position:200% 50%} }
      .fade-up { animation: fadeUp .6s cubic-bezier(.2,.7,.3,1) both; }
      .floaty { animation: floaty 6s ease-in-out infinite; }
      .ring-pulse { animation: ring 2.2s infinite; }
      .slide-in { animation: slideIn .35s cubic-bezier(.2,.7,.3,1) both; }
      .beat { animation: beat 2.4s ease-in-out infinite; display:inline-block; }
      .sweep { background-size:200% 100%; animation: sweep 3s linear infinite; }
      .ecg path { stroke-dasharray: 1400; stroke-dashoffset: 1400; animation: draw 4s linear infinite; }
      @keyframes draw { to { stroke-dashoffset: 0; } }
      @media (prefers-reduced-motion: reduce) {
        .fade-up,.floaty,.ring-pulse,.slide-in,.beat,.sweep,.ecg path { animation: none !important; }
      }
      .no-spin::-webkit-outer-spin-button,.no-spin::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
    `}</style>
  );
}

function Splash({ dark }) {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center gap-6 ${dark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 grid place-items-center ring-pulse">
          <HeartPulse className="w-10 h-10 text-white beat" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-xl font-semibold text-sky-600">MediCare Hospital</p>
        <p className={`text-sm mt-1 ${dark ? "text-slate-500" : "text-slate-400"}`}>Preparing your appointment desk…</p>
      </div>
      <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
    </div>
  );
}

function EmergencyBanner() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 sweep text-white text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        <Ambulance className="w-4 h-4 shrink-0" />
        <p className="flex-1">
          <span className="font-semibold">Emergency, 24/7:</span> call 0431 400 1188 or come to Gate 2. Don't book online for emergencies.
        </p>
        <button onClick={() => setOpen(false)} aria-label="Dismiss emergency notice"
          className="p-1 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const NAV = [
  ["home", "Home"], ["doctors", "Doctors"], ["departments", "Departments"],
  ["book", "Book appointment"], ["about", "About"], ["contact", "Contact"],
];

function Nav({ S, dark, setDark, route, go, user, logout, menuOpen, setMenuOpen }) {
  const dashFor = user ? user.role : null;
  return (
    <header className={`sticky top-0 z-40 border-b ${S.navBg} backdrop-blur-xl`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-16 flex items-center gap-4">
          <button onClick={() => go("home")} className="flex items-center gap-2.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-lg px-1">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 grid place-items-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </span>
            <span className="text-left leading-tight">
              <span className={`block font-bold ${S.head}`}>MediCare</span>
              <span className="block text-[10px] tracking-widest uppercase text-sky-600">Hospital</span>
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {NAV.map(([k, label]) => (
              <button key={k} onClick={() => go(k)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  route === k ? "text-sky-600 bg-sky-500/10" : `${S.sub} hover:text-sky-600`}`}>
                {label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setDark(!dark)} aria-label="Toggle dark mode"
              className={`p-2 rounded-lg ${S.soft} hover:text-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500`}>
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <button onClick={() => go(dashFor)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <Avatar name={user.name} size={22} i={2} />
                  <span className="max-w-[120px] truncate">{user.name.split(" ")[0]}</span>
                </button>
                <button onClick={logout}
                  aria-label="Sign out"
                  className={`p-2 rounded-lg ${S.soft} hover:text-rose-500 focus:outline-none focus:ring-2 focus:ring-sky-500`}>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button onClick={() => go("login")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${S.sub} hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500`}>
                  Log in
                </button>
                <button onClick={() => go("register")}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/20 focus:outline-none focus:ring-2 focus:ring-sky-500">
                  Register
                </button>
              </div>
            )}

            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu"
              className={`lg:hidden p-2 rounded-lg ${S.soft} focus:outline-none focus:ring-2 focus:ring-sky-500`}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className={`lg:hidden border-t ${S.line} px-4 py-3 space-y-1 slide-in`}>
          {NAV.map(([k, label]) => (
            <button key={k} onClick={() => go(k)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                route === k ? "text-sky-600 bg-sky-500/10" : S.sub}`}>
              {label}
            </button>
          ))}
          <div className={`pt-2 mt-2 border-t ${S.line} flex gap-2`}>
            {user ? (
              <>
                <button onClick={() => go(dashFor)} className="flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold bg-sky-500/10 text-sky-600">My dashboard</button>
                <button onClick={logout} className="px-3 py-2.5 rounded-lg text-sm font-medium text-rose-500">Sign out</button>
              </>
            ) : (
              <>
                <button onClick={() => go("login")} className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium ${S.soft}`}>Log in</button>
                <button onClick={() => go("register")} className="flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600">Register</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Toasts({ toasts, S }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 w-[min(92vw,340px)]">
      {toasts.map((t) => (
        <div key={t.id} role="status"
          className={`slide-in flex items-start gap-3 p-3.5 rounded-xl shadow-xl ${S.solid}`}>
          {t.kind === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
          {t.kind === "error" && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
          {t.kind === "info" && <Bell className="w-5 h-5 text-sky-500 shrink-0" />}
          <p className={`text-sm ${S.head}`}>{t.msg}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small shared UI                                                    */
/* ------------------------------------------------------------------ */

function Avatar({ name, size = 56, i = 0 }) {
  const grad = AV_COLORS[i % AV_COLORS.length];
  return (
    <span
      className={`inline-grid place-items-center rounded-full bg-gradient-to-br ${grad} text-white font-semibold shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {INITIALS(name)}
    </span>
  );
}

const INITIALS = (n) => n.replace("Dr. ", "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

function Section({ children, className = "" }) {
  return <section className={`max-w-7xl mx-auto px-4 py-16 sm:py-20 ${className}`}>{children}</section>;
}

function Eyebrow({ children }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-sky-600">
      <span className="w-6 h-px bg-sky-500" />{children}
    </span>
  );
}

function Field({ S, label, children, error, req }) {
  return (
    <label className="block">
      <span className={`block text-sm font-medium mb-1.5 ${S.head}`}>
        {label}{req && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 flex items-center gap-1 text-xs text-rose-500"><AlertTriangle className="w-3 h-3" />{error}</span>}
    </label>
  );
}

const inputCls = (S, err) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:ring-2 focus:ring-sky-500/30 ${S.input} ${err ? "border-rose-400" : ""}`;

function StatusPill({ status }) {
  const map = {
    Confirmed: "bg-emerald-500/12 text-emerald-600 border-emerald-500/30",
    Pending: "bg-amber-500/12 text-amber-600 border-amber-500/30",
    Completed: "bg-sky-500/12 text-sky-600 border-sky-500/30",
    Cancelled: "bg-rose-500/12 text-rose-600 border-rose-500/30",
  };
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status]}`}>{status}</span>;
}

function Stars({ value }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(value) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
      ))}
    </span>
  );
}

function Modal({ S, open, onClose, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className={`fade-up w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl p-6 shadow-2xl ${S.solid} max-h-[86vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Home                                                               */
/* ------------------------------------------------------------------ */

function Home({ S, go, doctors, departments }) {
  return (
    <>
      <Hero S={S} go={go} doctors={doctors} />
      <Stats S={S} />
      <AboutStrip S={S} />
      <DeptGrid S={S} go={go} limit={8} departments={departments} />
      <FeaturedDoctors S={S} go={go} doctors={doctors} />
      <HowItWorks S={S} />
      <Testimonials S={S} />
      <HealthTips S={S} />
      <FAQ S={S} />
      <CTA S={S} go={go} />
    </>
  );
}

function Hero({ S, go, doctors }) {
  const nextAvailable = useMemo(() => {
    return doctors.filter(d => d.active).slice(0, 3);
  }, [doctors]);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-emerald-500/10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-sky-400/20 blur-3xl floaty" />
      <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="fade-up">
          <Eyebrow>Tiruchirappalli · 24/7 emergency</Eyebrow>
          <h1 className={`mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight ${S.head}`}>
            Book your hospital appointment{" "}
            <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">anytime, anywhere</span>
          </h1>
          <p className={`mt-5 text-lg leading-relaxed ${S.sub} max-w-lg`}>
            Find a doctor by specialisation, see the days they actually sit, and hold a slot in about a minute. No phone queue, no walk-in guesswork.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => go("book")}
              className="group px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
              <span className="flex items-center gap-2">Book appointment
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
            </button>
            <button onClick={() => go("doctors")}
              className={`px-6 py-3.5 rounded-xl font-semibold border transition-all hover:-translate-y-0.5 ${S.card} ${S.head} focus:outline-none focus:ring-2 focus:ring-sky-500`}>
              <span className="flex items-center gap-2"><Search className="w-4 h-4" />Find doctors</span>
            </button>
          </div>

          <div className={`mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm ${S.sub}`}>
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-500" />NABH accredited</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-sky-500" />Avg. wait 12 min</span>
            <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-500" />Since 1998</span>
          </div>
        </div>

        <div className="fade-up" style={{ animationDelay: ".12s" }}>
          <div className={`relative rounded-3xl p-6 shadow-2xl ${S.card}`}>
            <svg className="ecg absolute inset-x-0 top-0 h-24 w-full opacity-70" viewBox="0 0 600 96" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0,60 L90,60 L108,60 L120,26 L134,86 L150,60 L240,60 L258,60 L270,30 L284,84 L300,60 L390,60 L408,60 L420,26 L434,86 L450,60 L600,60"
                fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
            <div className="relative pt-16">
              <p className={`text-xs uppercase tracking-widest ${S.sub}`}>Next available today</p>
              <div className="mt-4 space-y-3">
                {nextAvailable.length === 0 ? (
                  <p className={`text-sm ${S.sub} text-center py-6`}>No active doctors found. Seed the database!</p>
                ) : nextAvailable.map((d, i) => (
                  <div key={d._id || d.id} className={`flex items-center gap-3 p-3 rounded-2xl ${S.soft}`}>
                    <Avatar name={d.name} size={44} i={i} />
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm truncate ${S.head}`}>{d.name}</p>
                      <p className={`text-xs truncate ${S.sub}`}>{d.specialization}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">{(d.slots && d.slots[i]) || "09:00 AM"}</p>
                      <p className={`text-[11px] ${S.sub}`}>₹{d.fee}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => go("book")}
                className="mt-4 w-full py-3 rounded-2xl font-semibold text-sm text-sky-700 bg-sky-500/12 hover:bg-sky-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500">
                See all open slots
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stats({ S }) {
  const items = [
    { n: "100+", l: "Doctors", icon: Stethoscope },
    { n: "20+", l: "Departments", icon: Building2 },
    { n: "10,000+", l: "Happy patients", icon: Users },
    { n: "24/7", l: "Support", icon: Activity },
  ];
  return (
    <div className="max-w-7xl mx-auto px-4 -mt-6">
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 rounded-3xl p-6 ${S.card} shadow-xl`}>
        {items.map((s) => (
          <div key={s.l} className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-sky-500/12 grid place-items-center shrink-0">
              <s.icon className="w-5 h-5 text-sky-600" />
            </span>
            <div>
              <p className={`text-2xl font-bold ${S.head}`}>{s.n}</p>
              <p className={`text-xs ${S.sub}`}>{s.l}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutStrip({ S }) {
  const items = [
    { t: "Experienced doctors", d: "Consultants averaging 12 years in practice, with sub-specialty fellowships.", icon: Award },
    { t: "Advanced facilities", d: "Cath lab, 3T MRI, 24-bed ICU and an in-house diagnostic wing.", icon: Building2 },
    { t: "Emergency care", d: "Trauma team on site round the clock, ambulance dispatch in under 8 minutes.", icon: Ambulance },
    { t: "Modern equipment", d: "Digital imaging and reporting, with results in your dashboard the same day.", icon: Activity },
    { t: "Quality healthcare", d: "NABH accredited, with published infection and readmission rates.", icon: Shield },
  ];
  return (
    <Section>
      <div className="max-w-2xl">
        <Eyebrow>About the hospital</Eyebrow>
        <h2 className={`mt-4 text-3xl sm:text-4xl font-bold tracking-tight ${S.head}`}>Care that runs on time</h2>
        <p className={`mt-3 ${S.sub}`}>
          Five specialty blocks, one appointment desk. Everything below is what patients ask about most before they book.
        </p>
      </div>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((it, i) => (
          <div key={it.t} className={`fade-up rounded-2xl p-6 ${S.card} hover:-translate-y-1 transition-transform`}
            style={{ animationDelay: `${i * 60}ms` }}>
            <span className="w-11 h-11 rounded-2xl bg-emerald-500/12 grid place-items-center">
              <it.icon className="w-5 h-5 text-emerald-600" />
            </span>
            <h3 className={`mt-4 font-semibold ${S.head}`}>{it.t}</h3>
            <p className={`mt-1.5 text-sm leading-relaxed ${S.sub}`}>{it.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function DeptGrid({ S, go, limit, departments }) {
  const list = limit ? departments.slice(0, limit) : departments;
  return (
    <Section className="pt-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Departments</Eyebrow>
          <h2 className={`mt-4 text-3xl sm:text-4xl font-bold tracking-tight ${S.head}`}>Where would you like to be seen?</h2>
        </div>
        <button onClick={() => go("departments")}
          className="flex items-center gap-1 text-sm font-semibold text-sky-600 hover:gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 rounded px-1">
          All departments <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {list.map((d, i) => (
          <button key={d.id} onClick={() => go("book", { prefill: { dept: d.id } })}
            className={`fade-up group text-left rounded-2xl p-5 ${S.card} hover:-translate-y-1 hover:border-sky-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500`}
            style={{ animationDelay: `${i * 45}ms` }}>
            <span className="text-3xl block">{d.emoji || "🩺"}</span>
            <h3 className={`mt-3 font-semibold ${S.head}`}>{d.name}</h3>
            <p className={`mt-1 text-xs leading-relaxed ${S.sub}`}>{d.blurb}</p>
            <p className="mt-3 text-xs font-semibold text-sky-600 flex items-center gap-1">
              Check availability <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </p>
          </button>
        ))}
      </div>
    </Section>
  );
}

function FeaturedDoctors({ S, go, doctors }) {
  const top = useMemo(() => {
    return [...doctors].sort((a, b) => b.rating - a.rating).slice(0, 3);
  }, [doctors]);

  return (
    <Section className="pt-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Our specialists</Eyebrow>
          <h2 className={`mt-4 text-3xl sm:text-4xl font-bold tracking-tight ${S.head}`}>Highest rated this month</h2>
        </div>
        <button onClick={() => go("doctors")}
          className="flex items-center gap-1 text-sm font-semibold text-sky-600 hover:gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 rounded px-1">
          Browse all doctors <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {top.length === 0 ? (
          <p className={`text-sm ${S.sub} text-center col-span-3 py-10`}>No doctors available. Populate the database.</p>
        ) : top.map((d, i) => <DoctorCard key={d._id || d.id} d={d} i={i} S={S} go={go} />)}
      </div>
    </Section>
  );
}

function DoctorCard({ d, i, S, go }) {
  return (
    <div className={`fade-up rounded-2xl p-6 ${S.card} hover:-translate-y-1 transition-transform`} style={{ animationDelay: `${i * 50}ms` }}>
      <div className="flex items-start gap-4">
        <Avatar name={d.name} size={60} i={i} />
        <div className="min-w-0">
          <h3 className={`font-semibold ${S.head}`}>{d.name}</h3>
          <p className="text-sm text-sky-600">{d.specialization}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Stars value={d.rating} />
            <span className={`text-xs ${S.sub}`}>{d.rating} · {d.reviews}</span>
          </div>
        </div>
      </div>

      <dl className={`mt-5 space-y-2 text-sm ${S.sub}`}>
        <div className="flex justify-between gap-3">
          <dt>Experience</dt><dd className={`font-medium ${S.head}`}>{d.experience} years</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Qualification</dt><dd className={`font-medium text-right ${S.head}`}>{d.qualification}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Consultation</dt><dd className="font-semibold text-emerald-600">₹{d.fee}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span key={day}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium ${
              d.availableDays && d.availableDays.includes(day) ? "bg-emerald-500/12 text-emerald-600" : `${S.chip} opacity-40 line-through`}`}>
            {day}
          </span>
        ))}
      </div>

      <button onClick={() => go("book", { prefill: { dept: d.department, doctorId: d._id || d.id } })}
        className="mt-5 w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500">
        Book appointment
      </button>
    </div>
  );
}

function HowItWorks({ S }) {
  const steps = [
    { t: "Pick a department", d: "Eight specialties, each with the consultants who sit that week." },
    { t: "Choose a doctor and slot", d: "Booked slots grey out live, so what you see is what's free." },
    { t: "Confirm and arrive", d: "Your slip carries a token number. Show it at the counter and skip the queue." },
  ];
  return (
    <Section className="pt-0">
      <Eyebrow>Three steps</Eyebrow>
      <h2 className={`mt-4 text-3xl sm:text-4xl font-bold tracking-tight ${S.head}`}>How booking works</h2>
      <div className="mt-10 grid md:grid-cols-3 gap-5">
        {steps.map((s, i) => (
          <div key={s.t} className={`relative rounded-2xl p-6 ${S.card}`}>
            <span className="absolute -top-3 left-6 w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white text-sm font-bold grid place-items-center shadow-lg">
              {i + 1}
            </span>
            <h3 className={`mt-4 font-semibold ${S.head}`}>{s.t}</h3>
            <p className={`mt-2 text-sm leading-relaxed ${S.sub}`}>{s.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Testimonials({ S }) {
  return (
    <Section className="pt-0">
      <Eyebrow>Patient voices</Eyebrow>
      <h2 className={`mt-4 text-3xl sm:text-4xl font-bold tracking-tight ${S.head}`}>What changed for them</h2>
      <div className="mt-10 grid md:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <figure key={t.name} className={`rounded-2xl p-6 ${S.card}`}>
            <Quote className="w-7 h-7 text-sky-500/40" />
            <blockquote className={`mt-3 text-sm leading-relaxed ${S.head}`}>{t.text}</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <Avatar name={t.name} size={38} i={i + 3} />
              <span>
                <span className={`block text-sm font-semibold ${S.head}`}>{t.name}</span>
                <span className={`block text-xs ${S.sub}`}>{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

function HealthTips({ S }) {
  return (
    <Section className="pt-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Health tips</Eyebrow>
          <h2 className={`mt-4 text-3xl sm:text-4xl font-bold tracking-tight ${S.head}`}>From our consultants</h2>
        </div>
      </div>
      <div className="mt-10 grid md:grid-cols-3 gap-5">
        {HEALTH_TIPS.map((p, i) => (
          <article key={p.title} className={`rounded-2xl overflow-hidden ${S.card} hover:-translate-y-1 transition-transform`}>
            <div className={`h-28 bg-gradient-to-br ${AV_COLORS[i % AV_COLORS.length]} grid place-items-center`}>
              <span className="text-4xl">{["🫀", "🥗", "🌙"][i]}</span>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-sky-500/12 text-sky-600 font-semibold">{p.tag}</span>
                <span className={S.sub}>{p.read} read</span>
              </div>
              <h3 className={`mt-3 font-semibold leading-snug ${S.head}`}>{p.title}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${S.sub}`}>{p.text}</p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

function FAQ({ S }) {
  const [open, setOpen] = useState(0);
  return (
    <Section className="pt-0">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <Eyebrow>Questions</Eyebrow>
          <h2 className={`mt-4 text-3xl sm:text-4xl font-bold tracking-tight ${S.head}`}>Before you book</h2>
        </div>
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className={`rounded-2xl overflow-hidden ${S.card}`}>
              <button onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex items-center gap-4 p-5 text-left focus:outline-none focus:ring-2 focus:ring-sky-500">
                <span className={`flex-1 font-semibold ${S.head}`}>{f.q}</span>
                <ChevronDown className={`w-5 h-5 shrink-0 text-sky-500 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className={`px-5 pb-5 -mt-1 text-sm leading-relaxed ${S.sub}`}>{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function CTA({ S, go }) {
  return (
    <Section className="pt-0">
      <div className="relative overflow-hidden rounded-3xl p-10 sm:p-14 bg-gradient-to-br from-sky-600 to-blue-700 text-center">
        <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-2xl floaty" />
        <h2 className="relative text-3xl sm:text-4xl font-bold text-white tracking-tight">Your slot is a minute away</h2>
        <p className="relative mt-3 text-sky-100 max-w-xl mx-auto">
          Pick a doctor, choose a time that fits your day, and walk in with a token already in hand.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => go("book")}
            className="px-6 py-3.5 rounded-xl font-semibold text-sky-700 bg-white hover:bg-sky-50 shadow-xl transition-colors focus:outline-none focus:ring-2 focus:ring-white">
            Book appointment
          </button>
          <button onClick={() => go("contact")}
            className="px-6 py-3.5 rounded-xl font-semibold text-white border border-white/40 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white">
            Talk to the front desk
          </button>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Doctors / Departments / About / Contact                            */
/* ------------------------------------------------------------------ */

function DoctorsPage({ S, go, doctors, departments, DEPT_NAME }) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [sort, setSort] = useState("rating");

  const list = useMemo(() => {
    let r = doctors.filter((d) =>
      (dept === "all" || d.department === dept) &&
      (d.name.toLowerCase().includes(q.toLowerCase()) ||
        d.specialization.toLowerCase().includes(q.toLowerCase()) ||
        DEPT_NAME(d.department).toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
    if (sort === "exp") r = [...r].sort((a, b) => b.experience - a.experience);
    if (sort === "fee") r = [...r].sort((a, b) => a.fee - b.fee);
    return r;
  }, [q, dept, sort, doctors]);

  return (
    <Section>
      <Eyebrow>Find a doctor</Eyebrow>
      <h1 className={`mt-4 text-4xl font-bold tracking-tight ${S.head}`}>Our specialists</h1>
      <p className={`mt-3 max-w-xl ${S.sub}`}>Search by name or condition, then filter by specialisation. Fees shown are per consultation.</p>

      <div className={`mt-8 rounded-2xl p-4 ${S.card} grid gap-3 md:grid-cols-[1fr_auto_auto]`}>
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${S.sub}`} />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search doctor, specialisation or department"
            className={`${inputCls(S)} pl-10`} />
        </div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className={inputCls(S)}>
          <option value="all">All specialisations</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputCls(S)}>
          <option value="rating">Top rated</option>
          <option value="exp">Most experienced</option>
          <option value="fee">Lowest fee</option>
        </select>
      </div>

      <p className={`mt-4 text-sm ${S.sub}`}>
        <Filter className="w-3.5 h-3.5 inline mr-1" />{list.length} doctor{list.length !== 1 && "s"} available
      </p>

      {list.length === 0 ? (
        <div className={`mt-8 rounded-2xl p-12 text-center ${S.card}`}>
          <Search className={`w-10 h-10 mx-auto ${S.sub}`} />
          <p className={`mt-4 font-semibold ${S.head}`}>No doctor matches "{q}"</p>
          <p className={`mt-1 text-sm ${S.sub}`}>Try the department name instead, or clear the filters.</p>
          <button onClick={() => { setQ(""); setDept("all"); }}
            className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((d, i) => <DoctorCard key={d._id || d.id} d={d} i={i} S={S} go={go} />)}
        </div>
      )}
    </Section>
  );
}

function DepartmentsPage({ S, go, departments }) {
  return (
    <>
      <Section className="pb-0">
        <Eyebrow>Departments</Eyebrow>
        <h1 className={`mt-4 text-4xl font-bold tracking-tight ${S.head}`}>Hospital specialties</h1>
        <p className={`mt-3 max-w-xl ${S.sub}`}>Pick a department to jump straight into booking with its consultants.</p>
      </Section>
      <DeptGrid S={S} go={go} departments={departments} />
    </>
  );
}

function AboutPage({ S, go }) {
  return (
    <>
      <Section className="pb-0">
        <Eyebrow>About</Eyebrow>
        <h1 className={`mt-4 text-4xl font-bold tracking-tight ${S.head}`}>MediCare Hospital</h1>
        <p className={`mt-4 max-w-2xl leading-relaxed ${S.sub}`}>
          A 320-bed multi-specialty hospital in Tiruchirappalli, running since 1998. This booking system replaced a paper register
          and three phone lines in 2026 — patients now hold their own slots, and the front desk spends its day on people who
          walked in rather than on people who called.
        </p>
      </Section>
      <AboutStrip S={S} />
      <HowItWorks S={S} />
      <CTA S={S} go={go} />
    </>
  );
}

function ContactPage({ S, toast }) {
  const [f, setF] = useState({ name: "", email: "", subject: "", msg: "" });
  const [err, setErr] = useState({});

  const send = () => {
    const e = {};
    if (!f.name.trim()) e.name = "Enter your name";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email address";
    if (f.msg.trim().length < 10) e.msg = "Tell us a little more — at least 10 characters";
    setErr(e);
    if (Object.keys(e).length) return;
    setF({ name: "", email: "", subject: "", msg: "" });
    toast("Message sent. The front desk replies within one working day.");
  };

  const cards = [
    { icon: MapPin, t: "Address", l: ["24 Cantonment Road, Tiruchirappalli", "Tamil Nadu 620001"] },
    { icon: Phone, t: "Phone", l: ["Front desk 0431 400 1200", "Emergency 0431 400 1188"] },
    { icon: Mail, t: "Email", l: ["appointments@medicare-hospital.in", "care@medicare-hospital.in"] },
    { icon: Clock, t: "OPD hours", l: ["Mon–Sat, 9:00 AM – 7:00 PM", "Emergency open 24/7"] },
  ];

  return (
    <Section>
      <Eyebrow>Contact</Eyebrow>
      <h1 className={`mt-4 text-4xl font-bold tracking-tight ${S.head}`}>Reach the hospital</h1>

      <div className="mt-10 grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {cards.map((c) => (
              <div key={c.t} className={`rounded-2xl p-5 ${S.card}`}>
                <span className="w-10 h-10 rounded-xl bg-sky-500/12 grid place-items-center">
                  <c.icon className="w-5 h-5 text-sky-600" />
                </span>
                <h3 className={`mt-3 font-semibold ${S.head}`}>{c.t}</h3>
                {c.l.map((line) => <p key={line} className={`text-sm mt-0.5 ${S.sub}`}>{line}</p>)}
              </div>
            ))}
          </div>

          <div className={`rounded-2xl overflow-hidden ${S.card}`}>
            <div className="relative h-56 bg-gradient-to-br from-sky-500/20 to-emerald-500/20">
              <div className="absolute inset-0 opacity-30"
                style={{ backgroundImage: "linear-gradient(currentColor 1px,transparent 1px),linear-gradient(90deg,currentColor 1px,transparent 1px)", backgroundSize: "34px 34px" }} />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="w-12 h-12 rounded-full bg-rose-500 grid place-items-center mx-auto ring-pulse">
                  <MapPin className="w-6 h-6 text-white" />
                </span>
                <p className={`mt-3 font-semibold ${S.head}`}>MediCare Hospital</p>
                <p className={`text-xs ${S.sub}`}>Cantonment Road · Gate 2 for emergency</p>
              </div>
            </div>
            <div className={`p-4 flex items-center justify-between gap-3 border-t ${S.line}`}>
              <p className={`text-sm ${S.sub}`}>Parking at Gate 1, free for the first two hours.</p>
              <a href="https://maps.google.com/?q=Tiruchirappalli" target="_blank" rel="noreferrer"
                className="text-sm font-semibold text-sky-600 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-sky-500 rounded px-1">
                Open in Maps →
              </a>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 ${S.card} h-fit`}>
          <h2 className={`text-xl font-bold ${S.head}`}>Send a message</h2>
          <p className={`mt-1 text-sm ${S.sub}`}>For appointment changes, use your dashboard — it's faster.</p>
          <div className="mt-6 space-y-4">
            <Field S={S} label="Your name" req error={err.name}>
              <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })}
                className={inputCls(S, err.name)} placeholder="Full name" />
            </Field>
            <Field S={S} label="Email" req error={err.email}>
              <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })}
                className={inputCls(S, err.email)} placeholder="you@example.com" />
            </Field>
            <Field S={S} label="Subject">
              <input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}
                className={inputCls(S)} placeholder="What is this about?" />
            </Field>
            <Field S={S} label="Message" req error={err.msg}>
              <textarea rows={4} value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })}
                className={inputCls(S, err.msg)} placeholder="Type your message" />
            </Field>
            <button onClick={send}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-sky-500">
              Send message
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Auth                                                               */
/* ------------------------------------------------------------------ */

function AuthPage({ S, mode, go, setUser, setToken, toast, departments, DEPT_NAME }) {
  const isLogin = mode === "login";
  const [role, setRole] = useState("patient");
  const [f, setF] = useState({ name: "", email: "", pass: "", confirm: "", phone: "", spec: "cardiology" });
  const [err, setErr] = useState({});
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e = {};
    if (!isLogin && !f.name.trim()) e.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email address";
    if (f.pass.length < 6) e.pass = "Use at least 6 characters";
    if (!isLogin && f.confirm !== f.pass) e.confirm = "Passwords don't match";
    if (!isLogin && !/^[\d\s+\-]{10,}$/.test(f.phone)) e.phone = "Enter a valid phone number";
    setErr(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      if (isLogin) {
        const data = await apiCall("/auth/login", "POST", { email: f.email, password: f.pass });
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        toast(`Welcome back, ${data.user.name.split(" ")[0]}`);
        go(data.user.role);
      } else {
        const payload = {
          name: f.name,
          email: f.email,
          password: f.pass,
          phone: f.phone,
          role,
        };
        if (role === "doctor") {
          payload.doctorProfile = {
            department: f.spec,
            specialization: "Consultant " + DEPT_NAME(f.spec),
            qualification: "MBBS, MD",
            experience: 5,
            fee: 500,
            room: "A-" + Math.floor(100 + Math.random() * 900),
            availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            slots: SLOTS,
          };
        }
        const data = await apiCall("/auth/register", "POST", payload);
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        toast("Account created. You're signed in.");
        go(data.user.role);
      }
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const roles = [
    { id: "patient", label: "Patient", icon: User },
    { id: "doctor", label: "Doctor", icon: Stethoscope },
    { id: "admin", label: "Admin", icon: Shield },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative max-w-md mx-auto px-4 py-16">
        <div className={`fade-up rounded-3xl p-7 shadow-2xl ${S.card}`}>
          <div className="text-center">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 grid place-items-center mx-auto">
              <HeartPulse className="w-6 h-6 text-white" />
            </span>
            <h1 className={`mt-4 text-2xl font-bold ${S.head}`}>
              {forgot ? "Reset your password" : isLogin ? "Log in to MediCare" : "Create your account"}
            </h1>
            <p className={`mt-1.5 text-sm ${S.sub}`}>
              {forgot ? "We'll email you a reset link that expires in 30 minutes."
                : isLogin ? "Pick your role, then sign in." : "Registration takes about 30 seconds."}
            </p>
          </div>

          {forgot ? (
            <div className="mt-6 space-y-4">
              <Field S={S} label="Registered email" req>
                <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })}
                  className={inputCls(S)} placeholder="you@example.com" />
              </Field>
              <button onClick={() => { toast("Reset link sent. Check your inbox."); setForgot(false); }}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
                Send reset link
              </button>
              <button onClick={() => setForgot(false)} className={`w-full text-sm ${S.sub} hover:text-sky-600`}>
                Back to log in
              </button>
            </div>
          ) : (
            <>
              <div className={`mt-6 grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl ${S.soft}`}>
                {roles.map((r) => (
                  <button key={r.id} onClick={() => setRole(r.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      role === r.id ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg" : S.sub}`}>
                    <r.icon className="w-4 h-4" />{r.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-4">
                {!isLogin && (
                  <Field S={S} label="Full name" req error={err.name}>
                    <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })}
                      className={inputCls(S, err.name)} placeholder={role === "doctor" ? "Dr. Your Name" : "Your name"} />
                  </Field>
                )}
                <Field S={S} label="Email" req error={err.email}>
                  <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })}
                    className={inputCls(S, err.email)} placeholder="you@example.com" />
                </Field>
                {!isLogin && (
                  <Field S={S} label="Phone number" req error={err.phone}>
                    <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })}
                      className={inputCls(S, err.phone)} placeholder="+91 98400 00000" />
                  </Field>
                )}
                {!isLogin && role === "doctor" && (
                  <Field S={S} label="Specialisation" req>
                    <select value={f.spec} onChange={(e) => setF({ ...f, spec: e.target.value })} className={inputCls(S)}>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </Field>
                )}
                <Field S={S} label="Password" req error={err.pass}>
                  <input type="password" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })}
                    className={inputCls(S, err.pass)} placeholder="At least 6 characters" />
                </Field>
                {!isLogin && (
                  <Field S={S} label="Confirm password" req error={err.confirm}>
                    <input type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })}
                      className={inputCls(S, err.confirm)} placeholder="Repeat password" />
                  </Field>
                )}

                {isLogin && (
                  <button onClick={() => setForgot(true)} className="text-sm font-medium text-sky-600 hover:underline">
                    Forgot password?
                  </button>
                )}

                <button onClick={submit} disabled={busy}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLogin ? "Log in" : "Create account"}
                </button>

                <p className={`text-center text-sm ${S.sub}`}>
                  {isLogin ? "New here? " : "Already registered? "}
                  <button onClick={() => go(isLogin ? "register" : "login")} className="font-semibold text-sky-600 hover:underline">
                    {isLogin ? "Create an account" : "Log in"}
                  </button>
                </p>

                <div className={`rounded-xl p-3 text-xs ${S.soft} ${S.sub}`}>
                  <span className={`font-semibold ${S.head}`}>MediCare MERN Integration.</span> Authenticates and accesses the database dynamically. Seed credentials apply!
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Booking                                                            */
/* ------------------------------------------------------------------ */

const emptyBooking = { patient: "", email: "", phone: "", age: "", gender: "", dept: "", doctorId: "", date: "", slot: "", symptoms: "" };

function BookPage({ S, go, toast, appts, setAppts, user, token, prefill, setPrefill, reschedule, setReschedule, doctors, DOC, refreshAppointments, departments, DEPT_NAME }) {
  const [f, setF] = useState(() => ({
    ...emptyBooking,
    patient: user && user.role === "patient" ? user.name : "",
    email: user ? user.email : "",
    phone: user ? user.phone || "" : "",
    ...(prefill || {}),
    ...(reschedule ? { ...reschedule, doctorId: reschedule.doctor?._id || reschedule.doctorId, date: "", slot: "" } : {}),
  }));
  const [err, setErr] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(null);
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => () => { setPrefill(null); }, [setPrefill]);

  const deptDoctors = doctors.filter((d) => !f.dept || d.department === f.dept);
  const chosen = DOC(f.doctorId);

  // Fetch available slots for the selected doctor and date from the backend
  useEffect(() => {
    async function loadSlots() {
      if (!f.doctorId || !f.date) {
        setDoctorSlots([]);
        return;
      }
      setLoadingSlots(true);
      try {
        const data = await apiCall(`/doctors/${f.doctorId}/slots?date=${f.date}`);
        setDoctorSlots(data.slots || []);
      } catch (err) {
        toast(err.message, "error");
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, [f.doctorId, f.date]);

  const dayName = f.date ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(f.date + "T00:00:00").getDay()] : null;
  const doctorSits = !chosen._id || !dayName || (chosen.availableDays && chosen.availableDays.includes(dayName));

  const set = (k, v) => {
    setF((p) => {
      const next = { ...p, [k]: v };
      if (k === "dept") { next.doctorId = ""; next.slot = ""; }
      if (k === "doctorId" || k === "date") next.slot = "";
      return next;
    });
    setErr((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!f.patient.trim()) e.patient = "Enter the patient's name";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email address";
    if (!/^[\d\s+\-]{10,}$/.test(f.phone)) e.phone = "Enter a valid phone number";
    if (!f.age || Number(f.age) < 0 || Number(f.age) > 120) e.age = "Enter an age between 0 and 120";
    if (!f.gender) e.gender = "Select a gender";
    if (!f.dept) e.dept = "Choose a department";
    if (!f.doctorId) e.doctorId = "Choose a doctor";
    if (!f.date) e.date = "Pick a date";
    else if (f.date < iso(today)) e.date = "Pick today or a later date";
    else if (!doctorSits) e.date = `${chosen.name} doesn't sit on ${dayName}. Available: ${chosen.availableDays.join(", ")}`;
    if (!f.slot) e.slot = "Pick a time slot";
    if (f.symptoms.trim().length < 5) e.symptoms = "Describe the symptoms in a few words";
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const review = () => { 
    if (!user) {
      toast("You must be logged in to book an appointment.", "info");
      go("login");
      return;
    }
    if (validate()) setConfirm(true); 
  };

  const submit = async () => {
    try {
      if (reschedule) {
        const data = await apiCall(`/appointments/${reschedule._id}/reschedule`, "PATCH", {
          date: f.date,
          slot: f.slot
        }, token);
        setConfirm(false);
        setDone(data.appointment);
        setReschedule(null);
        refreshAppointments();
        toast("Appointment rescheduled successfully!");
      } else {
        const payload = {
          doctorId: f.doctorId,
          date: f.date,
          slot: f.slot,
          patientName: f.patient,
          age: Number(f.age),
          gender: f.gender,
          phone: f.phone,
          email: f.email,
          symptoms: f.symptoms
        };
        const data = await apiCall("/appointments", "POST", payload, token);
        setConfirm(false);
        setDone(data.appointment);
        refreshAppointments();
        toast("Appointment booked successfully!");
      }
    } catch (err) {
      toast(err.message, "error");
    }
  };

  if (done) return <BookedScreen S={S} rec={done} go={go} reset={() => { setDone(null); setF(emptyBooking); }} doctors={doctors} DOC={DOC} departments={departments} DEPT_NAME={DEPT_NAME} />;

  return (
    <Section>
      <div className="max-w-3xl mx-auto">
        <Eyebrow>{reschedule ? `Rescheduling ${reschedule.reference || reschedule._id}` : "Book appointment"}</Eyebrow>
        <h1 className={`mt-4 text-4xl font-bold tracking-tight ${S.head}`}>
          {reschedule ? "Pick a new time" : "Hold your slot"}
        </h1>
        <p className={`mt-3 ${S.sub}`}>
          Fields marked with an asterisk are required. Slots already taken appear crossed out.
        </p>

        <div className={`mt-8 rounded-3xl p-6 sm:p-8 ${S.card}`}>
          <h2 className={`text-sm font-bold uppercase tracking-widest text-sky-600`}>Patient details</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <Field S={S} label="Patient name" req error={err.patient}>
              <input value={f.patient} onChange={(e) => set("patient", e.target.value)}
                className={inputCls(S, err.patient)} placeholder="Full name" />
            </Field>
            <Field S={S} label="Email" req error={err.email}>
              <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)}
                className={inputCls(S, err.email)} placeholder="you@example.com" />
            </Field>
            <Field S={S} label="Phone number" req error={err.phone}>
              <input value={f.phone} onChange={(e) => set("phone", e.target.value)}
                className={inputCls(S, err.phone)} placeholder="+91 98400 00000" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field S={S} label="Age" req error={err.age}>
                <input type="number" value={f.age} onChange={(e) => set("age", e.target.value)}
                  className={`${inputCls(S, err.age)} no-spin`} placeholder="Years" />
              </Field>
              <Field S={S} label="Gender" req error={err.gender}>
                <select value={f.gender} onChange={(e) => set("gender", e.target.value)} className={inputCls(S, err.gender)}>
                  <option value="">Select</option>
                  <option>Female</option><option>Male</option><option>Other</option>
                </select>
              </Field>
            </div>
          </div>

          <h2 className={`mt-9 text-sm font-bold uppercase tracking-widest text-sky-600`}>Appointment</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <Field S={S} label="Department" req error={err.dept}>
              <select value={f.dept} onChange={(e) => set("dept", e.target.value)} className={inputCls(S, err.dept)}>
                <option value="">Select a department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.emoji || "🩺"}  {d.name}</option>)}
              </select>
            </Field>
            <Field S={S} label="Doctor" req error={err.doctorId}>
              <select value={f.doctorId} onChange={(e) => set("doctorId", e.target.value)}
                disabled={!f.dept} className={`${inputCls(S, err.doctorId)} disabled:opacity-50`}>
                <option value="">{f.dept ? "Select a doctor" : "Choose a department first"}</option>
                {deptDoctors.map((d) => <option key={d._id || d.id} value={d._id || d.id}>{d.name} — ₹{d.fee}</option>)}
              </select>
            </Field>
            <Field S={S} label="Appointment date" req error={err.date}>
              <input type="date" min={iso(today)} max={addDays(30)} value={f.date}
                onChange={(e) => set("date", e.target.value)} className={inputCls(S, err.date)} />
            </Field>
            <div>
              <span className={`block text-sm font-medium mb-1.5 ${S.head}`}>Consulting on</span>
              <div className={`px-3.5 py-2.5 rounded-xl border text-sm ${S.input} ${S.sub}`}>
                {chosen._id || chosen.id ? chosen.availableDays.join(" · ") : "Select a doctor to see their days"}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <span className={`block text-sm font-medium mb-2 ${S.head}`}>
              Available time slot<span className="text-rose-500"> *</span>
            </span>
            {!f.doctorId || !f.date ? (
              <div className={`rounded-2xl p-6 text-center text-sm ${S.soft} ${S.sub}`}>
                Choose a doctor and a date to see open slots.
              </div>
            ) : !doctorSits ? (
              <div className="rounded-2xl p-6 text-center text-sm bg-amber-500/10 text-amber-600">
                {chosen.name} doesn't consult on {dayName}. Try {chosen.availableDays.join(", ")}.
              </div>
            ) : loadingSlots ? (
              <div className="flex justify-center items-center py-6 text-sky-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading open slots...
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {doctorSlots.map((s) => {
                  const taken = !s.available;
                  const on = f.slot === s.slot;
                  return (
                    <button key={s.slot} disabled={taken} onClick={() => set("slot", s.slot)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        taken ? `${S.soft} ${S.sub} line-through cursor-not-allowed opacity-50 border-transparent`
                          : on ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white border-transparent shadow-lg shadow-sky-500/25"
                            : `${S.solid} ${S.head} hover:border-sky-500`}`}>
                      {s.slot}
                    </button>
                  );
                })}
              </div>
            )}
            {err.slot && <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-500"><AlertTriangle className="w-3 h-3" />{err.slot}</p>}
          </div>

          <div className="mt-6">
            <Field S={S} label="Symptoms or reason for visit" req error={err.symptoms}>
              <textarea rows={3} value={f.symptoms} onChange={(e) => set("symptoms", e.target.value)}
                className={inputCls(S, err.symptoms)} placeholder="For example: chest tightness when climbing stairs, started three days ago" />
            </Field>
          </div>

          {chosen._id && (
            <div className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ${S.soft}`}>
              <div className="flex items-center gap-3">
                <Avatar name={chosen.name} size={40} i={5} />
                <div>
                  <p className={`text-sm font-semibold ${S.head}`}>{chosen.name}</p>
                  <p className={`text-xs ${S.sub}`}>{chosen.specialization} · Room {chosen.room}</p>
                </div>
              </div>
              <p className="text-sm"><span className={S.sub}>Consultation fee </span>
                <span className="font-bold text-emerald-600">₹{chosen.fee}</span></p>
            </div>
          )}

          <button onClick={review}
            className="mt-7 w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-xl shadow-sky-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500">
            {reschedule ? "Review new time" : "Book appointment"}
          </button>
        </div>
      </div>

      <Modal S={S} open={confirm} onClose={() => setConfirm(false)}>
        <h2 className={`text-xl font-bold ${S.head}`}>Confirm this appointment</h2>
        <p className={`mt-1 text-sm ${S.sub}`}>Check the details. You can change them after booking.</p>
        <dl className={`mt-5 rounded-2xl p-4 space-y-2.5 text-sm ${S.soft}`}>
          {[["Patient", `${f.patient}, ${f.age} · ${f.gender}`],
            ["Doctor", chosen.name], ["Department", DEPT_NAME(f.dept)],
            ["Date", f.date], ["Time", f.slot], ["Fee at counter", `₹${chosen.fee}`]].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className={S.sub}>{k}</dt><dd className={`font-semibold text-right ${S.head}`}>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex gap-3">
          <button onClick={() => setConfirm(false)}
            className={`flex-1 py-3 rounded-xl font-semibold ${S.soft} ${S.head} focus:outline-none focus:ring-2 focus:ring-sky-500`}>
            Go back
          </button>
          <button onClick={submit}
            className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
            Confirm booking
          </button>
        </div>
      </Modal>
    </Section>
  );
}

function BookedScreen({ S, rec, go, reset, DOC, DEPT_NAME }) {
  const doctorId = rec.doctor?._id || rec.doctor || rec.doctorId;
  const d = DOC(doctorId);
  return (
    <Section>
      <div className={`max-w-lg mx-auto fade-up rounded-3xl p-8 text-center ${S.card}`}>
        <span className="w-16 h-16 rounded-full bg-emerald-500/15 grid place-items-center mx-auto ring-pulse">
          <Check className="w-8 h-8 text-emerald-600" />
        </span>
        <h1 className={`mt-5 text-2xl font-bold ${S.head}`}>Appointment booked</h1>
        <p className={`mt-2 text-sm ${S.sub}`}>
          A confirmation is on its way to {rec.email}. Reminders follow 24 hours and 2 hours before your slot.
        </p>
        <div className={`mt-6 rounded-2xl p-5 text-left ${S.soft}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs uppercase tracking-widest ${S.sub}`}>Reference</span>
            <span className="font-mono font-bold text-sky-600">{rec.reference || rec._id}</span>
          </div>
          <div className={`mt-4 pt-4 border-t ${S.line} space-y-2 text-sm`}>
            <Row S={S} k="Doctor" v={d.name || "Seeded Doctor"} />
            <Row S={S} k="Department" v={DEPT_NAME(rec.department || rec.dept)} />
            <Row S={S} k="When" v={`${rec.date} at ${rec.slot}`} />
            <Row S={S} k="Room" v={d.room || "N/A"} />
            <Row S={S} k="Status" v={<StatusPill status={rec.status} />} />
          </div>
        </div>
        <p className={`mt-4 text-xs ${S.sub}`}>Please arrive 15 minutes early with a photo ID.</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button onClick={() => downloadSlip(rec, d, DEPT_NAME)}
            className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${S.solid} ${S.head} focus:outline-none focus:ring-2 focus:ring-sky-500`}>
            <Download className="w-4 h-4" />Download slip
          </button>
          <button onClick={() => { reset(); go("patient"); }}
            className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
            Go to dashboard
          </button>
        </div>
        <button onClick={reset} className={`mt-3 text-sm ${S.sub} hover:text-sky-600`}>Book another appointment</button>
      </div>
    </Section>
  );
}

function BookedRow({ S, k, v }) {
  return (
    <div className="flex justify-between gap-4">
      <span className={S.sub}>{k}</span>
      <span className={`font-semibold text-right ${S.head}`}>{v}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboards                                                         */
/* ------------------------------------------------------------------ */

function DashShell({ S, title, sub, tabs, tab, setTab, children, right }) {
  return (
    <Section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Eyebrow>Dashboard</Eyebrow>
          <h1 className={`mt-3 text-3xl sm:text-4xl font-bold tracking-tight ${S.head}`}>{title}</h1>
          <p className={`mt-2 ${S.sub}`}>{sub}</p>
        </div>
        {right}
      </div>

      <div className={`mt-8 flex gap-1 p-1.5 rounded-2xl overflow-x-auto ${S.soft}`}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
              tab === t.id ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg" : S.sub}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">{children}</div>
    </Section>
  );
}

function StatCard({ S, icon: Icon, label, value, note, tone = "sky" }) {
  const tones = { sky: "bg-sky-500/12 text-sky-600", emerald: "bg-emerald-500/12 text-emerald-600", amber: "bg-amber-500/12 text-amber-600", violet: "bg-violet-500/12 text-violet-600", rose: "bg-rose-500/12 text-rose-600" };
  return (
    <div className={`rounded-2xl p-5 ${S.card}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`w-10 h-10 rounded-xl grid place-items-center ${tones[tone]}`}><Icon className="w-5 h-5" /></span>
        {note && <span className={`text-xs ${S.sub}`}>{note}</span>}
      </div>
      <p className={`mt-4 text-2xl font-bold ${S.head}`}>{value}</p>
      <p className={`text-sm ${S.sub}`}>{label}</p>
    </div>
  );
}

function ApptCard({ S, a, children, DEPT_NAME }) {
  const doctorObj = a.doctor || {};
  const doctorName = doctorObj.name || "Staff";
  const doctorSpec = doctorObj.specialization || "Consultant";
  const doctorRoom = doctorObj.room || "N/A";
  
  return (
    <div className={`rounded-2xl p-5 ${S.card}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar name={doctorName} size={46} i={1} />
          <div className="min-w-0">
            <p className={`font-semibold ${S.head}`}>{doctorName}</p>
            <p className={`text-xs ${S.sub}`}>{doctorSpec} · {DEPT_NAME(a.department || a.dept)} · Room {doctorRoom}</p>
            <p className="mt-1 font-mono text-xs text-sky-600">{a.reference || a._id}</p>
          </div>
        </div>
        <StatusPill status={a.status} />
      </div>

      <div className={`mt-4 grid sm:grid-cols-3 gap-3 rounded-xl p-3 text-sm ${S.soft}`}>
        <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-sky-500" />{a.date}</span>
        <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-sky-500" />{a.slot}</span>
        <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-sky-500" />₹{a.fee}</span>
      </div>

      <p className={`mt-3 text-sm ${S.sub}`}><span className={`font-medium ${S.head}`}>Reason: </span>{a.symptoms}</p>
      {a.prescription && (
        <p className={`mt-2 text-sm p-3 rounded-xl bg-emerald-500/10 text-emerald-700`}>
          <span className="font-semibold">Prescription: </span>{a.prescription}
        </p>
      )}
      {a.notes && <p className={`mt-2 text-sm ${S.sub}`}><span className={`font-medium ${S.head}`}>Notes: </span>{a.notes}</p>}
      {children && <div className="mt-4 flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

const btnGhost = (S) => `px-3.5 py-2 rounded-xl text-sm font-semibold ${S.solid} ${S.head} hover:border-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500`;
const btnDanger = "px-3.5 py-2 rounded-xl text-sm font-semibold bg-rose-500/12 text-rose-600 hover:bg-rose-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500";
const btnPrimary = "px-3.5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500";

/* ---- Patient Dashboard ---- */

function PatientDash({ S, user, token, appts, setAppts, toast, go, setReschedule, DOC, refreshAppointments, departments, DEPT_NAME }) {
  const [tab, setTab] = useState("upcoming");
  const [cancelling, setCancelling] = useState(null);
  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    address: "",
    bloodGroup: "",
    allergies: ""
  });

  // Fetch full user profile details on boot
  useEffect(() => {
    async function loadUserProfile() {
      try {
        const data = await apiCall("/auth/me", "GET", null, token);
        if (data.user) {
          setProfile({
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            address: data.user.address || "",
            bloodGroup: data.user.bloodGroup || "",
            allergies: data.user.allergies || ""
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadUserProfile();
  }, [token]);

  const upcoming = appts.filter((a) => a.date >= iso(today) && a.status !== "Cancelled" && a.status !== "Completed")
    .sort((a, b) => a.date.localeCompare(b.date));
  const history = appts.filter((a) => !upcoming.includes(a)).sort((a, b) => b.date.localeCompare(a.date));

  const doCancel = async () => {
    try {
      await apiCall(`/appointments/${cancelling._id}/status`, "PATCH", { status: "Cancelled" }, token);
      toast(`${cancelling.reference || cancelling._id} cancelled`, "info");
      setCancelling(null);
      refreshAppointments();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleProfileSave = async () => {
    try {
      await apiCall("/auth/me", "PUT", profile, token);
      toast("Profile updated successfully");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const tabs = [
    { id: "upcoming", label: "Upcoming", icon: Calendar },
    { id: "history", label: "History", icon: ClipboardList },
    { id: "profile", label: "Profile", icon: Settings },
  ];

  return (
    <>
      <DashShell S={S} tabs={tabs} tab={tab} setTab={setTab}
        title={`Hello, ${user.name.split(" ")[0]}`}
        sub={upcoming.length ? `You have ${upcoming.length} appointment${upcoming.length > 1 ? "s" : ""} coming up.` : "Nothing scheduled right now."}
        right={<button onClick={() => go("book")} className={btnPrimary}>+ Book appointment</button>}>

        {tab === "upcoming" && (
          upcoming.length === 0 ? (
            <Empty S={S} icon={Calendar} title="No upcoming appointments"
              body="When you book a slot it shows up here, with the room number and your token."
              action={<button onClick={() => go("book")} className={btnPrimary}>Book your first appointment</button>} />
          ) : (
            <div className="grid lg:grid-cols-2 gap-5">
              {upcoming.map((a) => (
                <ApptCard key={a._id} S={S} a={a} DEPT_NAME={DEPT_NAME}>
                  <button onClick={() => { setReschedule(a); go("book"); }} className={btnGhost(S)}>
                    <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />Reschedule
                  </button>
                  <button onClick={() => downloadSlip(a, a.doctor, DEPT_NAME)} className={btnGhost(S)}>
                    <Download className="w-3.5 h-3.5 inline mr-1.5" />Slip
                  </button>
                  <button onClick={() => setCancelling(a)} className={btnDanger}>
                    <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />Cancel
                  </button>
                </ApptCard>
              ))}
            </div>
          )
        )}

        {tab === "history" && (
          history.length === 0 ? (
            <Empty S={S} icon={ClipboardList} title="No past visits yet"
              body="Completed and cancelled appointments are archived here with any prescription your doctor added." />
          ) : (
            <div className="grid lg:grid-cols-2 gap-5">
              {history.map((a) => (
                <ApptCard key={a._id} S={S} a={a} DEPT_NAME={DEPT_NAME}>
                  <button onClick={() => downloadSlip(a, a.doctor, DEPT_NAME)} className={btnGhost(S)}>
                    <Download className="w-3.5 h-3.5 inline mr-1.5" />Download slip
                  </button>
                </ApptCard>
              ))}
            </div>
          )
        )}

        {tab === "profile" && (
          <div className={`max-w-2xl rounded-2xl p-6 ${S.card}`}>
            <div className="flex items-center gap-4">
              <Avatar name={profile.name} size={64} i={1} />
              <div>
                <h2 className={`text-xl font-bold ${S.head}`}>{profile.name}</h2>
                <p className={`text-sm ${S.sub}`}>Patient ID · MC-{String(user.email.length * 7331).slice(0, 6)}</p>
              </div>
            </div>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <Field S={S} label="Full name"><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={inputCls(S)} /></Field>
              <Field S={S} label="Email"><input value={profile.email} disabled className={`${inputCls(S)} opacity-50 cursor-not-allowed`} /></Field>
              <Field S={S} label="Phone"><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className={inputCls(S)} /></Field>
              <Field S={S} label="Blood group"><input value={profile.bloodGroup} onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })} className={inputCls(S)} /></Field>
              <Field S={S} label="Known allergies"><input value={profile.allergies} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} className={inputCls(S)} /></Field>
              <Field S={S} label="Address"><input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className={inputCls(S)} /></Field>
            </div>
            <button onClick={handleProfileSave} className={`mt-6 ${btnPrimary}`}>Save changes</button>
          </div>
        )}
      </DashShell>

      <Modal S={S} open={!!cancelling} onClose={() => setCancelling(null)}>
        <span className="w-12 h-12 rounded-2xl bg-rose-500/12 grid place-items-center">
          <AlertTriangle className="w-6 h-6 text-rose-500" />
        </span>
        <h2 className={`mt-4 text-xl font-bold ${S.head}`}>Cancel this appointment?</h2>
        <p className={`mt-2 text-sm ${S.sub}`}>
          {cancelling && `${cancelling.reference || cancelling._id} with ${cancelling.doctor?.name || "Staff"} on ${cancelling.date} at ${cancelling.slot}.`}
          {" "}The slot goes back into the pool immediately.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => setCancelling(null)} className={`flex-1 py-3 rounded-xl font-semibold ${S.soft} ${S.head}`}>Keep it</button>
          <button onClick={doCancel} className="flex-1 py-3 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-700">Cancel appointment</button>
        </div>
      </Modal>
    </>
  );
}

/* ---- Doctor Dashboard ---- */

function DoctorDash({ S, user, token, appts, setAppts, toast, doctors, DOC, refreshAppointments, departments, DEPT_NAME }) {
  const [tab, setTab] = useState("today");
  const [rx, setRx] = useState(null);
  const [draft, setDraft] = useState({ prescription: "", notes: "" });
  
  const me = useMemo(() => {
    return doctors.find((d) => String(d.user) === String(user.id || user._id)) || {};
  }, [doctors, user]);

  const todays = useMemo(() => {
    return appts.filter((a) => a.date === iso(today));
  }, [appts]);

  const patients = useMemo(() => {
    return Array.from(new Set(appts.map((a) => a.patientName || a.patient)));
  }, [appts]);

  const [avail, setAvail] = useState({
    Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false
  });
  const [docSlots, setDocSlots] = useState(SLOTS.slice(0, 10));

  // Sync state with backend doctor profile values
  useEffect(() => {
    if (me._id) {
      const activeDays = {};
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(d => {
        activeDays[d] = me.availableDays ? me.availableDays.includes(d) : false;
      });
      setAvail(activeDays);
      if (me.slots) setDocSlots(me.slots);
    }
  }, [me]);

  const setStatus = async (id, status) => {
    try {
      await apiCall(`/appointments/${id}/status`, "PATCH", { status }, token);
      toast(`Appointment marked ${status.toLowerCase()}`);
      refreshAppointments();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const saveRx = async () => {
    try {
      await apiCall(`/appointments/${rx._id}/prescription`, "PATCH", {
        prescription: draft.prescription,
        notes: draft.notes,
        complete: true
      }, token);
      toast(`Prescription saved and completed for ${rx.patientName || rx.patient}`);
      setRx(null);
      refreshAppointments();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const saveAvailability = async () => {
    try {
      const selectedDays = Object.keys(avail).filter(d => avail[d]);
      await apiCall(`/doctors/${me._id}/availability`, "PUT", {
        availableDays: selectedDays,
        slots: docSlots
      }, token);
      toast("Availability saved successfully!");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const tabs = [
    { id: "today", label: "Today", icon: Calendar },
    { id: "patients", label: "Patients", icon: Users },
    { id: "availability", label: "Availability", icon: Clock },
  ];

  return (
    <>
      <DashShell S={S} tabs={tabs} tab={tab} setTab={setTab}
        title={me.name || "Doctor Desk"} sub={`${me.specialization || ""} · Room ${me.room || ""} · ${todays.length} appointments today`}
        right={
          <div className={`rounded-2xl px-5 py-3 ${S.card} text-center`}>
            <p className={`text-xs ${S.sub}`}>Today's earnings</p>
            <p className="text-xl font-bold text-emerald-600">₹{todays.reduce((s, a) => s + (a.status !== "Cancelled" ? a.fee : 0), 0)}</p>
          </div>
        }>

        {tab === "today" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard S={S} icon={Calendar} label="Appointments today" value={todays.length} tone="sky" />
              <StatCard S={S} icon={CheckCircle2} label="Confirmed" value={todays.filter((a) => a.status === "Confirmed").length} tone="emerald" />
              <StatCard S={S} icon={Clock} label="Awaiting your approval" value={todays.filter((a) => a.status === "Pending").length} tone="amber" />
              <StatCard S={S} icon={Users} label="Unique patients" value={patients.length} tone="violet" />
            </div>

            <div className="mt-6 grid lg:grid-cols-2 gap-5">
              {todays.length === 0 ? (
                <div className="lg:col-span-2">
                  <Empty S={S} icon={Calendar} title="Nothing on the list today" body="New bookings appear here the moment a patient confirms." />
                </div>
              ) : [...todays].sort((a, b) => a.slot.localeCompare(b.slot)).map((a) => (
                <PatientApptCard key={a._id} S={S} a={a}>
                  {a.status === "Pending" && (
                    <button onClick={() => setStatus(a._id, "Confirmed")} className={btnPrimary}>Approve</button>
                  )}
                  {a.status !== "Completed" && a.status !== "Cancelled" && (
                    <button onClick={() => { setRx(a); setDraft({ prescription: a.prescription, notes: a.notes }); }} className={btnGhost(S)}>
                      <Plus className="w-3.5 h-3.5 inline mr-1.5" />Prescription
                    </button>
                  )}
                  {a.status !== "Cancelled" && a.status !== "Completed" && (
                    <button onClick={() => setStatus(a._id, "Cancelled")} className={btnDanger}>Cancel</button>
                  )}
                </PatientApptCard>
              ))}
            </div>
          </>
        )}

        {tab === "patients" && (
          <div className={`rounded-2xl overflow-hidden ${S.card}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`${S.soft} text-left`}>
                  <tr>{["Patient", "Age / Gender", "Last visit", "Reason", "Status"].map((h) => (
                    <th key={h} className={`px-5 py-3.5 font-semibold ${S.head} whitespace-nowrap`}>{h}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {[...appts].sort((a, b) => b.date.localeCompare(a.date)).map((a) => (
                    <tr key={a._id} className={`border-t ${S.line} ${S.hoverRow}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={a.patientName || a.patient} size={30} i={5} />
                          <span className={`font-medium ${S.head}`}>{a.patientName || a.patient}</span>
                        </div>
                      </td>
                      <td className={`px-5 py-3.5 ${S.sub} whitespace-nowrap`}>{a.age} · {a.gender}</td>
                      <td className={`px-5 py-3.5 ${S.sub} whitespace-nowrap`}>{a.date}</td>
                      <td className={`px-5 py-3.5 ${S.sub} max-w-xs truncate`}>{a.symptoms}</td>
                      <td className="px-5 py-3.5"><StatusPill status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "availability" && (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className={`rounded-2xl p-6 ${S.card}`}>
              <h2 className={`font-bold ${S.head}`}>Consulting days</h2>
              <p className={`mt-1 text-sm ${S.sub}`}>Patients can only pick dates that fall on a day you're on.</p>
              <div className="mt-5 space-y-2">
                {Object.keys(avail).map((d) => (
                  <div key={d} className={`flex items-center justify-between p-3 rounded-xl ${S.soft}`}>
                    <span className={`text-sm font-medium ${S.head}`}>{d}</span>
                    <button onClick={() => setAvail({ ...avail, [d]: !avail[d] })}
                      aria-label={`Toggle ${d}`}
                      className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-sky-500 ${avail[d] ? "bg-emerald-500" : "bg-slate-400/50"}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${avail[d] ? "left-6" : "left-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl p-6 ${S.card}`}>
              <h2 className={`font-bold ${S.head}`}>Time slots you offer</h2>
              <p className={`mt-1 text-sm ${S.sub}`}>Tap to switch a slot on or off. Changes apply from tomorrow.</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {SLOTS.map((s) => {
                  const on = docSlots.includes(s);
                  return (
                    <button key={s}
                      onClick={() => setDocSlots(on ? docSlots.filter((x) => x !== s) : [...docSlots, s])}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        on ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/40" : `${S.solid} ${S.sub}`}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
              <button onClick={saveAvailability} className={`mt-6 w-full py-3 rounded-xl ${btnPrimary}`}>
                Save availability
              </button>
            </div>
          </div>
        )}
      </DashShell>

      <Modal S={S} open={!!rx} onClose={() => setRx(null)} wide>
        {rx && (
          <>
            <h2 className={`text-xl font-bold ${S.head}`}>Prescription for {rx.patientName || rx.patient}</h2>
            <p className={`mt-1 text-sm ${S.sub}`}>{rx.age} · {rx.gender} · {rx.date} at {rx.slot}</p>
            <p className={`mt-4 text-sm p-3 rounded-xl ${S.soft}`}>
              <span className={`font-semibold ${S.head}`}>Presenting complaint: </span>{rx.symptoms}
            </p>
            <div className="mt-5 space-y-4">
              <Field S={S} label="Medication and dosage">
                <textarea rows={4} value={draft.prescription} onChange={(e) => setDraft({ ...draft, prescription: e.target.value })}
                  className={inputCls(S)} placeholder="Drug, strength, frequency, duration — one per line" />
              </Field>
              <Field S={S} label="Medical notes">
                <textarea rows={3} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  className={inputCls(S)} placeholder="Findings, advice, and when to review" />
              </Field>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setRx(null)} className={`flex-1 py-3 rounded-xl font-semibold ${S.soft} ${S.head}`}>Discard</button>
              <button onClick={saveRx} className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600">
                Save and mark completed
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

/* ---- Admin Dashboard ---- */

function AdminDash({ S, appts, setAppts, toast, token, doctors, setDoctors, DOC, refreshAppointments, departments, setDepartments, DEPT_NAME }) {
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [adminStats, setAdminStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    todaysAppointments: 0,
    pending: 0,
    revenue: 0,
    byDepartment: [],
    byStatus: [],
    trend: []
  });

  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: "", email: "", password: "doctor123", phone: "", spec: "", department: "", qualification: "MBBS, MD", experience: 5, fee: 500, room: "", availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] });
  const [newDept, setNewDept] = useState({ id: "", name: "", emoji: "🩺", blurb: "" });

  // Fetch admin stats and users list on mount
  useEffect(() => {
    async function loadAdminData() {
      try {
        const statsData = await apiCall("/admin/stats", "GET", null, token);
        setAdminStats(statsData);

        const usersData = await apiCall("/admin/users", "GET", null, token);
        setUsers(usersData.users || []);
      } catch (err) {
        console.error(err);
      }
    }
    if (token) loadAdminData();
  }, [token, appts, doctors, departments]);

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to remove this user account?")) return;
    try {
      await apiCall(`/admin/users/${id}`, "DELETE", null, token);
      toast("User account removed successfully");
      setUsers(users.filter(u => u._id !== id));
      refreshAppointments();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const toggleDoctorStatus = async (id, currentStatus) => {
    try {
      await apiCall(`/admin/doctors/${id}`, "PATCH", { active: !currentStatus }, token);
      toast("Doctor status updated successfully");
      // Reload stats and doctors
      const docData = await apiCall("/doctors");
      setDoctors(docData.doctors || []);
      const statsData = await apiCall("/admin/stats", "GET", null, token);
      setAdminStats(statsData);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleAddDept = async () => {
    try {
      const data = await apiCall("/departments", "POST", newDept, token);
      toast("Department added successfully!");
      setDepartments([...departments, data.department]);
      setShowAddDept(false);
      setNewDept({ id: "", name: "", emoji: "🩺", blurb: "" });
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleAddDoctor = async () => {
    try {
      const payload = {
        name: newDoc.name,
        email: newDoc.email,
        password: newDoc.password,
        phone: newDoc.phone,
        role: "doctor",
        doctorProfile: {
          department: newDoc.department,
          specialization: newDoc.spec || ("Consultant " + DEPT_NAME(newDoc.department)),
          qualification: newDoc.qualification,
          experience: newDoc.experience,
          fee: newDoc.fee,
          room: newDoc.room || ("A-" + Math.floor(100 + Math.random() * 900)),
          availableDays: newDoc.availableDays,
          slots: SLOTS,
        }
      };
      
      await apiCall("/auth/register", "POST", payload);
      toast("Doctor registered successfully!");
      
      // Reload doctors list
      const docData = await apiCall("/doctors");
      setDoctors(docData.doctors || []);
      
      setShowAddDoctor(false);
      setNewDoc({ name: "", email: "", password: "doctor123", phone: "", spec: "", department: "", qualification: "MBBS, MD", experience: 5, fee: 500, room: "", availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] });
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const trend = useMemo(() => {
    return adminStats.trend.map(t => ({
      day: t._id.slice(5),
      booked: t.count
    }));
  }, [adminStats.trend]);

  const statusData = useMemo(() => {
    return adminStats.byStatus.map(s => ({
      name: s._id,
      value: s.count
    }));
  }, [adminStats.byStatus]);

  const byDept = useMemo(() => {
    return departments.map(d => {
      const match = adminStats.byDepartment.find(bd => bd._id === d.id);
      return {
        name: d.name.length > 9 ? d.name.slice(0, 8) + "…" : d.name,
        appointments: match ? match.count : 0
      };
    });
  }, [adminStats.byDepartment, departments]);

  const PIE = { Confirmed: "#10b981", Pending: "#f59e0b", Completed: "#0ea5e9", Cancelled: "#f43f5e" };
  const axis = S.dark ? "#64748b" : "#94a3b8";
  const grid = S.dark ? "#1e293b" : "#e2e8f0";
  const tipStyle = {
    background: S.dark ? "#0f172a" : "#fff",
    border: `1px solid ${grid}`, borderRadius: 12, fontSize: 12,
    color: S.dark ? "#e2e8f0" : "#0f172a",
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "doctors", label: "Doctors", icon: Stethoscope },
    { id: "patients", label: "Patients", icon: Users },
    { id: "departments", label: "Departments", icon: Building2 },
  ];

  return (
    <>
      <DashShell S={S} tabs={tabs} tab={tab} setTab={setTab}
        title="Admin dashboard" sub="Everything moving through the appointment desk, live."
        right={<button onClick={() => toast("Report generated and emailed to admin@medicare-hospital.in")} className={btnPrimary}>
          <FileText className="w-4 h-4 inline mr-1.5" />Generate report
        </button>}>

        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard S={S} icon={Users} label="Total patients" value={adminStats.totalPatients} note="active" tone="sky" />
              <StatCard S={S} icon={Stethoscope} label="Total doctors" value={adminStats.totalDoctors} note="active" tone="violet" />
              <StatCard S={S} icon={Calendar} label="Today's appointments" value={adminStats.todaysAppointments} tone="emerald" />
              <StatCard S={S} icon={TrendingUp} label="Revenue booked" value={`₹${adminStats.revenue.toLocaleString("en-IN")}`} tone="emerald" />
              <StatCard S={S} icon={Clock} label="Pending approval" value={adminStats.pending} note="needs action" tone="amber" />
            </div>

            <div className="mt-6 grid lg:grid-cols-3 gap-5">
              <div className={`lg:col-span-2 rounded-2xl p-6 ${S.card}`}>
                <h2 className={`font-bold ${S.head}`}>Bookings trend</h2>
                <p className={`text-sm ${S.sub}`}>Across all departments</p>
                <div className="mt-5 h-64">
                  {trend.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-sm text-slate-500">No booking data available yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                        <XAxis dataKey="day" stroke={axis} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={axis} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={tipStyle} />
                        <Line type="monotone" dataKey="booked" stroke="#0ea5e9" strokeWidth={3}
                          dot={{ r: 4, fill: "#0ea5e9" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className={`rounded-2xl p-6 ${S.card}`}>
                <h2 className={`font-bold ${S.head}`}>Status mix</h2>
                <p className={`text-sm ${S.sub}`}>All appointments on record</p>
                <div className="mt-5 h-64">
                  {statusData.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-sm text-slate-500">No appointments logged yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                          {statusData.map((d) => <Cell key={d.name} fill={PIE[d.name]} />)}
                        </Pie>
                        <Tooltip contentStyle={tipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div className={`mt-5 rounded-2xl p-6 ${S.card}`}>
              <h2 className={`font-bold ${S.head}`}>Appointments by department</h2>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDept}>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                    <XAxis dataKey="name" stroke={axis} fontSize={11} tickLine={false} axisLine={false} interval={0} />
                    <YAxis stroke={axis} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tipStyle} cursor={{ fill: S.dark ? "#1e293b60" : "#f1f5f9" }} />
                    <Bar dataKey="appointments" fill="#0ea5e9" radius={[8, 8, 0, 0]} maxBarSize={54} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {tab === "appointments" && (
          <Table S={S} head={["Reference", "Patient", "Doctor", "Department", "Date", "Slot", "Fee", "Status"]}
            rows={[...appts].sort((a, b) => b.date.localeCompare(a.date)).map((a) => [
              <span className="font-mono text-xs text-sky-600">{a.reference || a._id}</span>,
              a.patientName || a.patient, a.doctor?.name || "Staff", DEPT_NAME(a.department || a.dept), a.date, a.slot,
              `₹${a.fee}`, <StatusPill status={a.status} />,
            ])} />
        )}

        {tab === "doctors" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-bold ${S.head}`}>Manage Doctors</h2>
              <button onClick={() => setShowAddDoctor(true)} className={btnPrimary}>+ Add Doctor</button>
            </div>
            <Table S={S} head={["Doctor", "Specialisation", "Experience", "Fee", "Rating", "Status", "Actions"]}
              rows={doctors.map((d) => [
                <span className="flex items-center gap-2.5"><Avatar name={d.name} size={30} i={5} />
                  <span className={`font-medium ${S.head}`}>{d.name}</span></span>,
                d.specialization, `${d.experience} yrs`, `₹${d.fee}`,
                <span className="flex items-center gap-1.5"><Stars value={d.rating} /><span className="text-xs">{d.rating}</span></span>,
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${d.active ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-500"}`}>
                  {d.active ? "Active" : "Inactive"}
                </span>,
                <button onClick={() => toggleDoctorStatus(d._id || d.id, d.active)} className={btnGhost(S)}>
                  Toggle Status
                </button>
              ])} />
          </>
        )}

        {tab === "patients" && (
          <Table S={S} head={["Patient", "Email", "Phone", "Created", "Actions"]}
            rows={users.filter(u => u.role === "patient").map((u) => [
              <span className="flex items-center gap-2.5"><Avatar name={u.name} size={30} i={3} />
                <span className={`font-medium ${S.head}`}>{u.name}</span></span>,
              u.email, u.phone || "N/A", u.createdAt.slice(0, 10),
              <button onClick={() => deleteUser(u._id)} className={btnDanger}>
                Delete Account
              </button>
            ])} />
        )}

        {tab === "departments" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-bold ${S.head}`}>Manage Departments</h2>
              <button onClick={() => setShowAddDept(true)} className={btnPrimary}>+ Add Department</button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {departments.map((d) => (
                <div key={d.id} className={`rounded-2xl p-5 ${S.card}`}>
                  <span className="text-3xl">{d.emoji || "🩺"}</span>
                  <h3 className={`mt-3 font-semibold ${S.head}`}>{d.name}</h3>
                  <p className={`mt-1 text-xs ${S.sub}`}>{d.blurb}</p>
                  <div className={`mt-4 pt-4 border-t ${S.line} flex justify-between text-sm`}>
                    <span className={S.sub}>Doctors</span>
                    <span className={`font-semibold ${S.head}`}>{doctors.filter(doc => doc.department === d.id).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={S.sub}>Booked</span>
                    <span className="font-semibold text-sky-600">{appts.filter((a) => (a.department || a.dept) === d.id).length}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DashShell>

      {/* Add Department Modal */}
      <Modal S={S} open={showAddDept} onClose={() => setShowAddDept(false)}>
        <h2 className={`text-xl font-bold ${S.head}`}>Add New Department</h2>
        <p className={`mt-1 text-sm ${S.sub}`}>Create a new department category for appointments.</p>
        <div className="mt-5 space-y-4">
          <Field S={S} label="Department ID (lowercase, e.g., psychiatry)" req>
            <input value={newDept.id} onChange={(e) => setNewDept({ ...newDept, id: e.target.value })} className={inputCls(S)} placeholder="psychiatry" />
          </Field>
          <Field S={S} label="Department Name" req>
            <input value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })} className={inputCls(S)} placeholder="Psychiatry" />
          </Field>
          <Field S={S} label="Emoji Icon">
            <input value={newDept.emoji} onChange={(e) => setNewDept({ ...newDept, emoji: e.target.value })} className={inputCls(S)} placeholder="🧠" />
          </Field>
          <Field S={S} label="Blurb Description">
            <textarea rows={2} value={newDept.blurb} onChange={(e) => setNewDept({ ...newDept, blurb: e.target.value })} className={inputCls(S)} placeholder="Mental health and counseling care" />
          </Field>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={() => setShowAddDept(false)} className={`flex-1 py-3 rounded-xl font-semibold ${S.soft} ${S.head}`}>Cancel</button>
          <button onClick={handleAddDept} className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600">Save Department</button>
        </div>
      </Modal>

      {/* Add Doctor Modal */}
      <Modal S={S} open={showAddDoctor} onClose={() => setShowAddDoctor(false)} wide>
        <h2 className={`text-xl font-bold ${S.head}`}>Add New Doctor</h2>
        <p className={`mt-1 text-sm ${S.sub}`}>Register a doctor account and create their profile.</p>
        <div className="mt-5 grid sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
          <Field S={S} label="Full Name" req>
            <input value={newDoc.name} onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })} className={inputCls(S)} placeholder="Dr. John Doe" />
          </Field>
          <Field S={S} label="Email Address" req>
            <input type="email" value={newDoc.email} onChange={(e) => setNewDoc({ ...newDoc, email: e.target.value })} className={inputCls(S)} placeholder="john.doe@medicare-hospital.in" />
          </Field>
          <Field S={S} label="Password" req>
            <input type="password" value={newDoc.password} onChange={(e) => setNewDoc({ ...newDoc, password: e.target.value })} className={inputCls(S)} />
          </Field>
          <Field S={S} label="Phone Number" req>
            <input value={newDoc.phone} onChange={(e) => setNewDoc({ ...newDoc, phone: e.target.value })} className={inputCls(S)} placeholder="+91 98400 55555" />
          </Field>
          <Field S={S} label="Department" req>
            <select value={newDoc.department} onChange={(e) => setNewDoc({ ...newDoc, department: e.target.value, spec: "Consultant " + DEPT_NAME(e.target.value) })} className={inputCls(S)}>
              <option value="">Select Department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field S={S} label="Specialization">
            <input value={newDoc.spec} onChange={(e) => setNewDoc({ ...newDoc, spec: e.target.value })} className={inputCls(S)} placeholder="Consultant Cardiologist" />
          </Field>
          <Field S={S} label="Qualification" req>
            <input value={newDoc.qualification} onChange={(e) => setNewDoc({ ...newDoc, qualification: e.target.value })} className={inputCls(S)} placeholder="MBBS, MD" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field S={S} label="Experience (yrs)" req>
              <input type="number" value={newDoc.experience} onChange={(e) => setNewDoc({ ...newDoc, experience: Number(e.target.value) })} className={inputCls(S)} />
            </Field>
            <Field S={S} label="Fee (Rs.)" req>
              <input type="number" value={newDoc.fee} onChange={(e) => setNewDoc({ ...newDoc, fee: Number(e.target.value) })} className={inputCls(S)} />
            </Field>
          </div>
          <Field S={S} label="Room Assignment">
            <input value={newDoc.room} onChange={(e) => setNewDoc({ ...newDoc, room: e.target.value })} className={inputCls(S)} placeholder="B-201" />
          </Field>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={() => setShowAddDoctor(false)} className={`flex-1 py-3 rounded-xl font-semibold ${S.soft} ${S.head}`}>Cancel</button>
          <button onClick={handleAddDoctor} className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600">Register Doctor</button>
        </div>
      </Modal>
    </>
  );
}

function Table({ S, head, rows }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${S.card} w-full`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={`${S.soft} text-left`}>
            <tr>{head.map((h) => <th key={h} className={`px-5 py-3.5 font-semibold whitespace-nowrap ${S.head}`}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={`border-t ${S.line} ${S.hoverRow}`}>
                {r.map((c, j) => <td key={j} className={`px-5 py-3.5 whitespace-nowrap ${j === 0 ? "" : S.sub}`}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Empty({ S, icon: Icon, title, body, action }) {
  return (
    <div className={`rounded-2xl p-14 text-center ${S.card}`}>
      <span className={`w-14 h-14 rounded-2xl ${S.soft} grid place-items-center mx-auto`}>
        <Icon className={`w-7 h-7 ${S.sub}`} />
      </span>
      <h3 className={`mt-4 font-semibold ${S.head}`}>{title}</h3>
      <p className={`mt-1.5 text-sm max-w-sm mx-auto ${S.sub}`}>{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

function Footer({ S, go, departments }) {
  const links = [
    { h: "Quick links", items: [["Home", "home"], ["Doctors", "doctors"], ["Book appointment", "book"], ["About", "about"], ["Contact", "contact"]] },
    { h: "Departments", items: departments.slice(0, 5).map((d) => [d.name, "departments"]) },
  ];
  return (
    <footer className={`border-t ${S.line} ${S.dark ? "bg-slate-950" : "bg-white"}`}>
      <div className="max-w-7xl mx-auto px-4 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 grid place-items-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </span>
            <span className={`font-bold ${S.head}`}>MediCare Hospital</span>
          </div>
          <p className={`mt-4 text-sm leading-relaxed ${S.sub}`}>
            A 320-bed multi-specialty hospital in Tiruchirappalli, serving patients since 1998. Emergency care never closes.
          </p>
          <div className="mt-5 flex gap-2">
            {[Globe, Share2, Users, Mail].map((Icon, i) => (
              <a key={i} href="#" aria-label="Social link"
                className={`w-9 h-9 rounded-xl grid place-items-center ${S.soft} hover:text-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500`}>
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {links.map((col) => (
          <div key={col.h}>
            <h3 className={`font-semibold ${S.head}`}>{col.h}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.items.map(([label, route], i) => (
                <li key={label + i}>
                  <button onClick={() => go(route)} className={`text-sm ${S.sub} hover:text-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 rounded px-0.5`}>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className={`font-semibold ${S.head}`}>Contact</h3>
          <ul className={`mt-4 space-y-3 text-sm ${S.sub}`}>
            <li className="flex gap-2.5"><MapPin className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />24 Cantonment Road, Tiruchirappalli 620001</li>
            <li className="flex gap-2.5"><Phone className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />Front desk 0431 400 1200</li>
            <li className="flex gap-2.5"><Ambulance className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />Emergency 0431 400 1188</li>
            <li className="flex gap-2.5"><Mail className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />appointments@medicare-hospital.in</li>
          </ul>
        </div>
      </div>

      <div className={`border-t ${S.line}`}>
        <div className={`max-w-7xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-3 text-xs ${S.sub}`}>
          <p>© {new Date().getFullYear()} MediCare Hospital. Built on the MERN stack.</p>
          <p className="flex items-center gap-4">
            <span>Privacy policy</span><span>Terms of use</span><span>Patient rights</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function downloadSlip(a, d = {}, DEPT_NAME = (id) => id) {
  const ref = a.reference || a._id || "N/A";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Appointment ${ref}</title>
<style>body{font-family:system-ui,sans-serif;padding:40px;color:#0f172a}
.h{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0ea5e9;padding-bottom:14px}
h1{margin:0;color:#0369a1;font-size:22px}.tag{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#64748b}
table{width:100%;border-collapse:collapse;margin-top:26px}td{padding:11px 0;border-bottom:1px solid #e2e8f0;font-size:14px}
td:first-child{color:#64748b;width:190px}td:last-child{font-weight:600;text-align:right}
.f{margin-top:32px;font-size:12px;color:#64748b;line-height:1.7}</style></head><body>
<div class="h"><div><h1>MediCare Hospital</h1><div class="tag">Appointment slip</div></div>
<div style="text-align:right"><div class="tag">Reference</div><div style="font-weight:700;color:#0369a1">${ref}</div></div></div>
<table>
<tr><td>Patient</td><td>${a.patientName || a.patient}</td></tr>
<tr><td>Age / Gender</td><td>${a.age} / ${a.gender}</td></tr>
<tr><td>Phone</td><td>${a.phone}</td></tr>
<tr><td>Doctor</td><td>${d.name || "Staff"}</td></tr>
<tr><td>Specialisation</td><td>${d.specialization || "Consultant"}</td></tr>
<tr><td>Department</td><td>${DEPT_NAME(a.department || a.dept)}</td></tr>
<tr><td>Date and time</td><td>${a.date} at ${a.slot}</td></tr>
<tr><td>Room</td><td>${d.room || "N/A"}</td></tr>
<tr><td>Status</td><td>${a.status}</td></tr>
<tr><td>Consultation fee</td><td>Rs. ${a.fee} (pay at counter)</td></tr>
<tr><td>Reason for visit</td><td>${a.symptoms}</td></tr>
</table>
<div class="f">Arrive 15 minutes early with a photo ID.<br>
Cancel or reschedule from your dashboard up to 2 hours before the slot.<br>
Front desk 0431 400 1200 · Emergency 0431 400 1188 (24/7)</div></body></html>`;
  try {
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${ref}-appointment-slip.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to download slip:", err);
  }
}


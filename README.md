<<<<<<< HEAD
# hospital_appointment-
=======
# Hospital Appointment Booking System — API

Express + MongoDB backend for the MERN proof of concept. Pairs with `HospitalAppointmentSystem.jsx`.

## Run it locally

```bash
npm install
cp .env.example .env      # then fill in MONGO_URI and JWT_SECRET
npm run seed              # loads 10 doctors, 1 patient, 1 admin, 3 appointments
npm run dev               # http://localhost:5000
```

Check it's alive: `GET http://localhost:5000/api/health`

## Seeded logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@medicare-hospital.in | admin123 |
| Patient | nithya@mail.com | patient123 |
| Doctor | ananya.rao@medicare-hospital.in | doctor123 |

## Endpoints

### Auth — `/api/auth`
| Method | Path | Access | Does |
| --- | --- | --- | --- |
| POST | `/register` | public | Creates a patient, doctor or admin. A doctor also gets a `Doctor` profile. |
| POST | `/login` | public | Returns a JWT and the user record. |
| GET | `/me` | any signed-in | Current user. |
| PUT | `/me` | any signed-in | Updates name, phone, blood group, allergies, address. |
| POST | `/forgot-password` | public | Always replies the same, so emails can't be enumerated. |

### Doctors — `/api/doctors`
| Method | Path | Access | Does |
| --- | --- | --- | --- |
| GET | `/?department=&search=&sort=` | public | Search and filter. `sort` is `rating`, `experience` or `fee`. |
| GET | `/:id` | public | One doctor. |
| GET | `/:id/slots?date=YYYY-MM-DD` | public | Every slot for that date, flagged free or taken. |
| PUT | `/:id/availability` | doctor, admin | Updates consulting days and slot list. |

### Appointments — `/api/appointments`
| Method | Path | Access | Does |
| --- | --- | --- | --- |
| POST | `/` | signed-in | Books a slot. Rejects past dates, days the doctor doesn't sit, and slots already held. |
| GET | `/?status=&date=` | signed-in | Scoped automatically: patients see their own, doctors see theirs, admins see everything. |
| PATCH | `/:id/status` | role-aware | Patients may only cancel their own; doctors and admins can set any status. |
| PATCH | `/:id/reschedule` | patient, doctor, admin | Moves date and slot, re-checks for clashes, resets to Pending. |
| PATCH | `/:id/prescription` | doctor, admin | Saves medication and notes, optionally marks Completed. |

### Admin — `/api/admin`
| Method | Path | Does |
| --- | --- | --- |
| GET | `/stats` | Counts, revenue, per-department totals, status mix, 7-day trend — feeds the dashboard charts. |
| GET | `/users?role=` | Lists accounts. |
| DELETE | `/users/:id` | Removes an account and its doctor profile. |
| PATCH | `/doctors/:id` | Activates, deactivates or adjusts fee. |

## Double-booking

Two guards, because a check alone loses a race:

1. The route queries for a live appointment on the same doctor, date and slot.
2. A partial unique index on `{ doctor, date, slot }`, limited to `Pending` and `Confirmed`, makes the database the final word. The duplicate-key error surfaces as a 409 with a readable message.

Cancelled appointments fall outside the index, so a cancelled slot returns to the pool immediately.

## Deploying

- **Backend → Render.** Build `npm install`, start `npm start`. Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`.
- **Database → MongoDB Atlas.** Allowlist Render's outbound IPs, or `0.0.0.0/0` for the POC.
- **Frontend → Vercel.** Set `VITE_API_URL` to the Render URL, and put that Vercel domain in `CLIENT_URL` so CORS passes.

## Not built yet

Online payment, video consultation, SMS and email delivery (endpoints exist but don't send), and file uploads for reports. The reset-password endpoint replies but doesn't mail a token.
>>>>>>> 628d360 (Initial commit - Medicare Hospital Appointment System with Vercel and MongoDB Atlas config)

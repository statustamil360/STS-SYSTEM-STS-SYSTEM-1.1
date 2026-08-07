# AMC Teleconference Management System

A full-stack healthcare teleconference management platform for coordinating patients, clinical staff, appointments, conferences, and operational workflows across a five-level role-based access control (RBAC) hierarchy.

All roles authenticate through **one shared login page** at `/login`. After sign-in, users are redirected to a role-specific dashboard with permitted navigation only.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, Material UI (MUI) 9, Redux Toolkit, React Router, React Hook Form, Yup, Recharts, React Toastify |
| **Backend** | Node.js, Express 5, express-validator, multer |
| **Database** | MySQL / MariaDB (tested with XAMPP) |
| **Authentication** | JWT access tokens + refresh tokens, bcrypt password hashing |
| **Security** | Helmet, CORS, rate limiting, parameterized SQL, audit logging |

---

## Role Hierarchy

```
Super Admin
    └── Admin
            └── Receptionist
                    └── GP / AHP (clinical roles)
```

| Role | Primary Responsibility |
|------|------------------------|
| **Super Admin** | Platform administration — manage admins, audit logs, settings, reports, performance overview |
| **Admin** | Hospital operations — manage receptionists, GPs, AHPs, patients, reports, audit logs |
| **Receptionist** | Front-desk workflow — patients, appointments, conferences, tasks, staff directory |
| **GP** | Clinical care — assigned patients, conferences, medical notes, tasks |
| **AHP** | Allied health care — assigned patients, conferences, patient reports, tasks |

---

## Main Features

- Single shared login for all roles with JWT session management
- Role-specific dashboards with live API statistics (no mock metrics on dashboards)
- Admin and staff management (create, edit, deactivate, password reset)
- Patient registration and record management
- Appointment booking and scheduling
- Teleconference scheduling with GP/AHP assignment
- Task creation and assignment via staff dropdown
- GP medical notes and AHP patient reports
- Notifications, profile management, and profile picture upload
- Audit logs with authenticated CSV export
- Report generation (conference, patient, staff, activity, login)
- System settings (Super Admin / Admin)

---

## Project Structure

```
STS SYSTEM/
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── components/     # Shared UI (Sidebar, DataTable, PageHeader, etc.)
│       ├── pages/          # Role and shared pages
│       ├── routes/         # React Router + ProtectedRoute RBAC
│       ├── redux/          # Auth and UI state
│       └── services/       # Axios API client
├── server/                 # Express backend
│   ├── config/             # Database connection
│   ├── controllers/        # Business logic
│   ├── database/           # schema.sql, seed.js
│   ├── middleware/         # Auth, RBAC, validation, audit, upload
│   ├── routes/             # API route definitions
│   └── uploads/            # Profile picture storage
├── package.json            # Root scripts (install, dev, seed, build)
└── README.md
```

---

## Prerequisites

- **Node.js** 18 or later
- **MySQL 8.0+** or **MariaDB** (XAMPP recommended for local development)
- **npm**

---

## Installation

### 1. Install dependencies

From the project root:

```bash
npm run install:all
```

Or install separately:

```bash
cd client && npm install
cd ../server && npm install
```

### 2. Configure environment

Copy the example environment file and edit values for your machine:

```bash
cp server/.env.example server/.env
```

Update `server/.env` as needed:

| Variable | Description |
|----------|-------------|
| `DB_HOST` | Database host (default: `localhost`) |
| `DB_PORT` | Database port (default: `3306`) |
| `DB_USER` | Database user (default: `root`) |
| `DB_PASSWORD` | Database password (empty for default XAMPP) |
| `DB_NAME` | Database name (`amc_teleconference`) |
| `JWT_SECRET` | Access token secret — **change for production** |
| `JWT_REFRESH_SECRET` | Refresh token secret — **change for production** |
| `CLIENT_URL` | Frontend URL (default: `http://localhost:5173`) |
| `DAILY_API_KEY` | Optional Daily.co API key for production video rooms |
| `DAILY_DOMAIN` | Optional Daily.co domain (when using Daily) |

> **Do not commit `server/.env` to version control.** Use `.env.example` as the template only.

### 3. MySQL setup

1. Start MySQL/MariaDB (e.g. via XAMPP Control Panel).
2. Ensure the service is listening on port **3306**.
3. Create and seed the database:

```bash
npm run seed
```

This runs `server/database/seed.js`, which:

- Creates the `amc_teleconference` database and tables from `schema.sql`
- Seeds demo users, patients, conferences, appointments, and sample data
- Is safe to re-run (idempotent for core demo accounts)

4. Apply the video conference migration (links appointments to conferences):

```bash
npm run migrate:conference
```

5. Renumber appointment IDs into the sequential `APT-0001` format (run once on existing data):

```bash
npm run migrate:appointment-ids
```

6. **If today's meeting cards are empty**, refresh demo sample data:

```bash
npm run seed:demo-meetings
```

This creates/updates today's demo appointments, links them to conferences, and assigns GP/AHP participants.

Alternatively, import manually:

```bash
mysql -u root -p < server/database/schema.sql
cd server && npm run seed
```

---

## Running the Application

### Backend (Terminal 1)

```bash
npm run dev:server
```

Or from the `server` folder:

```bash
cd server
npm run dev
```

- API base URL: **http://localhost:5000/api**
- Production start: `cd server && npm start`

### Frontend (Terminal 2)

```bash
npm run dev:client
```

Or from the `client` folder:

```bash
cd client
npm run dev
```

- Application URL: **http://localhost:5173**
- Login page: **http://localhost:5173/login**

### Production build

```bash
npm run build
```

Built assets are output to `client/dist/`. Preview locally with:

```bash
cd client && npm run preview
```

---

## Production deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for full VPS/cloud deployment steps.

**Quick production start** (after DB setup and `server/.env` configured):

```bash
npm run deploy:prepare
npm run start:prod
```

Then open **http://localhost:5000** (or your domain via reverse proxy).

Production uses one server: Express serves `client/dist` + `/api` + `/uploads`.

---

## Demo Login Accounts

Use the **same login page** for every role. Passwords are set during account creation or by the seed script.

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | `superadmin@amc.com` | `Admin@123` |
| **Admin** | `admin@amc.com` | `Admin@123` |
| **Receptionist** | `receptionist@amc.com` | `Admin@123` |
| **GP** | `gp@amc.com` | `Admin@123` |
| **AHP** | `ahp@amc.com` | `Admin@123` |

> Demo passwords are for local demonstration only. Change all credentials before any production deployment.

---

## Role Permissions Summary

| Feature | Super Admin | Admin | Receptionist | GP | AHP |
|---------|:-----------:|:-----:|:------------:|:--:|:---:|
| Admin Management | ✓ | — | — | — | — |
| Performance (demo metrics) | ✓ | — | — | — | — |
| Receptionist Management | — | ✓ | — | — | — |
| GP / AHP Management | — | ✓ | View | — | — |
| Patients (full CRUD) | View | View | ✓ | Assigned | Assigned |
| Appointments | — | — | ✓ | — | — |
| Conferences | — | View | ✓ | ✓ | ✓ |
| Tasks | — | View | ✓ | ✓ | ✓ |
| Medical Notes | — | — | — | ✓ | — |
| Patient Reports | — | — | — | — | ✓ |
| Audit Logs | ✓ | ✓ | — | — | — |
| Reports | ✓ | ✓ | — | — | — |
| Settings | ✓ | ✓ | — | — | — |
| Notifications / Profile | ✓ | ✓ | ✓ | ✓ | ✓ |

Backend RBAC is enforced on every API route. Unauthorized direct URL or API access returns **401** (unauthenticated) or **403** (forbidden).

---

## Demo Flow

Follow this sequence for a live demonstration:

### 1. Super Admin

1. Open **http://localhost:5173/login**
2. Sign in as `superadmin@amc.com` / `Admin@123`
3. Review the **Dashboard** (platform statistics)
4. Go to **Admin Management**
5. **View** existing admins or **Create** a new admin (email + password)
6. Optional: **Audit Logs**, **Reports**, **Settings**, **Performance** (demo placeholders)

### 2. Admin

1. Log out, then sign in as `admin@amc.com` / `Admin@123`
2. Review the **Admin Dashboard**
3. Go to **Receptionists** — view or create receptionist accounts
4. Go to **General Practitioners** / **Allied Health Professionals** — manage clinical staff
5. Go to **Patients** — view patient records
6. Confirm Super Admin-only pages are **not** in the sidebar and direct URLs are blocked

### 3. Receptionist

1. Log out, then sign in as `receptionist@amc.com` / `Admin@123`
2. Review the **Receptionist Dashboard**
3. **Patients** — create a new patient record
4. **Appointments** — book an appointment (auto-creates a linked video conference for assigned GP/AHP)
5. **Conferences** — monitor today's meeting cards and conference history
6. **Tasks** — create a task and assign it via the staff dropdown

### 4. GP

1. Log out, then sign in as `gp@amc.com` / `Admin@123`
2. Review the **GP Dashboard**
3. **Assigned Patients** — view patients assigned to this GP
4. **Medical Notes** — select a patient and add a clinical note
5. **Conferences** — accept today's meeting (starts video), or join if already live
6. **Tasks** — verify assigned items appear

### 5. AHP

1. Log out, then sign in as `ahp@amc.com` / `Admin@123`
2. Review the **AHP Dashboard**
3. **Assigned Patients** — view assigned caseload
4. **Patient Reports** — select a patient and add an allied health report
5. **Conferences** — join only after GP accepts the meeting
6. **Tasks** — verify assigned items appear

### End-to-end workflow summary

```
Super Admin → creates/views Admin
     ↓
Admin → manages Receptionists, GPs, AHPs, Patients
     ↓
Receptionist → Patient → Appointment (auto Conference) → Task
     ↓
GP → Accept meeting → Video room          AHP → Join after GP accepts
     ↓
GP → Medical Note          AHP → Patient Report
```

All data persists in MySQL and remains available after logout/login.

---

## API / Backend Overview

| Module | Base Path | Auth Roles (typical) |
|--------|-----------|----------------------|
| Auth | `/api/auth` | Public login; protected profile/password |
| Admins | `/api/admins` | Super Admin |
| Staff | `/api/staff` | Admin, Receptionist (varies by endpoint) |
| Patients | `/api/patients` | Admin, Receptionist, GP, AHP |
| Conferences | `/api/conferences` | Receptionist, GP, AHP, Admin |
| Appointments | `/api/appointments` | Receptionist |
| Tasks | `/api/tasks` | Receptionist, GP, AHP, Admin |
| Notifications | `/api/notifications` | All authenticated |
| Audit Logs | `/api/audit` | Super Admin, Admin |
| Settings | `/api/settings` | Super Admin, Admin |
| Reports | `/api/reports` | Super Admin, Admin |
| Dashboard | `/api/dashboard` | All authenticated (role-specific stats) |

Static uploads are served at `/uploads` (proxied by Vite in development).

### Verification script

After starting backend and MySQL, run the included smoke test:

```bash
cd server
node scripts/e2e-verify.js
```

---

## Security Features

- JWT authentication with refresh token rotation
- bcrypt password hashing (passwords never returned by APIs)
- Role-based authorization middleware on all protected routes
- Helmet security headers and CORS configuration
- Rate limiting on auth endpoints
- Input validation via express-validator
- Parameterized SQL queries (mysql2)
- Audit logging for security-sensitive actions

---

## Known Minor Limitations

These items do **not** block demonstration or submission:

| Limitation | Details |
|------------|---------|
| **Performance page metrics** | CPU, memory, storage, and network values are **demo placeholders** with an on-screen disclaimer. They are not connected to live server monitoring. |
| **FullCalendar dependency** | `@fullcalendar/*` packages are listed in `client/package.json` but are **not used** in the current UI. The dashboard uses a custom `SimpleCalendar` component instead. |
| **Frontend bundle size** | Production build completes successfully but may warn about a single JS chunk > 500 KB. This does not affect build output or demo functionality. |
| **Demo credentials** | Seed passwords are shared across demo accounts for convenience. Must be changed for production. |

---

## Troubleshooting

| Issue | Suggested action |
|-------|------------------|
| `ECONNREFUSED` on API calls | Ensure backend is running on port 5000 |
| Database connection failed | Start MySQL/MariaDB; verify `server/.env` credentials |
| Login returns 401 | Confirm seed was run; use demo accounts above |
| Port 5173 or 5000 in use | Stop the conflicting process or change ports in config |
| Profile picture not showing | Ensure backend is running; uploads are served from `/uploads` |

---

## License

Private — AMC Healthcare

---

## Submission Checklist

See the final submission checklist provided with this documentation update, or verify:

- [ ] MySQL running on port 3306
- [ ] `npm run seed` completed successfully
- [ ] Backend running (`npm run dev:server`)
- [ ] Frontend running (`npm run dev:client`)
- [ ] All five demo logins work via `/login`
- [ ] Demo flow completed end-to-end
- [ ] `npm run build` passes
- [ ] `server/.env` not committed; secrets changed for production



Super Admin
superadmin@amc.com            Admin@123

Admin
admin@amc.com                 Admin@123

Receptionist
receptionist@amc.com          Admin@123
Sangeetha@info.com            12345678

GP
gp@amc.com                    Admin@123

AHP
ahp@amc.com                   Admin@123



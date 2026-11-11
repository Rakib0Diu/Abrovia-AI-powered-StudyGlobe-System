# 🌍 StudyGlobe — Abrovia: Your AI Powered Study Companion

**StudyGlobe** is a full-stack web application that helps students prepare to study abroad. Students can explore destination countries, filter universities and academic programs, check upcoming intake schedules and English language requirements, and run real-time scholarship eligibility assessments based on their GPA and IELTS scores. Administrators manage all catalog records through a role-protected dashboard.

> **Important Notes:**
> - **Illustrative Seed Data:** While the 8 countries and 16 universities in `backend/database/setup.sql` are real institutions, all tuition fees, living costs, application deadlines, minimum language scores, and scholarship amounts are **illustrative placeholders** for demonstration purposes.
> - **4.0 GPA Scale:** All student profiles and scholarship eligibility assessments assume a **4.0 GPA scale** everywhere in the application.
> - **Service Role Key Security:** Only the backend holds the Supabase `service_role` key (`SUPABASE_SERVICE_KEY`). The frontend never communicates with Supabase directly and must **never** be given the `service_role` key.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6 (`react-router-dom`), Tailwind CSS v3, Axios, Create React App (`react-scripts`) |
| **Backend** | Node.js (≥ 18, Node 20 recommended), Express.js (CommonJS `require` / `module.exports`) |
| **Database** | PostgreSQL hosted on Supabase (with Row Level Security & Auth trigger) |
| **Authentication** | Supabase Auth (JWT access + refresh tokens via backend API) |
| **Hosting** | Netlify (static frontend + Express wrapped with `serverless-http`) and/or Vercel (`vercel.json` experimental services) |

---

## Project Structure

```text
StudyGlobe_Capstone_Project/
├── backend/
│   ├── app.js                      # Express app: CORS, JSON body, route mounting, 404 & error handlers
│   ├── server.js                   # Local server entry: loads dotenv and listens on PORT
│   ├── package.json
│   ├── .env.example
│   ├── smoke.sh                    # API smoke test script
│   ├── scripts/
│   │   └── smoke.sh                # API smoke test script
│   ├── config/
│   │   └── supabase.js             # Supabase service_role client + fresh auth client factory
│   ├── middleware/
│   │   └── auth.js                 # requireAuth and requireAdmin middleware
│   ├── utils/
│   │   ├── validate.js             # Input validation and Postgres error mapping helpers
│   │   └── asyncHandler.js         # Async route wrapper forwarding errors to next(err)
│   ├── routes/
│   │   ├── auth.js                 # POST /register, /login, /refresh, GET /me
│   │   ├── profile.js              # GET /profile, PUT /profile
│   │   ├── countries.js            # GET /countries, GET /countries/:id
│   │   ├── universities.js         # GET /universities, /universities/country/:countryId, /universities/:id
│   │   ├── programs.js             # GET /programs, /programs/fields, /programs/university/:id, /programs/:id
│   │   ├── intakes.js              # GET /intakes/university/:id
│   │   ├── languageRequirements.js # GET /language-requirements/university/:id
│   │   ├── scholarships.js         # GET /scholarships, /scholarships/university/:id, POST /scholarships/assess
│   │   └── admin.js                # Protected CRUD over the 6 whitelisted catalog tables
│   ├── functions/
│   │   └── api.js                  # Netlify Function wrapper (serverless-http)
│   └── database/
│       └── setup.sql               # Idempotent schema, indexes, RLS policies, trigger, and seed data
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js
│       ├── index.css
│       ├── App.js                  # BrowserRouter, AuthProvider, Navbar, Routes, Footer
│       ├── services/
│       │   └── api.js              # Axios instance, Bearer & 401 refresh interceptors, endpoint helpers
│       ├── context/
│       │   └── AuthContext.js      # Auth state provider & useAuth hook
│       ├── components/
│       │   ├── Navbar.js
│       │   ├── ProtectedRoute.js
│       │   └── UI.js               # Spinner, ErrorAlert, EmptyState, PageHeader, Badge, Card, FormField
│       └── pages/
│           ├── Home.js
│           ├── Login.js
│           ├── Register.js
│           ├── Profile.js
│           ├── Countries.js
│           ├── Universities.js
│           ├── UniversityDetails.js
│           ├── Programs.js
│           └── Admin.js
├── netlify.toml
├── vercel.json
├── .gitignore
└── README.md
```

---

## Local Setup Instructions

### 1. Set Up Supabase Database
1. Create a new project at [supabase.com](https://supabase.com).
2. In your Supabase dashboard, open the **SQL Editor**, paste the entire contents of `backend/database/setup.sql`, and click **Run**.
   - `setup.sql` is completely idempotent (`create table if not exists`, `drop policy if exists`, `on conflict do nothing`) and is safe to re-run at any time.
3. Navigate to **Project Settings → API** and copy:
   - **Project URL** (`SUPABASE_URL`)
   - **`service_role` secret key** (`SUPABASE_SERVICE_KEY`) — *do not use the `anon` public key*.

### 2. Configure & Start the Backend
1. Open a terminal in `backend/` and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_KEY=your-supabase-service-role-key
   PORT=5000
   CLIENT_URL=http://localhost:3000
   ```
3. Start the backend development server:
   ```bash
   npm run dev
   ```
   Verify the server is running by visiting `http://localhost:5000/api/health` (returns `{"status":"ok"}`).

### 3. Configure & Start the Frontend
1. Open a second terminal in `frontend/` and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Create `frontend/.env` for local development:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   The app will open at `http://localhost:3000`.

### 4. Promote a User to Admin
Admin privileges (`is_admin`) can **only** be granted via SQL in the Supabase SQL Editor (never through the API):
1. Register an account in the app UI (e.g., `you@example.com`).
2. In the Supabase **SQL Editor**, run:
   ```sql
   update public.profiles set is_admin = true where email = 'you@example.com';
   ```
3. **Log out and log back in** (or refresh the page) in the web app. Your profile will reload with `is_admin: true`, and the **Admin** link will appear in the navigation bar.

---

## Environment Variables Reference

| Location | Variable | Purpose |
|---|---|---|
| `backend/.env` | `SUPABASE_URL` | Your Supabase Project URL |
| `backend/.env` | `SUPABASE_SERVICE_KEY` | Supabase **`service_role`** secret key (never `anon`, never exposed to frontend) |
| `backend/.env` | `PORT` | Optional local server port (default `5000`) |
| `backend/.env` | `CLIENT_URL` | Optional additional allowed CORS origin |
| `frontend/.env` | `REACT_APP_API_URL` | Local dev: `http://localhost:5000/api`. **Leave unset in production** so requests fall back to `/api` |

---

## Deployment

### Deploying to Netlify (`netlify.toml`)
1. Connect your Git repository to Netlify. `netlify.toml` automatically configures:
   - **Build command:** `npm install --prefix frontend && npm run build --prefix frontend && npm install --prefix backend`
   - **Publish directory:** `frontend/build`
   - **Functions directory:** `backend/functions`
   - **Redirects:** `/api/*` → `/.netlify/functions/api/:splat` and `/*` → `/index.html`
2. In **Netlify Site Configuration → Environment variables**, set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
3. **Leave `REACT_APP_API_URL` unset** in production so the frontend calls relative `/api/*` routes through the Netlify redirect.

### Deploying to Vercel (`vercel.json`)
1. Import the repository into Vercel (`vercel.json` configures `frontend` at `/` and `backend` at `/api`).
2. Add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in the Vercel project environment variables.
3. **Leave `REACT_APP_API_URL` unset** in production.

---

## Common Problems & Troubleshooting

| Symptom / Error | Cause & Solution |
|---|---|
| **`"Cannot reach the server. Is the backend running?"`** | The frontend cannot connect to the API. Make sure the backend is running on port `5000` (`npm run dev` in `backend/`) and `REACT_APP_API_URL=http://localhost:5000/api` is set in `frontend/.env`. |
| **Login or registration fails (`401` / `500` / admin user creation error)** | `SUPABASE_SERVICE_KEY` in `backend/.env` is missing or set to the `anon` key instead of the **`service_role`** key. Copy the `service_role` secret key from **Supabase → Project Settings → API**. |
| **Countries / Universities / Programs pages are empty** | The database has not been seeded yet. Open the Supabase **SQL Editor**, paste `backend/database/setup.sql`, and run it. |
| **No `Admin` link in the navbar after running the SQL update** | Run `update public.profiles set is_admin = true where email = 'you@example.com';` in Supabase SQL Editor, then **log out and log back in** so the frontend fetches your updated profile. |

---

## API Overview (All mounted under `/api`)

| Method & Endpoint | Auth | Description |
|---|---|---|
| `GET /api/health` | Public | Health check (`{"status": "ok"}`) |
| `POST /api/auth/register` | Public | Register a new student (`{ email, password, full_name }`), auto-confirm, create profile, and return session tokens |
| `POST /api/auth/login` | Public | Sign in with `{ email, password }` and return `{ user, profile, access_token, refresh_token, expires_at }` |
| `POST /api/auth/refresh` | Public | Exchange `{ refresh_token }` for a new `{ access_token, refresh_token, expires_at }` |
| `GET /api/auth/me` | 🔒 User | Return current authenticated `{ user, profile }` |
| `GET /api/profile` | 🔒 User | Return current user's profile (`{ data }`) |
| `PUT /api/profile` | 🔒 User | Update profile details, GPA (`0–4`), IELTS (`0–9`), and study preferences |
| `GET /api/countries` | Public | List countries ordered by name (optional `?search=`) |
| `GET /api/countries/:id` | Public | Get country details by ID |
| `GET /api/universities` | Public | List/filter universities (`country_id`, `search`, `min_tuition`, `max_tuition`, `degree_level`, `field`, `sort`) |
| `GET /api/universities/country/:countryId` | Public | List universities in a specific country |
| `GET /api/universities/:id` | Public | Get single university with full country details |
| `GET /api/programs` | Public | List/filter programs (`university_id`, `degree_level`, `field`, `search`, `limit`) |
| `GET /api/programs/fields` | Public | Get sorted list of distinct program fields of study |
| `GET /api/programs/university/:id` | Public | List programs offered by a specific university |
| `GET /api/programs/:id` | Public | Get single program with university details |
| `GET /api/intakes/university/:id` | Public | List intakes for a university ordered by `start_date` |
| `GET /api/language-requirements/university/:id` | Public | List English language test requirements for a university |
| `GET /api/scholarships` | Public | List all scholarships ordered by `deadline` |
| `GET /api/scholarships/university/:id` | Public | List university-specific and country-wide scholarships for a university |
| `POST /api/scholarships/assess` | Public | Assess scholarship eligibility given `{ gpa, ielts, degree_level, university_id, country_id }` |
| `GET /api/admin/:table` | 🛡️ Admin | List rows in a whitelisted catalog table (`countries`, `universities`, `programs`, `intakes`, `language_requirements`, `scholarships`) |
| `GET /api/admin/:table/:id` | 🛡️ Admin | Get single record by ID from a catalog table |
| `POST /api/admin/:table` | 🛡️ Admin | Create a new record in a catalog table |
| `PUT /api/admin/:table/:id` | 🛡️ Admin | Update an existing record in a catalog table |
| `DELETE /api/admin/:table/:id` | 🛡️ Admin | Delete a record from a catalog table |

---

## Functional Requirements Coverage (FR-01 – FR-11)

| ID | Requirement | Implementation |
|---|---|---|
| **FR-01** | Secure enrollment & authentication | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`, `AuthContext.js`, `Login.js`, `Register.js` |
| **FR-02** | User profile management | `GET/PUT /api/profile`, `Profile.js` (personal info, GPA 4.0 scale, IELTS 0–9, preferred country/degree/field, max budget) |
| **FR-03** | Country catalog | `GET /api/countries`, `Countries.js` (living cost, language, currency, visa info, client-side search) |
| **FR-04** | Country-wise universities | `GET /api/universities/country/:countryId`, `GET /api/universities?country_id=`, `Countries.js` → `Universities.js` |
| **FR-05** | University details | `GET /api/universities/:id`, `UniversityDetails.js` (Overview tab, key facts, visa info, website link) |
| **FR-06** | Academic program exploration | `GET /api/programs`, `GET /api/programs/university/:id`, `Programs.js`, and Programs tab in `UniversityDetails.js` |
| **FR-07** | Intake schedule | `GET /api/intakes/university/:id`, Intakes tab in `UniversityDetails.js` with `Open`/`Closed` and deadline status |
| **FR-08** | Language requirement inspection | `GET /api/language-requirements/university/:id`, Language tab in `UniversityDetails.js` |
| **FR-09** | Scholarship eligibility assessment | `POST /api/scholarships/assess`, Scholarships tab in `UniversityDetails.js` with interactive eligibility checker |
| **FR-10** | Admin data management | `backend/routes/admin.js` (`requireAuth` + `requireAdmin`), Supabase RLS policies, `Admin.js` CRUD dashboard & modal |
| **FR-11** | Preference-based filtering | `"✨ Use my preferences"` button in `Universities.js` populating filters from the logged-in student's profile |

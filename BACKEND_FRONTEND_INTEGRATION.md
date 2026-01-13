# Backend & Frontend Integration Guide

## 🔴 Problem Identified

**Issue**: Frontend and Backend API routes don't match!

### Backend Routes:

```
Global prefix: /api
Controller: v1/auth
Full path: /api/v1/auth/register
          /api/v1/auth/login
          /api/v1/auth/logout
```

### Frontend Routes (FIXED):

```typescript
// BEFORE (WRONG):
private readonly apiUrl = '/api/auth';  // ❌ Missing /v1/

// AFTER (CORRECT):
private readonly apiUrl = '/api/v1/auth';  // ✅ Includes /v1/
```

---

## ✅ Solution Applied

### 1. Fixed Frontend API URLs ✅

**File**: `libs/frontend/data-access-auth/src/lib/services/auth.service.ts`

Changed:

```typescript
private readonly apiUrl = '/api/v1/auth';  // Now matches backend!
```

### 2. Proxy Configuration (Already Correct) ✅

**File**: `apps/frontend/proxy.conf.json`

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "logLevel": "debug",
    "changeOrigin": true
  }
}
```

**How it works:**

- Frontend calls: `POST /api/v1/auth/login`
- Proxy forwards to: `http://localhost:3000/api/v1/auth/login`
- Backend receives: `POST /api/v1/auth/login` ✅

---

## 🚀 Step-by-Step Setup Guide

### Prerequisites

1. ✅ Node.js installed
2. ✅ npm packages installed (`npm install`)
3. ✅ Supabase CLI installed (for local database)

---

### Step 1: Setup Environment Variables

**Create `.env` file in project root:**

```bash
# Copy example file
cp .env.example .env

# Edit .env if needed (default values should work for local development)
```

**Default `.env` values (for local Supabase):**

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:6400

# Local Supabase (from: npm run supabase:start)
DB_HOST=localhost
DB_PORT=54322
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=postgres

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_ISSUER=family-planner-api
JWT_AUDIENCE=family-planner-users
```

---

### Step 2: Start Supabase (Local Database)

```bash
# Start local Supabase instance
npm run supabase:start
```

**Expected output:**

```
Started supabase local development setup.

API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
...
```

**⚠️ Important:**

- Database will be available at: `localhost:54322` (not default 5432!)
- Supabase Studio (DB viewer): `http://localhost:54323`

---

### Step 3: Run Database Migrations

```bash
# Apply migrations to create tables (users, etc.)
npm run supabase:migration:up

# OR if that doesn't work:
npm run supabase:db:push
```

**This creates:**

- `users` table (with email, password_hash, display_name, etc.)
- Required indexes
- RLS policies

---

### Step 4: Start Backend

**Terminal 1:**

```bash
npx nx serve backend
```

**Expected output:**

```
╔════════════════════════════════════════════╗
║   Family Planner Backend API Started      ║
╚════════════════════════════════════════════╝

🚀 Server:        http://localhost:3000/api
📚 Swagger Docs:  http://localhost:3000/api/docs
📊 Health Check:  http://localhost:3000/api/health
🔒 Auth:          JWT Bearer Token (Supabase)
🗄️  Database:      PostgreSQL (Supabase)
🌍 Environment:   development

Available endpoints:
  GET  /api/v1/weekly-schedules/:id
```

**Test backend is running:**

```bash
# In another terminal:
curl http://localhost:3000/api/health

# Expected response:
{"status":"ok","uptime":123.456,"timestamp":"...","database":"connected"}
```

---

### Step 5: Start Frontend

**Terminal 2:**

```bash
npx nx serve frontend
```

**Expected output:**

```
Application bundle generation complete.
Watch mode enabled. Watching for file changes...

➜  Local:   http://localhost:6400/
```

---

### Step 6: Test Full Integration

#### Test 1: Health Check

Open browser: `http://localhost:3000/api/health`

**Expected:**

```json
{
  "status": "ok",
  "uptime": 123.456,
  "timestamp": "2026-01-12T14:30:00.000Z",
  "database": "connected"
}
```

✅ **If you see this:** Backend is running and connected to database!

---

#### Test 2: Swagger API Docs

Open browser: `http://localhost:3000/api/docs`

You should see interactive API documentation with:

- Authentication endpoints
- Weekly Schedules endpoints
- Try it out feature

---

#### Test 3: Register New User (Frontend)

1. Open: `http://localhost:6400`
2. Click **"Sign up"**
3. Fill registration form:
   - Email: `test@example.com`
   - Display Name: `Test User`
   - Password: `TestPass123!`
   - Confirm Password: `TestPass123!`
   - ✅ Accept Terms
4. Click **"Create Account"**

**Expected behavior:**

- ✅ Form validates
- ✅ Submit button shows loading spinner
- ✅ API call to `POST /api/v1/auth/register`
- ✅ Success → Navigate to `/dashboard`
- ✅ Dashboard shows: "Welcome back, Test User!"

**Check browser console:**

```
AuthStore: User registered successfully
POST http://localhost:6400/api/v1/auth/register 200 OK
```

**Check backend logs (Terminal 1):**

```
[AuthController] Registration attempt for email: test@example.com
[AuthService] Creating user with email: test@example.com
[AuthService] User created successfully: <uuid>
[AuthService] Generating JWT for user: <uuid>
```

---

#### Test 4: Login (Frontend)

1. Click **"Logout"** (if logged in)
2. Navigate to: `http://localhost:6400/login`
3. Fill login form:
   - Email: `test@example.com`
   - Password: `TestPass123!`
4. Click **"Sign In"**

**Expected behavior:**

- ✅ Success → Navigate to `/dashboard`
- ✅ Dashboard shows user data
- ✅ Authentication works!

---

## 🔍 Troubleshooting

### Problem 1: "Cannot connect to database"

**Symptoms:**

- Backend logs: `❌ Failed to connect to database`
- Health check returns: `"database": "disconnected"`

**Solution:**

```bash
# 1. Check if Supabase is running
npm run supabase:status

# 2. If not running, start it
npm run supabase:start

# 3. Verify DB_PORT in .env is 54322 (not 5432)
```

---

### Problem 2: "Network error" in frontend

**Symptoms:**

- Frontend shows: "⚠️ An unexpected error occurred"
- Console: `POST http://localhost:4200/api/v1/auth/register net::ERR_CONNECTION_REFUSED`

**Solution:**

```bash
# 1. Check if backend is running
curl http://localhost:3000/api/health

# 2. If not running, start backend
npx nx serve backend

# 3. Verify proxy.conf.json points to port 3000
```

---

### Problem 3: "401 Unauthorized" or "Invalid credentials"

**Symptoms:**

- Login fails with 401
- Backend logs: `[AuthService] Invalid password for user`

**Solution:**

1. **Check password**: Make sure you're using correct password
2. **Register again**: If you forgot password, register with new email
3. **Check database**: Open Supabase Studio (`http://localhost:54323`)
   - Navigate to: `Table Editor → users`
   - Verify user exists

---

### Problem 4: CORS Error

**Symptoms:**

- Console: `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**

```bash
# 1. Check FRONTEND_URL in .env
FRONTEND_URL=http://localhost:4200

# 2. Restart backend after changing .env
```

---

### Problem 5: "409 Conflict - Email already exists"

**Symptoms:**

- Registration fails with 409
- Error: "Email already exists"

**Solution:**

1. **Use different email**: Email must be unique
2. **OR delete existing user**:

   ```bash
   # Option A: Via Supabase Studio
   # http://localhost:54323 → users table → delete row

   # Option B: Reset database
   npm run supabase:db:reset
   ```

---

### Problem 6: "Table 'users' does not exist"

**Symptoms:**

- Registration fails with 500
- Backend logs: `relation "users" does not exist`

**Solution:**

```bash
# Run migrations to create tables
npm run supabase:migration:up

# OR push migrations
npm run supabase:db:push

# Verify tables exist:
# Open http://localhost:54323 → check users table
```

---

## 🧪 Testing Checklist

After setup, verify:

- [ ] ✅ Supabase is running (`npm run supabase:status`)
- [ ] ✅ Backend is running on port 3000
- [ ] ✅ Frontend is running on port 4200
- [ ] ✅ Health check works: `http://localhost:3000/api/health`
- [ ] ✅ Swagger docs accessible: `http://localhost:3000/api/docs`
- [ ] ✅ Frontend loads: `http://localhost:4200`
- [ ] ✅ Can register new user
- [ ] ✅ Can login with registered user
- [ ] ✅ Dashboard displays user data
- [ ] ✅ Logout works
- [ ] ✅ Route guards work (try accessing /dashboard when logged out)

---

## 📝 Quick Reference

### Terminal Commands

```bash
# Start all services:

# Terminal 1: Supabase
npm run supabase:start

# Terminal 2: Backend
npx nx serve backend

# Terminal 3: Frontend
npx nx serve frontend

# Stop all:
# Ctrl+C in each terminal
npm run supabase:stop  # Stop Supabase
```

### URLs

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health
- **Supabase Studio**: http://localhost:54323

### API Endpoints

```
POST /api/v1/auth/register   - Create new account
POST /api/v1/auth/login      - Login user
POST /api/v1/auth/logout     - Logout user (requires JWT)
```

---

## 🎯 What's Working Now

After following this guide, you should have:

✅ **Backend**:

- NestJS server running on port 3000
- Connected to local Supabase PostgreSQL
- CORS enabled for frontend
- JWT authentication working
- Swagger API docs

✅ **Frontend**:

- Angular app running on port 4200
- Proxy forwarding `/api/*` to backend
- Login & Registration forms
- Route guards (Auth + PublicOnly)
- Dashboard placeholder
- AuthStore with Angular Signals

✅ **Integration**:

- Frontend can call backend APIs
- User registration works end-to-end
- User login works end-to-end
- Authentication flow complete
- Token storage (memory-based)
- Logout functionality

---

## 🚀 Next Steps

After verifying integration works:

1. **Implement Onboarding Wizard** (family members + goals setup)
2. **Implement Schedule Generator** (AI integration with GPT-4)
3. **Implement Weekly Calendar View**
4. **Add HTTP Interceptors** (AuthInterceptor, ErrorInterceptor)
5. **Implement remaining endpoints** (family-members, recurring-goals, etc.)

---

**Last Updated**: 2026-01-12
**Status**: ✅ Ready for Testing

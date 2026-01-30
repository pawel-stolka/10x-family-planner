# Family Life Planner

> A web-first desktop application that consolidates a family's commitments into one intelligent weekly schedule powered by GPT-4o Turbo.

## Table of Contents
1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [Project Scope](#project-scope)
6. [Project Status](#project-status)
7. [License](#license)

## Project Description
Family Life Planner helps busy parents automatically generate and fine-tune a balanced weekly plan that accounts for work, goals, meals and activities. Users enter fixed blocks (e.g. work) and recurring goals (fitness, hobbies, 1-on-1 time). The system leverages GPT-4o Turbo to propose realistic schedules, kid-friendly meals and activities tailored to location, weather and family preferences—all displayed in an interactive week grid calendar.

Key features (MVP - Current Implementation):
* ✅ **AI-powered schedule generation** – GPT-4o Turbo with customizable strategies (balanced, family-focused, productivity-first)
* ✅ **Interactive week grid calendar** – Dual orientation views (days or hours as columns) with smooth transitions
* ✅ **Smart member filtering** – Visual dimming with member color coding and conflict highlighting
* ✅ **Quick add activities** – Modal for adding time blocks with family member assignment
* ✅ **Activity management** – View, edit, and delete activities with detailed information
* ✅ **Secure authentication** – JWT-based sign-up, login, and logout with bcrypt password hashing
* ✅ **PostgreSQL + Supabase** – Production-ready database with local development support and migrations
* ✅ **Family management** – Create and manage family members with roles (user, spouse, child)
* ✅ **Recurring goals** – Define weekly goals with frequency, duration, and priority settings
* ✅ **AI rescheduling** – One-click week regeneration preserving manually added activities
* 🚧 **Feedback system** – Thumbs up/down for AI suggestions (planned)
* 🚧 **Activity & meal finder** – Location and weather-aware suggestions (Phase 2)

## Tech Stack
| Layer     | Technology |
|-----------|------------|
| Frontend  | Angular 20+, Standalone Components, Signals, SCSS, Angular Material |
| Backend   | NestJS 11, REST API, TypeORM, OpenAI Node SDK |
| AI        | GPT-4o Turbo (≤15 s response) |
| DevOps    | Nx Monorepo, Webpack, Jest, Playwright, ESLint + Prettier, GitHub Actions |
| Database  | PostgreSQL with Supabase (local development + cloud-ready) |
| Auth      | JWT (bcrypt password hashing), custom email & password |
| Deployment| AWS Lambda / API Gateway (planned) |

## Getting Started Locally

### Prerequisites
- Node.js >=20 (recommended: 20.x LTS)
- npm >=10
- Supabase CLI (for local database)

### Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/family-planner.git
cd family-planner

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp env.example .env
# Edit .env and add your OpenAI API key and other required values

# 4. Start Supabase local development (PostgreSQL + Auth)
npm run supabase:start
# This will output connection details - note the JWT_SECRET for your .env

# 5. Run database migrations
npm run supabase:reset

# 6. Start backend and frontend in parallel (watch mode)
npx nx run-many --target=serve --projects=frontend,backend --parallel

# 7. Open the application in your browser
# Frontend: http://localhost:6400
# Backend API: http://localhost:3000
# API Docs (Swagger): http://localhost:3000/api
```

### Quick Commands
```bash
# Start frontend only
npx nx serve frontend

# Start backend only
npx nx serve backend

# Stop Supabase
npm run supabase:stop

# Check Supabase status
npm run supabase:status
```

### Environment Variables
Create a `.env` file at the repo root (see `env.example`) and configure:

**Application (Required):**
* `NODE_ENV` – Environment mode (development/production)
* `PORT` – Backend port (default: 3000)
* `FRONTEND_URL` – Frontend URL for CORS (default: http://localhost:6400)

**Database (Required):**
* `DB_HOST` – PostgreSQL host (default: localhost)
* `DB_PORT` – PostgreSQL port (default: 54322 for Supabase local)
* `DB_USER` – Database user (default: postgres)
* `DB_PASSWORD` – Database password
* `DB_NAME` – Database name (default: postgres)

**Supabase (Required for local development):**
* `SUPABASE_URL` – Supabase local URL (default: http://localhost:54321)

**Authentication (Required):**
* `JWT_SECRET` – Secret key for JWT tokens (min 32 characters, use a strong random string)
* `JWT_ISSUER` – Token issuer identifier (default: family-planner-api)
* `JWT_AUDIENCE` – Token audience identifier (default: family-planner-users)
* `JWT_EXPIRATION` – Token expiration time (default: 1h)

**AI Generation (Required):**
* `OPENAI_API_KEY` – Your OpenAI API key for GPT-4o Turbo
* `OPENAI_MODEL` – Model name (e.g., gpt-4-turbo, gpt-4o-turbo)
* `OPENAI_MAX_TOKENS` – Maximum tokens per request (recommended: 2000-4000)
* `OPENAI_TEMPERATURE` – Creativity parameter 0-2 (recommended: 0.7 for balanced results)

**E2E Testing (Optional):**
* `E2E_USER_EMAIL` – Test user email for Playwright E2E tests
* `E2E_USER_PASSWORD` – Test user password for Playwright E2E tests

**Application:**
* `PORT` – Backend port (default: 3000)
* `FRONTEND_URL` – Frontend URL for CORS (default: http://localhost:6400)
* `NODE_ENV` – Environment (development/production)

## Available Scripts

### Development Commands
| Purpose | Command |
|---------|---------|
| **Run frontend** | `npx nx serve frontend` (http://localhost:6400) |
| **Run backend** | `npx nx serve backend` (http://localhost:3000) |
| **Run both in parallel** | `npx nx run-many --target=serve --projects=frontend,backend --parallel` |

### Supabase (Database)
| Purpose | Command |
|---------|---------|
| Start Supabase local | `npm run supabase:start` |
| Stop Supabase | `npm run supabase:stop` |
| Check status | `npm run supabase:status` |
| Reset database (drop all + migrations) | `npm run supabase:reset` |
| Create new migration | `npm run supabase:migration:new <name>` |
| Generate TypeScript types | `npm run supabase:gen:types` |

### Build & Test
| Purpose | Command |
|---------|---------|
| Build production bundles | `npx nx build <project>` |
| Build all projects | `npx nx run-many --target=build --all` |
| Unit tests (Jest) | `npx nx test <project>` |
| E2E tests (Playwright) | `npx nx e2e frontend-e2e` |
| Playwright UI mode | `npm run playwright-ui` |

### Code Quality
| Purpose | Command |
|---------|---------|
| Lint all projects | `npm run lint:all` |
| Lint specific project | `npx nx lint <project>` |
| View dependency graph | `npx nx graph` |
| View affected apps/libs | `npx nx affected:graph` |

> 💡 **Tip:** This workspace is managed by **Nx**. Most commands use `npx nx <target> <project>` format.

## Project Scope

### Phase 1A - MVP Core (✅ Completed)
1. ✅ **Weekly Schedule Generator** - AI-powered schedule generation with OpenAI GPT-4o Turbo
2. ✅ **Authentication System** - JWT-based registration, login, and logout
3. ✅ **Database Schema** - PostgreSQL with TypeORM and migrations
4. ✅ **Family Management** - Create and manage family members with roles
5. ✅ **Goals & Commitments** - Define recurring goals and fixed commitments
6. ✅ **Week Grid Calendar** - Interactive calendar with day/hour views and member filtering

### Phase 1B - Grid View Enhancements (🚧 85% Complete)
- ✅ Core grid structure with CSS Grid layout (dual orientation: days/hours as columns)
- ✅ Activity display with member colors and conflict detection
- ✅ Quick add activity modal with time slot selection
- ✅ Member filtering with visual dimming (animated transitions)
- ✅ Tooltips and activity details modal
- ✅ Sticky headers and responsive layout
- ✅ Week navigation (previous/next/today)
- ✅ AI-powered schedule regeneration ("Reschedule Week" button)
- 🚧 Drag-and-drop time block editing (planned)
- 🚧 Feedback system (thumbs up/down) for AI suggestions (planned)
- 🚧 Accessibility improvements (keyboard navigation, ARIA labels, screen reader support)

### Phase 2 - Advanced Features (Post-MVP)
- Activity Finder (location & weather aware)
- Meal Planner (quick, kid-friendly recipes)
- Shared family calendar & Google Calendar export
- Responsive/mobile UI
- Habit tracking & advanced analytics
- Shopping list generation

For detailed requirements and roadmap see [`.ai/prd.md`](.ai/prd.md).

## Project Status
✅ **Phase 1A MVP - Completed!** – Core features are fully implemented and functional. Phase 1B enhancements in progress.

**Completed Milestones:**
- ✅ Basic auth & data persistence (JWT + PostgreSQL/Supabase)
- ✅ AI schedule generation with GPT-4o Turbo
- ✅ Interactive week grid calendar with member filtering
- ✅ Family member and recurring goals management
- ✅ Visual conflict detection and activity details

**Next Steps:**
- [ ] Feedback loop for AI suggestions (thumbs up/down)
- [ ] Drag-and-drop time block editing
- [ ] Activity & meal suggestions (Phase 2)
- [ ] Accessibility improvements (keyboard navigation, ARIA labels)

## License
This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

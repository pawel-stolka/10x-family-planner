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
Family Life Planner helps busy parents automatically generate and fine-tune a balanced weekly plan that accounts for work, goals, meals and activities. Users enter fixed blocks (e.g. work) and recurring goals (fitness, hobbies, 1-on-1 time). The system leverages GPT-4o Turbo to propose realistic schedules, kid-friendly meals and activities tailored to location, weather and family preferences—all editable via a drag-and-drop calendar.

Key features (MVP):
* AI-generated weekly schedule with regenerate & feedback (thumbs up/down)
* Day-by-day editing of time blocks
* Basic authentication (sign-up / log-in / account deletion)
* Local storage persistence with a future path to Postgres
* Usage analytics & plan acceptance statistics

## Tech Stack
| Layer     | Technology |
|-----------|------------|
| Frontend  | Angular 20+, Standalone Components, RxJS/Signals, SCSS |
| Backend   | NestJS 11, REST API, OpenAI Node SDK |
| AI        | GPT-4o Turbo (≤15 s response, fallback strategy) |
| DevOps    | Nx Monorepo, Webpack, Jest, Playwright, ESLint + Prettier |
| Deployment| AWS Lambda / API Gateway |
| Storage   | localStorage (MVP) → Postgres |
| Auth      | Email & password (MVP), future Cognito |

## Getting Started Locally
```bash
# 1. Clone the repo
git clone https://github.com/your-org/family-planner.git
cd family-planner

# 2. Install dependencies (Node >=20 recommended)
npm install

# 3. Spin up the apps in watch mode (frontend + backend)
# Requires Nx; it is installed locally, so npx is fine
npx nx run-many --target=serve --projects frontend,backend --parallel

# 4. Open the frontend
open http://localhost:4200
```

### Environment Variables
Create a `.env` file at the repo root (see `.env.example`) and set:
* `OPENAI_API_KEY` – required for GPT-4o Turbo
* `PORT` – optional backend port (default 3333)

## Available Scripts
The workspace is managed by **Nx**; common commands:
| Purpose | Command |
|---------|---------|
| Run Angular frontend | `npx nx serve frontend` |
| Run NestJS backend  | `npx nx serve backend` |
| Build production bundles | `npx nx build frontend` / `backend` |
| Unit tests (Jest) | `npx nx test <project>` |
| E2E tests (Playwright) | `npx nx e2e <project>` |
| Lint all projects | `npx nx lint` |
| Affected apps/libs since last commit | `npx nx affected:graph` |

> ℹ️ The `package.json` currently contains no top-level `scripts`; Nx handles tasks via the CLI.

## Project Scope
*Phase 1 (MVP – 2-4 weeks)*
1. Weekly Schedule Generator (core)
2. Activity Finder (location & weather aware)
3. Meal Planner (quick, kid-friendly recipes)

*Phase 2+ (Post-MVP)*
- Shared family calendar, Google Calendar export
- Responsive/mobile UI
- Habit tracking, advanced analytics
- Shopping list generation

For detailed requirements and future roadmap see [`docs/PRD.md`](.ai/prd.md).

## Project Status
🚧 **Active development** – Phase 1 MVP in progress. Core generator module is being scaffolded; APIs and UI are subject to change.

Milestones:
- [ ] AI schedule generation ≥80 % realistic plans
- [ ] Basic auth & data persistence
- [ ] Feedback loop for AI suggestions

## License
This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

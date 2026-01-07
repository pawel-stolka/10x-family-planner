
---

## `docs/PRD.md`

```markdown
# PRD: Family & Personal Life Planner

## Executive Summary

An AI-powered app to help busy parents balance work, family, personal goals, and relationships by generating realistic weekly schedules and tactical plans (activities, meals, workouts).

---

## Problem Statement

I'm a father of 3 with a fulltime job, 2 side projects, and multiple personal goals (fitness, hobbies, relationship). I struggle to:
1. Fit everything into my weekly schedule.
2. Find activities and meals for my kids.
3. Balance competing priorities (work, family, personal growth, relationship).

---

## Goals

1. Generate a realistic weekly schedule that fits all priorities.
2. Suggest family activities based on location, weather, and kid ages.
3. Recommend quick, kid-friendly recipes for busy weeknights.
4. Adapt dynamically when life disrupts the plan.

---

## Non-Goals (for MVP)

- Multi-user collaboration (family shared calendar).
- Habit tracking / progress analytics.
- Notifications / reminders.
- Mobile app (web-first, mobile-responsive).
- Integration with Google Calendar (future phase).

---

## User Personas

### Primary: Busy Parent (Me)
- **Demographics:** Father of 3 (ages 8yo, 5yo, 4 months), fulltime job, 2 side projects.
- **Pain Points:**
  - Can't fit everything into weekly schedule.
  - Struggle to find activities for kids.
  - Too tired to plan meals; default to takeout.
  - Feel guilty about not spending enough time with wife.
- **Goals:**
  - Realistic weekly schedule that balances all priorities.
  - Quick activity/meal suggestions when needed.
  - More quality time with family.

### Secondary: Partner (Wife)
- **Demographics:** Mother of 3, [add details].
- **Pain Points:**
  - Needs date nights but hard to schedule.
  - Wants help with meal planning.
- **Goals:**
  - Shared calendar visibility (future phase).
  - Date night ideas.

---

## MVP Scope (Phase 1)

### Module 1: Weekly Schedule Generator
**Goal:** Generate a realistic weekly calendar that fits all priorities.

**Inputs:**
- Fixed blocks: work hours, construction trips.
- Recurring goals: running, calisthenics, guitar, praying, date nights.
- Side projects: total hours/week.
- Preferences: energy levels, time-of-day preferences.

**Outputs:**
- Proposed weekly calendar (Mon–Sun) with time blocks.
- Trade-off explanations.
- Conflict flags.
- "Regenerate" button.

**Success Criteria:**
- Proposed schedule is realistic 80%+ of the time.
- I use it weekly.

---

### Module 2: Family Activity Finder
**Goal:** Find activities near current location.

**Inputs:**
- Location, kid ages, time available, weather, interests.

**Outputs:**
- 3–5 activity suggestions with logistics.

**Success Criteria:**
- I use it 2–3x/week.
- Suggestions are age-appropriate and realistic.

---

### Module 3: Meal Planner (Recipes-First)
**Goal:** Suggest quick, kid-friendly recipes.

**Inputs:**
- Meal type, time available, restrictions, ingredients on hand.

**Outputs:**
- 3–5 recipes with picky eater hacks.

**Success Criteria:**
- I use it 3–5x/week.
- Recipes are quick (<30 min) and kid-approved.

---

## User Stories

<!-- [See README.md for full list] -->

---

## Technical Requirements

### Frontend
- Angular 20+ (standalone components).
- Reactive forms for inputs.
- HttpClient for API calls.
- Tailwind CSS for styling.

### Backend
- Node.js + Express (or NestJS).
- OpenAI SDK for AI calls.
- Zod for input validation.
- AWS SDK for deployment.

### Deployment
- AWS Lambda + API Gateway (serverless) or ECS + Fargate (containerized).
- DynamoDB for user data (optional).
- AWS Cognito for auth (future phase).

---

## Success Metrics

- I use the app weekly to plan my schedule.
- The proposed schedule is realistic 80%+ of the time.
- I save 30+ min/week vs manual planning.
- My family uses the activity/meal finder 2–3x/week.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| AI generates unrealistic schedules | Add validation layer; allow manual edits |
| OpenAI API costs too high | Use GPT-4o-mini; cache common prompts |
| Scope creep (too many features) | Stick to MVP; defer Phase 2 features |
| Low adoption (don't use it) | Start with highest-pain module (schedule generator) |

---

## Timeline

- **Phase 1 (MVP):** 2–4 weeks
- **Phase 2 (Integration):** 4–6 weeks
- **Phase 3 (Polish):** 2–4 weeks
- **Phase 4 (Production):** 2–4 weeks

---

## Open Questions

1. Should we integrate with Google Calendar in MVP or defer to Phase 2?
2. Should we support multi-user (family shared calendar) in Phase 2?
3. What's the priority order for modules: schedule > activities > meals?

---

## Appendix

### Personal Constraints
[See README.md or docs/CONSTRAINTS.md]

### AI Prompt Templates
[See README.md]

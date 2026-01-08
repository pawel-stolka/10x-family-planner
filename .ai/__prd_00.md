# Dokument wymagań produktu (PRD) - Family Life Planner

## 1. Przegląd 
Projekt Family Life Planner ma na celu umożliwienie użytkownikom szybkiego tworzenia i zarządzania planem tygodnia rodziny. Aplikacja wykorzystuje modele LLM (poprzez API) do generowania realistycznych planów tygodnia i rozkładu aktywności czy list posiłków (listy zakupów).

## 2. Problem użytkownika
Jesteśmy z żoną rodzicami 3 dzieci, żona jest na urlopie wychowawczym - mam dzienną pracę, 2 poboczne projekty, oraz kilka pobocznych celi (fitness, hobby, relacja z żoną).
Celem aplikacji jest stworzenie planów:
- Połączenie wszystkich celi w tygodniu
- Znajdywanie aktywności i posiłków dla rodziny
- Znajdywanie balansu różnych priorytetów (praca, rodzina, hobby)

## 3. Wymagania funkcjonalne
1. Automatyczne generowanie planów tygodnia w których są uwzględnione wszystkie priorytety
 - Sugeruje aktywności wg lokalizacji, pogody, wieku dzieci, upodobań rodzinnych
 - Rekomnduje szybkie przyjazne dzieciom recepty posiłków
 - Adaptuje się dynamicznie kiedy życie zmienia plany.

2. Edycja tygodnia dzień po dniu

3. Podstawowy system uwierzytelniania i kont użytkowników:
   - Rejestracja i logowanie.
   - Możliwość usunięcia konta i powiązanych planów na życzenie.
   
4. Przechowywanie i skalowalność:
   - Dane o użytkownikach przechowywane w sposób zapewniający skalowalność i bezpieczeństwo.

5. Statystyki generowania planów:
   - Zbieranie informacji o tym, ile podpowiedzi zostało wygenerowanych przez AI i ile z nich ostatecznie zaakceptowano.
   
6. Wymagania prawne i ograniczenia:
   - Dane osobowe użytkowników i fiszek przechowywane zgodnie z RODO.
   - Prawo do wglądu i usunięcia danych (konto wraz z fiszkami) na wniosek użytkownika.
   
## 5. Historyjki użytkowników

---

## Stos technologiczny

- **Frontend:** Angular 20+ (standalone components)
- **Backend:** NestJS
- **AI:** OpenAI API
- **Deployment:** AWS or TBD
- **Storage:** Postgres - later (for user data, optional)
- **Auth:** AWS Cognito (w przyszłości)

---

## MVP Scope (Phase 1)

### Module 1: Weekly Schedule Generator
**Goal:** Generate a realistic weekly calendar that fits all priorities.

**Inputs:**
- Fixed blocks: work hours (Mon–Fri 9am–5pm), construction trips (every 2 weeks, 2–3 days).
- Recurring goals:
  - Running: 3x/week, 30–45 min, prefer mornings.
  - Calisthenics: 2x/week, 45–60 min, flexible.
  - Guitar: 1x/week, 30–60 min, prefer evenings.
  - Praying: daily, 10–15 min, prefer mornings.
  - Date nights: 2–4x/week, 1.5–2 hours, evenings after kids' bedtime.
- Side projects: 5–8 hours/week total, flexible.
- Preferences: energy levels (peak mornings, low afternoons).

**Outputs:**
- Proposed weekly calendar (Mon–Sun) with time blocks.
- Trade-off explanations: "Moved guitar to Sunday because Tue/Thu are packed."
- Conflict flags: "No time for 4 date nights this week; suggest 2–3."
- "Regenerate" button for alternative schedules.

**API Endpoint:**
POST /api/schedule/generate
Body: { fixedBlocks, recurringGoals, preferences }
Response: { calendar: [...], tradeOffs: "...", conflicts: [...] }




---

### Module 2: Family Activity Finder
**Goal:** Find activities/family time ideas near current location.

**Inputs:**
- Location (city or address).
- Kid ages: [2, 5, 7].
- Time available: "next 2 hours", "this afternoon", "Saturday morning".
- Weather: sunny/rainy/cold (auto-fetch or manual).
- Interests: outdoor/indoor, free/paid, active/calm.
- Optional: nap windows, stroller needed.

**Outputs:**
- 3–5 activity suggestions ranked by fit:
  - Name, type, distance/travel time.
  - Why it fits (age-appropriate, weather, time).
  - Duration estimate, cost (free/$/$$/$$).
  - Logistics: parking, restrooms, stroller-friendly, crowd level.
  - Backup option if weather changes.

**API Endpoint:**
POST /api/activities/find
Body: { location, kidAges, timeAvailable, weather, interests }
Response: { activities: [...] }


---

### Module 3: Meal Planner (Recipes-First)
**Goal:** Suggest quick, kid-friendly recipes for busy weeknights.

**Inputs:**
- Meal type: breakfast, lunch, snack, dinner.
- Time available: 15 min, 30 min, 45 min, 1 hour+.
- Kid ages: [2, 5, 7].
- Dietary restrictions: allergies, picky eaters, vegetarian, etc.
- Ingredients on hand (optional): "chicken, rice, broccoli".
- Cooking skill: easy, medium.
- Optional: "Also suggest restaurants" checkbox.

**Outputs:**
- 3–5 recipes:
  - Name, time, difficulty, servings.
  - Ingredients list.
  - Why it works (kid-approved, minimal cleanup, one-pot).
  - Picky eater hack (substitutions, plain versions).
  - Step-by-step instructions (4–5 steps).
- Optional: 1–2 restaurant fallbacks (if checkbox enabled).

**API Endpoint:**
POST /api/meals/find
Body: { mealType, timeAvailable, kidAges, restrictions, ingredientsOnHand, includeRestaurants }
Response: { recipes: [...], restaurants: [...] }



---

## User Stories

### Weekly Schedule Generator
1. As a user, I want to input my fixed commitments (work, construction trips) so the system knows my constraints.
2. As a user, I want to set recurring goals (running 3x/week) so the system schedules them.
3. As a user, I want a proposed weekly calendar so I can see if everything fits.
4. As a user, I want to regenerate the plan if I don't like it.
5. As a user, I want to see trade-off explanations so I understand why certain activities were moved.

### Activity Finder
1. As a user, I want to find activities near my current location so I can spend quality time with my kids.
2. As a user, I want age-appropriate suggestions so activities fit my kids (ages 2, 5, 7).
3. As a user, I want weather-aware suggestions so I don't plan outdoor activities on rainy days.
4. As a user, I want backup options so I have a Plan B if weather changes.

### Meal Planner
1. As a user, I want quick recipe suggestions (15–30 min) so I can cook on busy weeknights.
2. As a user, I want kid-friendly recipes so my kids will actually eat them.
3. As a user, I want picky eater hacks so I can customize recipes per kid.
4. As a user, I want recipes using ingredients I already have so I minimize grocery trips.
5. As a user, I want restaurant fallbacks so I have an option if I'm too tired to cook.

---

## Non-Goals (for MVP)

- Multi-user collaboration (family shared calendar).
- Habit tracking / progress analytics.
- Notifications / reminders.
- Mobile app (web-first, mobile-responsive).
- Integration with Google Calendar (future phase).
- Meal prep / shopping list generator (future phase).

---

## Architecture

### Frontend (Angular)
- **Standalone components** (no NgModules).
- **Reactive forms** for inputs.
- **HttpClient** for API calls.
- **RxJS** for state management (or NgRx if needed).
- **Tailwind CSS** for styling.

### Backend (Node.js + Express or NestJS)
- **REST API** (or GraphQL if preferred).
- **OpenAI SDK** for AI calls.
- **Zod** for input validation.
- **AWS SDK** for deployment.

### Deployment (AWS)
- **Option A:** Lambda + API Gateway (serverless).
- **Option B:** ECS + Fargate (containerized).
- **Storage:** DynamoDB (user data, optional) or S3 (for exports).
- **Auth:** AWS Cognito (future phase).

---

## API Design

### `POST /api/schedule/generate`
**Request:**
```json
{
  "fixedBlocks": [
    { "day": "Mon-Fri", "start": "09:00", "end": "17:00", "label": "Work" },
    { "day": "Nov 18-20", "label": "Construction trip" }
  ],
  "recurringGoals": [
    { "activity": "running", "frequency": "3x/week", "duration": "30-45 min", "preference": "mornings" },
    { "activity": "calisthenics", "frequency": "2x/week", "duration": "45-60 min", "preference": "flexible" },
    { "activity": "guitar", "frequency": "1x/week", "duration": "30-60 min", "preference": "evenings" },
    { "activity": "praying", "frequency": "daily", "duration": "10-15 min", "preference": "mornings" },
    { "activity": "date nights", "frequency": "2-4x/week", "duration": "1.5-2 hours", "preference": "evenings after 8pm" }
  ],
  "sideProjects": { "totalHours": 8, "flexibility": "high" },
  "preferences": { "energyPeak": "mornings", "energyLow": "afternoons" }
}
```

**Response:**
```json
{
  "calendar": [
    { "day": "Monday", "blocks": [
      { "time": "06:30-07:00", "activity": "Praying", "type": "personal" },
      { "time": "07:00-07:45", "activity": "Running", "type": "fitness" },
      { "time": "09:00-17:00", "activity": "Work", "type": "fixed" },
      { "time": "20:00-21:30", "activity": "Date night", "type": "relationship" }
    ]},
    { "day": "Tuesday", "blocks": [...] }
  ],
  "tradeOffs": "Moved guitar to Sunday because Tue/Thu are packed with date nights. Side project hours reduced to 6 this week due to construction trip.",
  "conflicts": ["No time for 4 date nights this week; suggest 2-3.", "Calisthenics overlaps with low-energy afternoon; moved to evening."]
}
```

---

### `POST /api/activities/find`
**Request:**
```json
{
  "location": "Austin, TX",
  "kidAges": [2, 5, 7],
  "timeAvailable": "next 2 hours",
  "weather": "sunny",
  "interests": ["outdoor", "free"],
  "napWindows": "12:30-14:00"
}
```

**Response:**
```json
{
  "activities": [
    {
      "name": "Zilker Park Playground",
      "type": "outdoor",
      "distance": "8 min walk",
      "duration": "1-2 hours",
      "cost": "free",
      "whyItFits": "Shade, water fountain, fenced, picnic tables. Ages 2-8.",
      "logistics": { "parking": "street", "stroller": true, "restrooms": true, "crowd": "low weekdays" },
      "backup": "Nearby library story time at 10:30am"
    }
  ]
}
```

---

### `POST /api/meals/find`
**Request:**
```json
{
  "mealType": "dinner",
  "timeAvailable": "30 min",
  "kidAges": [2, 5, 7],
  "restrictions": ["nut allergy", "picky eaters"],
  "ingredientsOnHand": "chicken, rice, broccoli",
  "skill": "easy",
  "includeRestaurants": false
}
```

**Response:**
```json
{
  "recipes": [
    {
      "name": "One-Pot Chicken & Rice",
      "time": "25 min",
      "difficulty": "easy",
      "servings": "4-5",
      "ingredients": ["chicken breast", "rice", "broccoli", "chicken broth", "butter"],
      "whyItWorks": "One pot, kid-approved, uses ingredients on hand",
      "pickyEaterHack": "Serve plain rice + chicken on side for picky eaters",
      "steps": [
        "1. Sauté chicken in butter until golden (5 min).",
        "2. Add rice, broth; bring to boil (2 min).",
        "3. Reduce heat, cover, simmer 15 min.",
        "4. Add broccoli last 3 min.",
        "5. Fluff and serve."
      ]
    }
  ],
  "restaurants": []
}
```

---

## AI Prompt Templates

### Weekly Schedule Generator
```text
You are a meticulous personal planner for a busy father of 3.

Constraints:
- Respect fixed blocks (work, construction trips) as immovable.
- Prioritize family time (bedtime routines, date nights) and sleep.
- Schedule recurring goals (running, calisthenics, guitar, praying, date nights) realistically.
- Use energy levels: peak mornings for high-focus tasks, low afternoons for admin/rest.
- Side projects are flexible; reduce hours if week is packed.
- Include travel time, transitions, and realistic durations.

Inputs:
- Fixed blocks: {{fixedBlocks}}
- Recurring goals: {{recurringGoals}}
- Side projects: {{sideProjects}}
- Preferences: {{preferences}}

Output format (JSON):
{
  "calendar": [
    { "day": "Monday", "blocks": [
      { "time": "06:30-07:00", "activity": "Praying", "type": "personal" },
      { "time": "07:00-07:45", "activity": "Running", "type": "fitness" },
      ...
    ]},
    ...
  ],
  "tradeOffs": "Explain why certain activities were moved or reduced.",
  "conflicts": ["List any unresolved conflicts or warnings."]
}

Rules:
- Prioritize: family > personal health > side projects.
- Flag if goals can't fit (e.g., "No time for 4 date nights this week").
- Propose realistic alternatives.
```

---

### Activity Finder
```text
You are a family activity planner for small kids.

Constraints:
- Activities must be age-appropriate for kids ages {{kidAges}}.
- Respect time available: {{timeAvailable}}.
- Consider weather: {{weather}}.
- Prioritize interests: {{interests}}.
- Include logistics: parking, restrooms, stroller access, crowd levels.
- Provide backup options if weather changes.

Inputs:
- Location: {{location}}
- Kid ages: {{kidAges}}
- Time available: {{timeAvailable}}
- Weather: {{weather}}
- Interests: {{interests}}
- Nap windows: {{napWindows}}

Output 3-5 activities in this format (JSON):
[
  {
    "name": "...",
    "type": "outdoor/indoor",
    "distance": "8 min walk",
    "duration": "1-2 hours",
    "cost": "free/$/$$/$$",
    "whyItFits": "...",
    "logistics": { "parking": "...", "stroller": true/false, "restrooms": true/false, "crowd": "low/medium/high" },
    "backup": "..."
  }
]
```

---

### Meal Planner
```text
You are a practical family meal planner for busy parents with small kids.

Constraints:
- Recipes must be kid-friendly, quick, and minimize cleanup.
- Respect time limit: {{timeAvailable}}.
- Respect dietary restrictions: {{restrictions}}.
- Prioritize ingredients on hand: {{ingredientsOnHand}}.
- Prefer one-pot/sheet-pan meals.
- Include "picky eater hacks" (plain versions, substitutions).

Inputs:
- Meal type: {{mealType}}
- Time available: {{timeAvailable}}
- Kid ages: {{kidAges}}
- Restrictions: {{restrictions}}
- Ingredients on hand: {{ingredientsOnHand}}
- Skill: {{skill}}

Output 3-5 recipes in this format (JSON):
[
  {
    "name": "...",
    "time": "25 min",
    "difficulty": "easy",
    "servings": "4-5",
    "ingredients": ["...", "..."],
    "whyItWorks": "...",
    "pickyEaterHack": "...",
    "steps": ["1. ...", "2. ...", "..."]
  }
]
```

---

## Roadmap

### Phase 1: MVP (AI Course Project) — 2–4 weeks
- [ ] Weekly Schedule Generator
  - [ ] Input form: fixed blocks, recurring goals, preferences
  - [ ] API: `POST /api/schedule/generate` (OpenAI)
  - [ ] Output: weekly calendar with time blocks
  - [ ] "Regenerate" button
  - [ ] localStorage for last inputs
- [ ] Activity Finder
  - [ ] Input form: location, time, weather, interests
  - [ ] API: `POST /api/activities/find` (OpenAI)
  - [ ] Output: 3–5 activity suggestions
- [ ] Meal Planner
  - [ ] Input form: meal type, time, restrictions, ingredients
  - [ ] API: `POST /api/meals/find` (OpenAI)
  - [ ] Output: 3–5 recipes + optional restaurants

### Phase 2: Integration — 4–6 weeks
- [ ] Unified calendar view (all modules)
- [ ] Cross-module context sharing (location, kid ages, preferences)
- [ ] Google Calendar export
- [ ] "What if?" mode (schedule variations)

### Phase 3: Polish — 2–4 weeks
- [ ] Mobile-responsive UI
- [ ] Favorites/history
- [ ] Shopping list generator (from recipes)
- [ ] Habit tracking (optional)

### Phase 4: Production — 2–4 weeks
- [ ] AWS deployment (Lambda + API Gateway or ECS)
- [ ] Auth (AWS Cognito)
- [ ] DynamoDB for user data
- [ ] CI/CD pipeline

---

## Success Metrics

- I use the app weekly to plan my schedule.
- The proposed schedule is realistic 80%+ of the time.
- I save 30+ min/week vs manual planning.
- My family uses the activity/meal finder 2–3x/week.

---


Response:

{
  "calendar": [
    { "day": "Monday", "blocks": [
      { "time": "06:30-07:00", "activity": "Praying", "type": "personal" },
      { "time": "07:00-07:45", "activity": "Running", "type": "fitness" },
      { "time": "09:00-17:00", "activity": "Work", "type": "fixed" },
      { "time": "20:00-21:30", "activity": "Date night", "type": "relationship" }
    ]},
    { "day": "Tuesday", "blocks": [...] }
  ],
  "tradeOffs": "Moved guitar to Sunday because Tue/Thu are packed with date nights. Side project hours reduced to 6 this week due to construction trip.",
  "conflicts": ["No time for 4 date nights this week; suggest 2-3.", "Calisthenics overlaps with low-energy afternoon; moved to evening."]
}ther, and kid ages.
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
- **Demographics:** Father of 3 (ages 2, 5, 7), fulltime job, 2 side projects.
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

[See README.md for full list]

---

## Technical Requirements

### Frontend
- Angular 19+ (standalone components).
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
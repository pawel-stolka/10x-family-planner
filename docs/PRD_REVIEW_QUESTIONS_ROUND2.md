# PRD Review Questions - Round 2

Follow-up questions based on initial answers to define MVP scope and start development.

---

## CRITICAL: MVP Scope & Priority (Must Answer First)

### Module Priority Decision

1. **Which ONE module should we build first?**
   - [x] Weekly Schedule Generator
   - [ ] Family Activity Finder
   - [ ] Meal Planner
2. **Why that module? What specific pain does it solve that you feel most acutely?**
This is the most tricky family issue

3. **What's the absolute minimum version of that module that would be useful?**

   - For Schedule Generator: Just input fixed blocks + goals and get a calendar?
   - For Activity Finder: Just location + kid ages and get suggestions?
   - For Meal Planner: Just get recipe suggestions without planning?

4. **Can we ship Module 1 as MVP, validate it works, then build Module 2 & 3?**

   - This would help hit the EoY deadline with something usable

5. **Or do you need all 3 modules working together to make the app useful?**
 - let's start from simple 1 module

---

## Data Model & Persistence

You mentioned starting with local storage. Let's define what needs to be saved:

### User Profile Data

6. **What user profile information needs to be stored?**

   - Name, email?
   - Family members (names, ages, relationships)?
   - Work schedule (fixed hours)?
   - Location/address?
   - Preferences (energy levels, time-of-day preferences)?

7. **Should family member profiles be separate entities?**
   - Example: User → has many FamilyMembers (wife, kids)
   - Or just fields on the user profile?

### Goals & Recurring Activities

8. **How should recurring goals be stored?**

   - Example: "Running 3x/week, 30 min each, prefer morning"
   - What fields: activity name, frequency, duration, preferred time, priority?

9. **Should goals have a priority/importance level (1-5 or low/medium/high)?**

10. **Should goals be flexible (e.g., "3-4x/week") or rigid (e.g., "exactly 3x/week")?**

### Schedule Data

11. **What should be saved from generated schedules?**

    - The entire week's schedule?
    - Which suggestions were accepted vs rejected?
    - User edits to the schedule?
    - Feedback (thumbs up/down)?

12. **Should each generated schedule be versioned/saved?**

    - So you can go back to "Week of Nov 19" and see what you did?

13. **How will "fixed blocks" be defined?**
    - Example: "Mon-Fri 9am-5pm: Work", "Tue 6pm-7pm: Kids' Soccer"
    - Should these be one-time or recurring?

### Recipes & Meals

14. **You said recipes from API - which API?**

    - Spoonacular?
    - Edamam?
    - TheMealDB (free)?
    - Just AI-generated recipes (cheaper)?

15. **Should favorite recipes be saved locally?**

16. **Should meal plans be saved?**
    - "Week of Nov 19: Monday - Tacos, Tuesday - Pasta, etc."

### Activities

17. **Should past activities be tracked?**

    - So the AI knows "we went to the zoo last month, suggest something different"

18. **Should favorite/bookmarked activities be saved?**

---

## Authentication & User Management

You said auth is needed with login/password.

19. **Single user account per family or separate accounts?**

    - Example: Dad has account, adds family members as "dependents"
    - Or: Dad and Wife each have separate accounts?

20. **For MVP with 1-2 concurrent users, do you need a full auth system?**

    - Could you start with a single hardcoded user and add auth in Phase 2?
    - Or is multi-user needed from day 1 (you + wife)?

21. **If you need login/password, what's the implementation?**
    - Store hashed passwords in local storage (for MVP)?
    - Use a simple JWT approach?
    - Or just defer auth to Phase 2 and use session storage for now?

---

## AI Integration - Claude

You said Claude 4.5 Sonnet instead of OpenAI.

22. **Do you have an Anthropic API key already?**

23. **What's the pricing for Claude API?**

    - Need to verify it fits the $50/month budget

24. **Will you use streaming responses?**

    - For better UX (show schedule as it's being generated)
    - Or wait for full response?

25. **How will prompts be structured?**

    - Example: "Generate a weekly schedule given these inputs: [JSON]"
    - Should we create prompt templates in code or database?

26. **For the Schedule Generator, what's the expected prompt structure?**

    ```
    Example prompt:
    "I'm a father of 3 (ages 8, 5, 4mo) with a fulltime job.
    Fixed blocks: Mon-Fri 9am-5pm work
    Goals: Running 3x/week 30min (prefer morning), Guitar 2x/week 1hr (prefer evening)
    Generate a realistic weekly schedule."
    ```

    - Is this the right structure?

27. **Should the AI response be structured JSON or natural language?**
    - JSON: `{ "monday": [{ "time": "6am-6:30am", "activity": "Running" }] }`
    - Or natural language that you parse?

---

## Recipe API Integration

You said recipes should come from an API.

28. **Which recipe API should we use?**

    - **Spoonacular**: Powerful, paid ($150/month for 5k calls)
    - **Edamam**: Recipe + nutrition, paid ($70/month starter)
    - **TheMealDB**: Free, limited features
    - **API Ninjas Recipes**: Free tier available
    - **Just use Claude to generate recipes**: Cheapest option

29. **What recipe data do you need?**

    - Recipe name, ingredients, steps?
    - Prep time, cook time?
    - Nutrition info?
    - Images?
    - Kid-friendly rating?

30. **How many recipe calls per week do you expect?**

    - Affects which API tier you need

31. **Should Claude call the recipe API or should the app call it directly?**
    - Option A: App calls recipe API, passes results to Claude for filtering/recommendations
    - Option B: Claude uses function calling to search recipes
    - Option C: Just have Claude generate recipes (no external API)

---

## Schedule Generator - Detailed Requirements

Let's define the Schedule Generator module in detail since it might be Module 1.

### Input Form

32. **What should the input form look like?**

    - One big form with all inputs?
    - Multi-step wizard?
    - Saved profile + "generate this week" button?

33. **What fields are absolutely required for MVP?**

    - Fixed blocks (work hours)?
    - List of goals?
    - Preferences?
    - Family context (kids ages)?
    - Side projects hours?

34. **How should "fixed blocks" be entered?**

    - Free text: "Mon-Fri 9am-5pm work"?
    - Structured form: Day selector + Start time + End time + Label?
    - Calendar picker?

35. **How should goals be entered?**

    - Free text: "Run 3x per week, 30 min each, morning preferred"?
    - Structured form: Activity, Frequency, Duration, Time Preference, Priority?

36. **Should side projects be separate entities or just goals?**
    - Example: "Side Project A: 5 hours this week" vs "Work on Project A: 1hr per day"

### Output Display

37. **How should the generated schedule be displayed?**

    - Weekly calendar view (7 columns)?
    - List view (grouped by day)?
    - Timeline view?
    - Google Calendar style?

38. **Should time slots be hourly, 30-min, 15-min intervals?**

39. **What time range should be shown?**

    - 6am-10pm?
    - 5am-midnight?
    - Configurable?

40. **How should the schedule show reasoning/trade-offs?**
    - Below the calendar: "I prioritized running in the morning because you prefer it..."
    - Tooltips on each time block?
    - Separate "Explanation" section?

### Editing & Regeneration

41. **How should manual edits work?**

    - Click a time block and edit inline?
    - Drag and drop to move activities?
    - Delete and regenerate that day?

42. **When you click "Regenerate", should it:**

    - Regenerate the entire week?
    - Keep some blocks and regenerate others?
    - Offer variations (Option A, Option B, Option C)?

43. **Should edits be persisted?**

    - If you edit Monday's schedule, should it stay edited?
    - Or regenerate everything each time?

44. **Should there be a "lock" feature?**
    - Lock Monday's schedule, regenerate Tue-Sun only?

---

## Activity Finder - Detailed Requirements

If Activity Finder is a priority module:

45. **How will location be provided?**

    - Browser geolocation?
    - Manual address entry?
    - Saved home address?

46. **Should activities be suggested by Claude or from an external API?**

    - Option A: Claude generates creative ideas based on location/context
    - Option B: Use Google Places API to find real venues
    - Option C: Hybrid (Claude + Places API)

47. **What counts as an "activity"?**

    - Physical places (park, museum, trampoline park)?
    - Events (farmers market, festival)?
    - At-home activities (craft project, board game)?
    - All of the above?

48. **You said map with scroll/zoom - should this be interactive?**

    - Like: Activity suggestions plotted on Google Maps?
    - Or just a list with addresses?

49. **For 8yo, 5yo, and 4mo - should activities consider all ages?**
    - Find activities that work for all 3?
    - Or separate suggestions per age group?

---

## Meal Planner - Detailed Requirements

If Meal Planner is a priority module:

50. **You said "weekly meal plan" - does this mean:**

    - Generate 7 dinners for the week?
    - Generate breakfast, lunch, dinner for 7 days?
    - Just dinners?

51. **Should the meal plan consider:**

    - Variety (no repeats)?
    - Prep time budget per day?
    - Leftovers (make extra on Sunday to eat Monday)?
    - Ingredient reuse (use the same chicken for 2 recipes)?

52. **You said "preferences or recipes will be provided" - how?**

    - User enters: "Kids like pasta, chicken, tacos. No seafood."?
    - User uploads favorite recipes?
    - User selects from categories (Italian, Mexican, etc.)?

53. **Should meal plans be tied to the weekly schedule?**

    - Example: On busy nights (soccer practice), suggest 15-min meals?
    - On light nights, suggest 45-min "nice" dinners?

54. **You said "maybe yes" to shopping lists - is this MVP or Phase 2?**

---

## UI/UX & User Flow

### Navigation

55. **How should the app be structured?**

    - Single page with tabs (Schedule | Activities | Meals)?
    - Separate routes (`/schedule`, `/activities`, `/meals`)?
    - Dashboard with 3 cards linking to each module?

56. **Should there be a "Home" or "Dashboard" view?**

    - Shows: This week's schedule + upcoming activities + this week's meals?
    - Or go straight to a module?

57. **Should modules be completely separate or connected?**
    - Example: From schedule view, click a dinner time block → suggest meals?

### First-Time User Experience

58. **What happens when a user first opens the app?**

    - Welcome screen → onboarding wizard?
    - Goes straight to schedule generator form?
    - Shows empty dashboard with "Get Started" buttons?

59. **Should there be an onboarding flow to set up profile?**

    - Example: Step 1: Tell us about your family, Step 2: Add your goals, Step 3: Generate schedule

60. **Or just let users jump in and generate a schedule immediately?**

### Loading States

You said yes to loading states/skeleton screens.

61. **For AI-generated content (takes up to 15 sec), what should the UX be?**
    - Loading spinner with "Generating your schedule..." message?
    - Progress bar with stages ("Analyzing inputs... Planning activities... Resolving conflicts...")?
    - Skeleton/ghost UI showing empty calendar that fills in?
    - Streaming response (show schedule as it's generated)?

### Error Handling

62. **What should happen if Claude API fails?**

    - Show error message: "Failed to generate schedule. Try again."?
    - Retry automatically?
    - Show last generated schedule with warning?

63. **What should happen if user enters invalid inputs?**
    - Example: "Work on side project 40 hours/week" (unrealistic)
    - Should the app validate and warn?
    - Or let Claude handle it and explain why it's unrealistic?

---

## Testing Strategy

You said Playwright for e2e testing.

64. **What user flows should be tested in e2e tests?**

    - Example: "User enters schedule inputs → clicks generate → sees schedule"
    - Which flows are critical for MVP?

65. **Should you write tests as you build or after MVP is working?**

    - Test-driven approach?
    - Or get it working first, then add tests?

66. **Do you want unit tests for frontend components?**

    - You said "no TestBed, Jest, do not use .subscribe()"
    - So: Jest tests for components/services?
    - Or skip unit tests and rely on e2e?

67. **How will you test AI responses?**
    - Mock Claude API responses in tests?
    - Use real API (expensive, slow)?
    - Snapshot testing (save expected output, compare)?

---

## Deployment & Infrastructure

### Local Storage Approach

You said start with local storage (not DynamoDB).

68. **Where will local storage live?**

    - Browser localStorage (client-side only)?
    - Or local JSON files on the server?
    - Or SQLite database locally?

69. **If using browser localStorage, how will data be backed up?**

    - Export/import JSON?
    - Or accept that clearing browser data = losing everything?

70. **When will you migrate to a real database?**
    - After MVP works?
    - Or when you need multi-user support?

### Backend Deployment

You said AWS with $20/month budget and local, dev, prod environments.

71. **How will you deploy the NestJS backend?**

    - AWS Lambda + API Gateway (serverless)?
    - AWS ECS Fargate (containerized)?
    - AWS Lightsail (simple VM)?
    - AWS Amplify?

72. **What AWS services fit the $20/month budget?**

    - Lambda: Very cheap (probably $0-5/month for low traffic)
    - Lightsail: $3.50-5/month for smallest instance
    - ECS Fargate: $15-30/month minimum

73. **Should backend be deployed from day 1 or run locally during MVP?**

    - Could you build the whole app and deploy later?
    - Or deploy early to test end-to-end?

74. **What's the "dev" environment?**
    - Deployed to AWS (separate from prod)?
    - Or just local development?

### Frontend Deployment

75. **Where will the Angular app be hosted?**

    - AWS S3 + CloudFront?
    - AWS Amplify (simplest)?
    - Vercel/Netlify (free tier)?
    - Same server as backend?

76. **Should frontend and backend be separate deployments or monorepo?**
    - Separate repos: `family-planner-frontend`, `family-planner-backend`?
    - Monorepo with Nx/Turborepo?
    - Simple monorepo (frontend/ and backend/ folders)?

### CI/CD with GitHub Actions

You said GitHub Actions for CI/CD.

77. **What should the GitHub Actions workflow do?**

    - Run tests (unit + e2e)?
    - Build frontend + backend?
    - Deploy to AWS?
    - All of the above?

78. **Should deployment be automatic or manual?**

    - Push to `main` → auto-deploy to prod?
    - Push to `develop` → auto-deploy to dev?
    - Or manual approval required?

79. **Do you have AWS credentials set up for GitHub Actions?**
    - AWS IAM user with deployment permissions?
    - Or need to set this up?

---

## Timeline & Milestones

You said 2h/day until EoY (end of year = ~40 days = ~80 hours total).

80. **Let's break this into milestones. Does this seem realistic?**

    **Milestone 1: Project Setup (Week 1 - 10 hours)**

    - Set up Angular + NestJS projects
    - Set up GitHub repo + Actions
    - Set up Claude API integration
    - Hello world deployment

    **Milestone 2: Module 1 MVP (Weeks 2-3 - 30 hours)**

    - Build input form for Module 1
    - Integrate Claude API
    - Display generated output
    - Basic styling

    **Milestone 3: Polish & Test (Week 4 - 20 hours)**

    - Add loading states, error handling
    - E2E tests
    - Manual testing
    - Bug fixes

    **Milestone 4: Module 2 (Weeks 5-6 - 30 hours)**

    - Build Module 2

    **Milestone 5: Module 3 (Weeks 7-8 - 30 hours)**

    - Build Module 3

    **Total: ~8 weeks to build all 3 modules**

81. **Does this timeline work or should we cut scope?**

    - Build 1 module by EoY?
    - Build all 3 but simpler versions?
    - Extend deadline?

82. **What's the definition of "done" for EoY?**
    - All 3 modules working locally?
    - 1 module deployed to prod?
    - All 3 modules deployed + tested?

---

## Open Decisions

### Still Need Answers

83. **Recipe API decision - which one?**

    - This affects cost and implementation
    - Recommendation: Start with Claude-generated recipes (free), add API later if needed

84. **What data gets persisted? (Question 34 from Round 1)**

    - Need to define the data model before building

85. **Module priority (Questions 110-112 from Round 1)**

    - MUST decide which module to build first

86. **Auth: Needed for MVP or defer to Phase 2?**
    - Simplest MVP: No auth, single user, browser localStorage
    - Or: Simple login/password stored locally
    - Or: Full auth system from day 1

---

## Recommendations

Based on your answers, here's what I recommend:

### Suggested MVP (Option A: Aggressive - All 3 Modules)

- All 3 modules, minimal versions
- No auth (add in Phase 2)
- Browser localStorage only
- Claude for everything (schedules + recipes + activity ideas)
- Deploy to AWS Amplify (simplest)
- Timeline: 8 weeks (until ~mid-January)

### Suggested MVP (Option B: Conservative - 1 Module)

- Build Schedule Generator only
- No auth (single user)
- Browser localStorage
- Claude for generation
- Deploy to AWS Amplify
- Timeline: 3-4 weeks (by EoY)
- Add Modules 2 & 3 in Q1 2025

### Suggested MVP (Option C: Balanced - 1 Module + Hooks)

- Build Schedule Generator fully
- Add basic Activity Finder (Claude-generated suggestions, no map)
- Add basic Meal Planner (Claude-generated recipes, no API)
- No auth
- Browser localStorage
- Deploy to AWS Amplify
- Timeline: 6 weeks (early January)

---

## Next Steps

**To move forward, please answer:**

1. **Questions 1-5**: Module priority decision
2. **Questions 6-13**: Data model for that module
3. **Questions 80-82**: Timeline and milestone approval
4. **Question 83**: Recipe API decision (or just use Claude?)
5. **Question 86**: Auth decision for MVP

Once these are answered, I can generate:

- Technical design document
- API specifications
- Database schema
- Component architecture
- First task: Set up the project skeleton

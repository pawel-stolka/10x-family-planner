# Architektura UI dla Family Life Planner

## 1. Przegląd struktury UI

Family Life Planner to desktopowa aplikacja webowa zaprojektowana w architekturze **desktop-first** z podstawową responsywnością. Aplikacja wykorzystuje Angular 20+ ze standalone components, Angular Signals dla zarządzania stanem oraz reactive forms.

### Kluczowe założenia architektoniczne:
- **Desktop-first approach**: Główny fokus na rozdzielczości >1280px, responsywność dla tablet/mobile jako enhancement
- **AI-driven generation**: Integracja z GPT-4o Turbo (max 15s response time) jako główna funkcjonalność
- **Modular structure**: Zgodność ze strukturą monorepo NX (libs/frontend/*)
- **Security-first**: Supabase JWT authentication, route guards, GDPR compliance
- **Progressive enhancement**: Łatwa rozbudowa o Phase 2 features (Activity Finder, Meal Planner)

### Tech Stack UI:
- **Framework**: Angular 20+, standalone components
- **State Management**: Angular Signals + Facade Pattern
- **Forms**: Reactive Forms z custom validators
- **HTTP**: HttpClient z interceptorami (auth, cache, error handling)
- **Styling**: SCSS, CSS Grid dla layoutu kalendarza
- **Testing**: Jest (unit), Playwright (E2E)

## 2. Lista widoków

### 2.1 Auth Views

#### 2.1.1 Login View
- **Ścieżka**: `/login`
- **Typ**: Public route
- **Główny cel**: Umożliwienie zalogowania się zarejestrowanym użytkownikom
- **Kluczowe informacje**:
  - Formularz logowania (email, password)
  - Link do rejestracji
  - Remember me checkbox
- **Kluczowe komponenty**:
  - `LoginFormComponent` - reactive form z walidacją
  - `ErrorMessageComponent` - wyświetlanie błędów API
- **API Endpoints**:
  - `POST /auth/login` → `{token, user}`
- **UX/A11y/Security**:
  - Auto-focus na email input
  - Keyboard navigation (Tab, Enter)
  - Password visibility toggle
  - ARIA labels dla screen readers
  - Rate limiting przez API (60 req/min)
  - Secure token storage (memory + optional httpOnly cookie)
- **Stany**:
  - Default: puste pola
  - Loading: disabled button, spinner
  - Error: toast notification z błędem (401: "Invalid credentials")
  - Success: redirect do Dashboard lub Onboarding

#### 2.1.2 Registration View
- **Ścieżka**: `/register`
- **Typ**: Public route
- **Główny cel**: Umożliwienie utworzenia nowego konta
- **Kluczowe informacje**:
  - Formularz rejestracji (email, password, confirm password, displayName optional)
  - GDPR compliance checkbox (Terms & Privacy Policy)
  - Link do logowania
- **Kluczowe komponenty**:
  - `RegistrationFormComponent` - reactive form z async validators
  - `PasswordStrengthIndicatorComponent`
- **API Endpoints**:
  - `POST /auth/register` → `{token, user}`
- **UX/A11y/Security**:
  - Real-time email uniqueness check (debounce 500ms)
  - Password strength indicator
  - Password match validator
  - Must accept terms checkbox
  - WCAG AA compliance (color contrast, labels)
- **Stany**:
  - Default: puste pola
  - Validating: async check email uniqueness
  - Error: 400 (email exists), inline errors
  - Success: auto-login → redirect do Onboarding Wizard

### 2.2 Onboarding Flow

#### 2.2.1 Onboarding Wizard (Multi-step)
- **Ścieżka**: `/onboarding`
- **Typ**: Protected route (first-time users only)
- **Główny cel**: Przeprowadzenie nowego użytkownika przez setup profilu rodziny
- **Kluczowe informacje**:
  - **Step 1 - Welcome**: Wyjaśnienie funkcji aplikacji, co użytkownik będzie robił
  - **Step 2 - Family Members**: Dodanie członków rodziny (POST /family-members)
  - **Step 3 - Recurring Goals**: Konfiguracja celów dla każdego członka (POST /recurring-goals)
  - **Step 4 - Review & Generate**: Podsumowanie, opcjonalne wygenerowanie pierwszego tygodnia
- **Kluczowe komponenty**:
  - `OnboardingStepperComponent` - progress indicator (●━━━○━━━○━━━○)
  - `OnboardingWelcomeComponent` - step 1
  - `FamilyMemberFormComponent` - step 2, reusable
  - `RecurringGoalFormComponent` - step 3, reusable
  - `OnboardingReviewComponent` - step 4
- **API Endpoints**:
  - `POST /family-members` - dodanie członka
  - `POST /recurring-goals` - dodanie celu
  - `POST /schedule-generator` - opcjonalne wygenerowanie pierwszego tygodnia
- **UX/A11y/Security**:
  - Linear stepper z możliwością Back/Skip
  - Save progress (localStorage) dla powrotu później
  - Keyboard navigation między krokami
  - Validation każdego kroku przed Continue
  - Skip option → redirect do pustego Dashboard
- **Validation Rules**:
  - Step 2: min 1 member (owner auto-created), role ∈ {USER, SPOUSE, CHILD}, age required gdy role=CHILD
  - Step 3: goal name required, frequencyPerWeek > 0, duration > 0
- **Stany**:
  - Each step: default, loading, error, completed
  - Progress saved in localStorage (step index, form data)
  - Final step: option to generate first week lub skip

### 2.3 Main Application Views

#### 2.3.1 Dashboard (Home)
- **Ścieżka**: `/dashboard` (default after login)
- **Typ**: Protected route
- **Główny cel**: Hub aplikacji - przegląd bieżącego tygodnia, quick actions, statystyki
- **Kluczowe informacje**:
  - Welcome message z imieniem użytkownika
  - Mini preview bieżącego tygodnia (current week schedule)
  - Quick actions (Generate New Week, Add Fixed Block, Edit Family, Manage Goals)
  - Usage statistics summary (weeks planned, acceptance rate, time saved)
  - Recent activity feed (generated schedules, added goals)
- **Kluczowe komponenty**:
  - `WeekPreviewComponent` - mini kalendarz current week
  - `QuickActionsComponent` - przyciski do głównych akcji
  - `UsageStatsCardComponent` - statystyki z mini chart
  - `RecentActivityFeedComponent` - timeline recent actions
- **API Endpoints**:
  - `GET /weekly-schedules?weekStartDate={current}` - bieżący tydzień
  - `GET /weekly-usage-stats` - statystyki
  - `GET /user` - user profile
- **UX/A11y/Security**:
  - Quick access do wszystkich głównych funkcji
  - Skip links dla screen readers
  - Auto-refresh stats (polling każde 30s gdy aktywny tab)
  - Empty state gdy brak schedules: CTA "Generate Your First Week"
- **Responsive**:
  - Desktop: 2-column layout (week preview + stats/actions)
  - Tablet: stacked vertically
  - Mobile: single column, collapsed preview

#### 2.3.2 Weekly Schedule View (Calendar)
- **Ścieżka**: `/schedule` lub `/schedule/:scheduleId`
- **Typ**: Protected route
- **Główny cel**: Główny widok kalendarza - wyświetlanie i edycja time blocks dla wybranego tygodnia
- **Kluczowe informacje**:
  - 7-day grid (Mon-Sun) z time slots 6am-11pm
  - Time blocks z color coding (Work, Activity, Meal, Other)
  - Week navigation (prev/next)
  - Filters (family member, block type)
  - Conflict warnings
  - Shared blocks indicators
- **Kluczowe komponenty**:
  - `WeeklyCalendarComponent` - główny grid (CSS Grid: 7 columns)
  - `CalendarHeaderComponent` - week navigation, filters, actions
  - `TimeBlockCardComponent` - wizualizacja pojedynczego bloku
  - `TimeBlockEditPanelComponent` - side panel do edycji
  - `AddTimeBlockModalComponent` - quick add przy kliknięciu pustego slotu
  - `ConflictWarningComponent` - visual indicator konfliktów
- **API Endpoints**:
  - `GET /weekly-schedules/{scheduleId}` - schedule z embedded time blocks
  - `GET /weekly-schedules/{scheduleId}/time-blocks` - lista bloków
  - `POST /weekly-schedules/{scheduleId}/time-blocks` - dodanie bloku
  - `PATCH /time-blocks/{blockId}` - edycja bloku
  - `DELETE /time-blocks/{blockId}` - usunięcie bloku
  - `POST /schedule-generator/{scheduleId}/regenerate` - regeneracja tygodnia
- **UX/A11y/Security**:
  - Click empty slot → Quick add modal
  - Click existing block → Side panel edit (zamiast modal dla lepszego UX)
  - Keyboard navigation (Arrow keys, Tab, Enter, Escape)
  - Drag & drop (Phase 2 enhancement)
  - Visual conflict detection (red border + warning icon)
  - Color-coded blocks: Work (blue), Activity (green), Meal (orange), Personal (purple), Shared (pink)
  - ARIA labels dla każdego bloku
  - Focus trap w side panel
  - Optimistic updates z rollback przy błędach
- **Validation & Business Logic**:
  - Prevent overlapping blocks dla tego samego familyMemberId (backend EXCLUDE constraint)
  - API returns 409 conflict → show warning + suggest resolution
  - timeRange must be valid (end > start)
- **Stany**:
  - Loading: skeleton placeholders dla bloków
  - Empty: "No blocks this day" + CTA button
  - Conflicts: visual highlight + resolution options
  - Editing: side panel open, form focused
- **Responsive**:
  - Desktop (>1280px): 7-column grid, side panel
  - Tablet (768-1279px): 3-4 days visible, horizontal scroll, modal editing
  - Mobile (<768px): single day view, swipe between days, bottom sheet editing

#### 2.3.3 Schedule Generator View
- **Ścieżka**: `/generate`
- **Typ**: Protected route
- **Główny cel**: Konfiguracja i wygenerowanie nowego tygodnia przez AI
- **Kluczowe informacje**:
  - Week selector (calendar picker, default: next Monday)
  - Strategy selector (Balanced, Energy-optimized, Goal-focused)
  - Preference checkboxes (Respect fixed blocks, Include all goals, Prefer mornings, Maximize family time)
  - Current setup summary (family members count, total goals, fixed blocks, available time)
  - Generate / Preview buttons
- **Kluczowe komponenty**:
  - `ScheduleGeneratorFormComponent` - konfiguracja generowania
  - `GenerationProgressModalComponent` - loading z progress bar (max 15s)
  - `GeneratedSchedulePreviewModalComponent` - preview przed zaakceptowaniem
  - `FeedbackButtonsComponent` - thumbs up/down
- **API Endpoints**:
  - `POST /schedule-generator` - wygeneruj i zapisz
  - `POST /schedule-generator/preview` - wygeneruj draft bez zapisywania
  - `POST /feedback` - submit thumbs up/down
- **UX/A11y/Security**:
  - Default week: najbliższy przyszły poniedziałek
  - Progress modal z możliwością cancel (AbortController)
  - Timeout warning po 12s (przed hard limit 15s)
  - Preview mode pokazuje summary przed save (# goals scheduled, conflicts, distribution)
  - Feedback collection integrated (thumbs up/down + optional comments)
  - Validation: nie można generować dla przeszłych tygodni
- **AI Generation Flow**:
  1. User wypełnia konfigurację
  2. Click Generate → POST /schedule-generator
  3. Progress modal (streaming updates if supported, lub polling)
  4. Po zakończeniu → Preview modal z summary
  5. User: Accept & Save (→ redirect do Calendar) lub Regenerate (→ restart flow)
  6. Feedback prompt (thumbs up/down)
- **Stany**:
  - Default: formularz konfiguracji
  - Generating: progress modal, cancel option
  - Preview: modal z generated schedule summary
  - Error: timeout, API error, conflict error
  - Success: redirect do Schedule View z nowym scheduleId
- **Error Handling**:
  - Timeout (>15s): error modal "Generation timeout. Try again?"
  - API error: toast notification z retry option
  - Conflicts detected: pokazane w preview z resolution suggestions

#### 2.3.4 Family Setup View
- **Ścieżka**: `/family`
- **Typ**: Protected route
- **Główny cel**: Zarządzanie członkami rodziny i ich recurring goals
- **Kluczowe informacje**:
  - Lista członków rodziny (cards z edit/delete actions)
  - Lista recurring goals (grouped by family member)
  - Add member / Add goal buttons
  - Goal details: frequency, duration, preferred time, priority
- **Kluczowe komponenty**:
  - `FamilyMemberListComponent` - cards z członkami
  - `FamilyMemberCardComponent` - pojedynczy członek
  - `RecurringGoalListComponent` - lista celów
  - `RecurringGoalCardComponent` - pojedynczy cel
  - `AddMemberModalComponent` - formularz dodania członka
  - `AddGoalModalComponent` - formularz dodania celu
  - `EditMemberModalComponent` - edycja członka
  - `EditGoalModalComponent` - edycja celu
- **API Endpoints**:
  - `GET /family-members` - lista członków (pagination)
  - `POST /family-members` - dodanie członka
  - `PATCH /family-members/{memberId}` - edycja członka
  - `DELETE /family-members/{memberId}` - soft-delete członka
  - `GET /recurring-goals?memberId={id}` - cele dla członka
  - `POST /recurring-goals` - dodanie celu
  - `PATCH /recurring-goals/{goalId}` - edycja celu
  - `DELETE /recurring-goals/{goalId}` - soft-delete celu
- **UX/A11y/Security**:
  - Expandable/collapsible member cards
  - Filters: sort by priority, filter by member
  - Confirmation modal przy delete (member lub goal)
  - Visual grouping goals by member
  - Auto-created owner (current user) nie może być usunięty
  - ARIA labels, keyboard navigation
- **Validation**:
  - Member: name required, role ∈ {USER, SPOUSE, CHILD}, age>0 gdy CHILD
  - Goal: name required, frequencyPerWeek>0, preferredDurationMinutes>0, priority ∈ {LOW, MEDIUM, HIGH}
- **Stany**:
  - Loading: skeleton cards
  - Empty members: nie powinno się zdarzyć (owner always exists)
  - Empty goals: "No goals yet. Add your first goal!"
  - Editing: modal open z formularzem
- **Responsive**:
  - Desktop: 2-section layout (members + goals)
  - Tablet/Mobile: accordion-style, stacked sections

#### 2.3.5 History View
- **Ścieżka**: `/history`
- **Typ**: Protected route
- **Główny cel**: Przegląd poprzednich tygodni, analiza wzorców
- **Kluczowe informacje**:
  - Lista past schedules (sorted by weekStartDate desc)
  - Filters: date range, AI-generated flag
  - Preview każdego tygodnia (collapsed)
  - Analytics: acceptance rate, goal completion
- **Kluczowe komponenty**:
  - `HistoryListComponent` - lista schedules
  - `ScheduleHistoryCardComponent` - single schedule preview
  - `HistoryFiltersComponent` - date range, flags
  - `AnalyticsChartComponent` - trends over time
- **API Endpoints**:
  - `GET /weekly-schedules?pagination&sort=weekStartDate:desc`
  - `GET /usage-stats?from={date}&to={date}`
  - `GET /feedback?scheduleId={id}`
- **UX/A11y/Security**:
  - Pagination (20 items per page)
  - Lazy loading dla performance
  - Click schedule → expand preview lub navigate do full calendar
  - Filter by date range (date picker)
  - Analytics chart showing trends (acceptance rate, goal completion over weeks)
- **Stany**:
  - Loading: skeleton cards
  - Empty: "No past schedules. Generate your first week!"
  - Filtered empty: "No schedules match your filters"
- **Responsive**:
  - Desktop: grid of cards (2-3 columns)
  - Tablet/Mobile: single column list

#### 2.3.6 Profile/Settings View
- **Ścieżka**: `/profile`
- **Typ**: Protected route
- **Główny cel**: Zarządzanie profilem użytkownika, ustawienia, GDPR compliance, statystyki
- **Kluczowe informacje**:
  - Account info (display name, email, member since)
  - Usage statistics (detailed charts)
  - Preferences (notifications, theme, default strategy)
  - Data & Privacy (download data, legal docs)
  - Danger zone (delete account)
  - Logout button
- **Kluczowe komponenty**:
  - `ProfileInfoComponent` - edycja display name
  - `UsageStatsDetailComponent` - detailed stats z charts
  - `PreferencesComponent` - settings
  - `DataPrivacyComponent` - GDPR compliance
  - `DangerZoneComponent` - delete account
  - `DeleteAccountModalComponent` - confirmation z typing verification
- **API Endpoints**:
  - `GET /user` - user profile
  - `PATCH /user` - update display name
  - `DELETE /user` - delete account (cascade all data)
  - `GET /weekly-usage-stats` - detailed stats
  - `POST /auth/logout` - logout
- **UX/A11y/Security**:
  - Display name editable inline, auto-save (debounce 500ms)
  - Email read-only (security)
  - Delete account requires typing "DELETE" + confirmation modal
  - Download data button (export JSON of all user data - GDPR)
  - Links to Terms of Service & Privacy Policy
  - Theme selector (Light/Dark/Auto) - stored in localStorage
  - Charts library dla visualizacji (Chart.js)
- **Validation**:
  - Display name: 1-50 characters
  - Delete confirmation: must type exact string "DELETE"
- **Stany**:
  - Default: wyświetlanie danych
  - Editing: inline edit aktywny
  - Saving: spinner przy Save Changes
  - Deleting: confirmation modal → loading → redirect to landing
- **Security**:
  - Delete account → POST /auth/logout → clear all client state → redirect
  - Session timeout warning (modal before expiry)
  - Token refresh mechanism

### 2.4 Error Views

#### 2.4.1 404 Not Found
- **Ścieżka**: `/**` (catch-all)
- **Główny cel**: Informowanie o nieistniejącej stronie
- **Kluczowe komponenty**: `NotFoundComponent`
- **UX**: Link do Dashboard, search functionality

#### 2.4.2 500 Server Error
- **Ścieżka**: triggered by ErrorInterceptor
- **Główny cel**: Graceful handling server errors
- **Kluczowe komponenty**: `ServerErrorComponent`
- **UX**: Retry button, link to support

## 3. Mapa podróży użytkownika

### 3.1 Główny przepływ: Nowy użytkownik → Pierwszy wygenerowany tydzień

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: REGISTRATION & ONBOARDING                                      │
└─────────────────────────────────────────────────────────────────────────┘

1. Landing Page (poza scope MVP - redirect do /login)
   ↓
2. Registration View (/register)
   • User wypełnia: email, password, displayName
   • Akceptuje Terms & Privacy Policy
   • Submit → POST /auth/register
   ↓
3. Auto-login + Token Storage
   • JWT stored in memory (AuthStore Signal)
   • Optional: refresh token w httpOnly cookie
   ↓
4. Onboarding Wizard (/onboarding)
   
   Step 1: Welcome
   • Wyjaśnienie funkcjonalności
   • [Let's Get Started] → Next
   ↓
   Step 2: Family Members
   • Auto-created: John Doe (USER/Owner)
   • User dodaje: Spouse, Children
   • POST /family-members dla każdego
   • Validation: role, age (if CHILD)
   • [Continue] → Next
   ↓
   Step 3: Recurring Goals
   • Dla każdego członka rodziny:
     - Name, frequency, duration, time preference, priority
   • POST /recurring-goals dla każdego
   • Validation: frequencyPerWeek>0, duration>0
   • [Continue] → Next
   ↓
   Step 4: Review & Generate
   • Summary: 4 members, 12 goals
   • Option 1: [Generate My First Week]
     → POST /schedule-generator
     → Progress Modal (max 15s)
     → Preview Modal (summary, feedback)
     → Accept → Redirect to Calendar View
   • Option 2: [Skip to Dashboard]
     → Redirect to empty Dashboard
   ↓
5. Dashboard (/dashboard)
   • Welcome back, John!
   • Current week preview (if generated)
   • Quick actions visible
   • Usage stats (initial: 0 weeks, 0 acceptance)

┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: WEEKLY USAGE CYCLE                                             │
└─────────────────────────────────────────────────────────────────────────┘

6. User navigates: Dashboard → [🪄 Generate New Week]
   ↓
7. Schedule Generator View (/generate)
   • Week selector: Jan 20-26 (next Monday)
   • Strategy: Balanced
   • Checkboxes: ☑ Respect fixed blocks, ☑ Include all goals
   • [Generate] → POST /schedule-generator
   ↓
8. Generation Process
   • Progress Modal: "Optimizing family activity times..." (75%)
   • Max 15s, cancel option available
   • On completion → Preview Modal
   ↓
9. Preview & Feedback
   • Summary: "✓ 12/12 goals scheduled, 0 conflicts"
   • Quick preview (collapsed calendar)
   • Feedback: [👍 Great] or [👎 Nope]
   • [Accept & Save] → POST /feedback (rating: 1)
   ↓
10. Weekly Schedule View (/schedule)
    • 7-day grid, Mon-Sun, 6am-11pm
    • Time blocks color-coded
    • User interactions:
      a) Click block → Side Panel Edit
         - Edit title, time, type, member
         - PATCH /time-blocks/{id}
         - Optimistic update + rollback on error
      b) Click empty slot → Quick Add Modal
         - POST /time-blocks
         - Conflict detection (409) → warning shown
      c) [Regenerate] button
         - POST /schedule-generator/{id}/regenerate
         - Confirmation: "This will replace existing blocks"
    ↓
11. Living with the schedule
    • User checks Dashboard daily
    • Edits blocks as needed (ad-hoc changes)
    • Completes week
    ↓
12. Next week cycle
    • Return to step 6 (Generate New Week)
    • AI learns from feedback (thumbs up/down)

┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: MAINTENANCE & MANAGEMENT                                       │
└─────────────────────────────────────────────────────────────────────────┘

13. Updating Family Setup
    • User navigates: Dashboard → [👥 Edit Family]
    • Family Setup View (/family)
    • Add new goal: [+ Add Goal]
      → Modal → POST /recurring-goals
    • Edit existing goal: [Edit]
      → Modal → PATCH /recurring-goals/{id}
    • Delete member/goal: [×]
      → Confirmation modal → DELETE
    ↓
14. Reviewing History
    • User navigates: Dashboard → History
    • History View (/history)
    • Filters by date range
    • Views past weeks analytics
    • Identifies patterns (e.g., Fridays always over-scheduled)
    ↓
15. Managing Profile
    • User navigates: Dashboard → [👤 Profile]
    • Profile View (/profile)
    • Views detailed usage stats
    • Downloads data (GDPR)
    • Changes preferences
    ↓
16. Logout
    • [Log Out] → POST /auth/logout
    • Clear client state (AuthStore reset)
    • Redirect to /login
```

### 3.2 Przepływ alternatywny: Returning User (codzienne użycie)

```
1. Login (/login)
   • POST /auth/login
   ↓
2. Dashboard (/dashboard)
   • GET /weekly-schedules?weekStartDate={current}
   • GET /weekly-usage-stats
   • User sees current week preview
   ↓
3. Quick action: [View Full Schedule]
   • Navigate to /schedule
   ↓
4. Weekly Schedule View
   • View today's blocks
   • Quick edit if needed (click block → side panel)
   • PATCH /time-blocks/{id}
   ↓
5. Return to Dashboard or Logout
```

### 3.3 Przepływ błędów i edge cases

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ERROR SCENARIOS                                                          │
└─────────────────────────────────────────────────────────────────────────┘

A. AI Generation Timeout (>15s)
   • Progress modal: "Taking longer than usual..."
   • At 15s: Error modal
   • Message: "Generation timeout. The server may be busy."
   • Actions: [Try Again] [Cancel]
   • User clicks Try Again → restart POST /schedule-generator
   
B. API 409 Conflict (overlapping blocks)
   • User tries to add block 2-4pm
   • Another block exists 3-5pm for same member
   • API returns 409 with conflict details
   • UI shows: ⚠️ "Conflict: Overlaps with 'Gym Session' 3-5pm"
   • Actions: [Adjust Time] [Override] [Cancel]
   
C. Network Error
   • Any API call fails (network down)
   • ErrorInterceptor catches
   • Toast notification: "⚠️ Network error. Check connection."
   • Retry mechanism (exponential backoff)
   • Offline indicator in UI
   
D. 401 Unauthorized (token expired)
   • User session expired during active use
   • AuthInterceptor catches 401
   • Attempts token refresh
   • If refresh fails:
     - Clear auth state
     - Redirect to /login
     - Toast: "Session expired. Please log in again."
   
E. Validation Errors (400)
   • User submits invalid form data
   • API returns 400 with field errors
   • UI displays inline field errors
   • Example: "Frequency must be greater than 0"
   • Submit button remains disabled until valid
   
F. Empty States
   • No schedules yet:
     - Empty state component
     - Message: "No schedules yet"
     - CTA: [Generate Your First Week]
   • No goals:
     - Message: "No goals configured"
     - CTA: [Add Your First Goal]
```

### 3.4 Mapowanie User Stories z PRD

| User Story | Widoki zaangażowane | Główne interakcje | API Endpoints |
|-----------|---------------------|-------------------|---------------|
| **US-001: Rejestracja konta** | Registration View | Wypełnienie formularza, akceptacja terms, submit | POST /auth/register |
| **US-002: Logowanie** | Login View | Podanie credentials, submit | POST /auth/login |
| **US-003: Generowanie tygodnia AI** | Schedule Generator View, Weekly Schedule View | Konfiguracja, generate, preview, accept | POST /schedule-generator, GET /weekly-schedules/{id} |
| **US-004: Przegląd i zatwierdzanie** | Schedule Generator Preview Modal, Weekly Schedule View | Preview w modalu, thumbs up/down, accept & save, view full calendar | POST /feedback, GET /weekly-schedules |
| **US-005: Edycja harmonogramów** | Weekly Schedule View | Click block → side panel edit, save changes | PATCH /time-blocks/{id}, PATCH /weekly-schedules/{id} |
| **US-006: Bezpieczny dostęp** | Wszystkie protected routes | Route guards, JWT authentication, RLS enforcement | Authorization header w każdym request |

## 4. Układ i struktura nawigacji

### 4.1 Struktura nawigacji

```
┌─────────────────────────────────────────────────────────────────────────┐
│ NAVIGATION BAR (Top, sticky)                                            │
│ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ 🏠 Family Life Planner  [Dashboard] [Schedule] [Family] [Profile]│ [👤 John ▾] │
│ └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Komponenty nawigacji:**
- `TopNavigationComponent` (sticky, zawsze widoczny po zalogowaniu)
  - Logo + App name (link do /dashboard)
  - Primary navigation links:
    - Dashboard (/dashboard) - default landing
    - Schedule (/schedule) - main calendar view
    - Family (/family) - members & goals management
    - Profile (/profile) - settings & stats
  - User menu dropdown (top-right):
    - Display name + avatar
    - My Profile
    - Settings (redirect do /profile)
    - Log Out (POST /auth/logout)

**Navigation state management:**
- Active route highlighting (Angular Router `routerLinkActive`)
- Breadcrumbs dla sub-views (np. Schedule > Edit Block)
- Back button w niektórych kontekstach (onboarding, modals)

### 4.2 Routing Architecture

```typescript
// Route structure
const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginView, canActivate: [PublicOnlyGuard] },
  { path: 'register', component: RegistrationView, canActivate: [PublicOnlyGuard] },
  
  // Protected routes
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: 'onboarding', component: OnboardingWizard, canActivate: [FirstTimeUserGuard] },
      { path: 'dashboard', component: DashboardView },
      { path: 'schedule', component: WeeklyScheduleView },
      { path: 'schedule/:scheduleId', component: WeeklyScheduleView },
      { path: 'generate', component: ScheduleGeneratorView },
      { path: 'family', component: FamilySetupView },
      { path: 'history', component: HistoryView },
      { path: 'profile', component: ProfileView },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  // Error routes
  { path: '404', component: NotFoundView },
  { path: '**', redirectTo: '404' }
];
```

**Route Guards:**
- `AuthGuard`: Sprawdza `AuthStore.isAuthenticated()`, redirect do /login jeśli false
- `PublicOnlyGuard`: Redirect do /dashboard jeśli user już zalogowany
- `FirstTimeUserGuard`: Redirect do /dashboard jeśli onboarding już completed (localStorage flag)

### 4.3 Navigation Patterns

**Primary Navigation (Top Bar):**
- Persistent across all views (poza login/register)
- Highlight aktywnego linku
- Dropdown user menu

**Contextual Navigation:**
- Dashboard: Quick action cards z deep links
- Calendar: Week navigation (◀ ▶), filters, regenerate button
- Modals: Back/Cancel buttons

**Mobile Navigation (< 768px):**
- Hamburger menu (collapsible)
- Bottom navigation bar (alternative pattern)
- Swipe gestures (calendar days)

### 4.4 Breadcrumbs & Back Navigation

Breadcrumbs tylko w głębszych kontekstach:
- Schedule > Edit Time Block
- Family > Edit Member > Edit Goals
- History > Week Details

## 5. Kluczowe komponenty

### 5.1 Layout Components

#### 5.1.1 TopNavigationComponent
- **Cel**: Główna nawigacja aplikacji
- **Użycie**: Wszystkie protected routes
- **Propsy**: `currentUser: Signal<User | null>`
- **Funkcjonalność**:
  - Logo + app name
  - Primary nav links z active state
  - User menu dropdown
  - Logout action
- **Responsive**: Hamburger menu na mobile

#### 5.1.2 SidebarComponent (optional, Phase 2)
- **Cel**: Secondary navigation dla sub-sections
- **Użycie**: Dashboard, Family Setup
- **Responsive**: Collapsible na tablet/mobile

### 5.2 Form Components

#### 5.2.1 LoginFormComponent
- **Cel**: Formularz logowania
- **Użycie**: Login View
- **API**: POST /auth/login
- **Features**:
  - Reactive form z walidacją
  - Remember me checkbox
  - Password visibility toggle
  - Error handling (401)

#### 5.2.2 RegistrationFormComponent
- **Cel**: Formularz rejestracji
- **Użycie**: Registration View
- **API**: POST /auth/register
- **Features**:
  - Async email uniqueness validator
  - Password strength indicator
  - Password match validator
  - Terms checkbox (required)

#### 5.2.3 FamilyMemberFormComponent (Reusable)
- **Cel**: Dodanie/edycja członka rodziny
- **Użycie**: Onboarding Step 2, Family Setup View
- **API**: POST /family-members, PATCH /family-members/{id}
- **Propsy**: `mode: 'create' | 'edit'`, `initialData?: FamilyMember`
- **Features**:
  - Name, role, age (conditional), preferences
  - Role dropdown validation
  - Age required when role=CHILD

#### 5.2.4 RecurringGoalFormComponent (Reusable)
- **Cel**: Dodanie/edycja recurring goal
- **Użycie**: Onboarding Step 3, Family Setup View
- **API**: POST /recurring-goals, PATCH /recurring-goals/{id}
- **Propsy**: `mode: 'create' | 'edit'`, `initialData?: RecurringGoal`, `availableMembers: FamilyMember[]`
- **Features**:
  - Goal name, description, frequency, duration, time preference, priority
  - Family member selector
  - Validation: frequency>0, duration>0

#### 5.2.5 TimeBlockFormComponent
- **Cel**: Dodanie/edycja time block
- **Użycie**: Weekly Schedule View (side panel, quick add modal)
- **API**: POST /time-blocks, PATCH /time-blocks/{id}
- **Propsy**: `mode: 'create' | 'edit'`, `initialData?: TimeBlock`, `scheduleId: string`
- **Features**:
  - Title, type, family member, date, start time, end time, shared checkbox, notes
  - Conflict detection (API 409)
  - Visual warning przy overlaps

### 5.3 Calendar Components

#### 5.3.1 WeeklyCalendarComponent
- **Cel**: Główny grid kalendarza (7 dni × 17 godzin)
- **Użycie**: Weekly Schedule View, Dashboard (mini preview)
- **API**: GET /weekly-schedules/{id}
- **Propsy**: `scheduleId: Signal<string>`, `editable: boolean`, `compact?: boolean`
- **Features**:
  - CSS Grid: 7 columns (days), rows (time slots 30min intervals)
  - Renders `TimeBlockCardComponent` dla każdego bloku
  - Click handlers (empty slot, existing block)
  - Conflict visual indicators
  - Color coding by block type

#### 5.3.2 TimeBlockCardComponent
- **Cel**: Wizualizacja pojedynczego time block
- **Użycie**: WeeklyCalendarComponent
- **Propsy**: `timeBlock: TimeBlock`, `onClick?: () => void`
- **Features**:
  - Emoji + title + member name + time range
  - Color-coded background (based on blockType)
  - Hover tooltip (full details)
  - Shared block indicator (special border)
  - Conflict warning (red border)
  - ARIA label dla accessibility

#### 5.3.3 CalendarHeaderComponent
- **Cel**: Week navigation i akcje kalendarza
- **Użycie**: Weekly Schedule View
- **Propsy**: `currentWeek: Signal<Date>`, `onWeekChange: (date: Date) => void`
- **Features**:
  - Week range display (Jan 13-19, 2026)
  - Prev/Next buttons
  - Filters (member, block type)
  - [+ Add Block] button
  - [🪄 Regenerate] button
  - [Export] button (Phase 2)

### 5.4 Modal & Panel Components

#### 5.4.1 TimeBlockEditPanelComponent
- **Cel**: Side panel do edycji time block
- **Użycie**: Weekly Schedule View
- **Features**:
  - Slide-in from right
  - Contains TimeBlockFormComponent
  - Save/Delete/Cancel buttons
  - Focus trap (accessibility)
  - Escape key closes

#### 5.4.2 AddTimeBlockModalComponent
- **Cel**: Quick add modal dla nowego bloku
- **Użycie**: Weekly Schedule View (click empty slot)
- **Features**:
  - Centered modal
  - Pre-filled date/time z clicked slot
  - Contains TimeBlockFormComponent (create mode)
  - Save/Cancel buttons

#### 5.4.3 GenerationProgressModalComponent
- **Cel**: Pokazywanie postępu AI generation
- **Użycie**: Schedule Generator View
- **Features**:
  - Progress bar (0-100%)
  - Current step message (if streaming supported)
  - Elapsed time counter
  - [Cancel] button (AbortController)
  - Timeout warning po 12s
  - Cannot close by clicking outside

#### 5.4.4 GeneratedSchedulePreviewModalComponent
- **Cel**: Preview wygenerowanego schedule przed save
- **Użycie**: Schedule Generator View
- **Features**:
  - Summary stats (goals scheduled, conflicts, distribution)
  - Collapsed calendar preview (WeeklyCalendarComponent compact mode)
  - Feedback buttons (👍 👎)
  - Actions: [View Full Calendar] [Accept & Save] [Regenerate]

#### 5.4.5 DeleteAccountModalComponent
- **Cel**: Confirmation przed usunięciem konta
- **Użycie**: Profile View
- **Features**:
  - Typing verification (must type "DELETE")
  - List of co zostanie usunięte
  - Warning "cannot be undone"
  - [Cancel] [Delete] buttons (Delete disabled until typed correctly)

### 5.5 Feedback & Stats Components

#### 5.5.1 FeedbackButtonsComponent
- **Cel**: Thumbs up/down dla AI schedules
- **Użycie**: Schedule Generator Preview Modal, Dashboard (past schedules)
- **API**: POST /feedback
- **Propsy**: `scheduleId: string`, `onSubmit?: () => void`
- **Features**:
  - 👍 👎 buttons
  - Optional comment textarea
  - Submit → POST /feedback {scheduleId, rating: 1 | -1, comments}
  - Visual confirmation po submit

#### 5.5.2 UsageStatsCardComponent
- **Cel**: Summary statystyk użytkowania
- **Użycie**: Dashboard
- **API**: GET /weekly-usage-stats
- **Features**:
  - Metrics: weeks planned, acceptance rate, time saved
  - Mini chart (line chart, trend)
  - Link do full stats w Profile

#### 5.5.3 UsageStatsDetailComponent
- **Cel**: Detailed usage statistics z charts
- **Użycie**: Profile View
- **API**: GET /weekly-usage-stats, GET /usage-stats
- **Features**:
  - Multiple charts (line, bar, pie)
  - Date range filter
  - Exportable data (CSV/JSON)
  - Charts library: Chart.js lub Angular Charts

### 5.6 List & Card Components

#### 5.6.1 FamilyMemberListComponent
- **Cel**: Lista członków rodziny
- **Użycie**: Family Setup View, Onboarding Step 2
- **API**: GET /family-members
- **Features**:
  - Renders `FamilyMemberCardComponent` dla każdego
  - [+ Add Member] button
  - Loading skeletons
  - Empty state

#### 5.6.2 FamilyMemberCardComponent
- **Cel**: Pojedynczy członek rodziny
- **Propsy**: `member: FamilyMember`, `onEdit: () => void`, `onDelete: () => void`
- **Features**:
  - Name, role, age (if child), preferences
  - Goal count
  - [Edit] [×] buttons
  - Expandable (pokazuje assigned goals)

#### 5.6.3 RecurringGoalListComponent
- **Cel**: Lista recurring goals
- **Użycie**: Family Setup View, Onboarding Step 3
- **API**: GET /recurring-goals
- **Features**:
  - Grouped by family member
  - Filter by member dropdown
  - Sort by priority
  - Renders `RecurringGoalCardComponent`
  - [+ Add Goal] button

#### 5.6.4 RecurringGoalCardComponent
- **Cel**: Pojedynczy recurring goal
- **Propsy**: `goal: RecurringGoal`, `onEdit: () => void`, `onDelete: () => void`
- **Features**:
  - Emoji + name
  - Frequency, duration, time preference
  - Priority indicator (color-coded)
  - [Edit] [×] buttons

#### 5.6.5 HistoryListComponent
- **Cel**: Lista past schedules
- **Użycie**: History View
- **API**: GET /weekly-schedules?pagination
- **Features**:
  - Pagination (20 per page)
  - Renders `ScheduleHistoryCardComponent`
  - Filters (date range, AI-generated flag)
  - Loading skeletons

#### 5.6.6 ScheduleHistoryCardComponent
- **Cel**: Preview pojedynczego past schedule
- **Propsy**: `schedule: WeeklySchedule`, `onClick: () => void`
- **Features**:
  - Week range, AI-generated badge
  - Collapsed preview (mini calendar)
  - Acceptance indicator (thumbs up if accepted)
  - Click → navigate to full schedule view

### 5.7 UI Utilities & Shared Components

#### 5.7.1 LoadingSpinnerComponent
- **Cel**: Generic loading indicator
- **Użycie**: Wszędzie (buttons, full page, inline)
- **Propsy**: `size: 'sm' | 'md' | 'lg'`, `message?: string`

#### 5.7.2 SkeletonLoaderComponent
- **Cel**: Skeleton placeholders podczas ładowania
- **Użycie**: Lists, cards, calendar
- **Propsy**: `type: 'card' | 'list' | 'calendar' | 'text'`, `count?: number`

#### 5.7.3 ToastNotificationComponent
- **Cel**: Toast messages (success, error, warning, info)
- **Użycie**: Global (przez ToastService)
- **Features**:
  - Auto-dismiss (5s default)
  - Manual close button
  - Stacking (multiple toasts)
  - Position: top-right
  - Types: ✅ success, ⚠️ warning, ❌ error, ℹ️ info

#### 5.7.4 ErrorMessageComponent
- **Cel**: Wyświetlanie błędów (inline, field-level)
- **Użycie**: Formularze
- **Propsy**: `error: string | null`, `type?: 'inline' | 'field'`

#### 5.7.5 EmptyStateComponent
- **Cel**: Empty states z CTA
- **Użycie**: Lists, schedules, history
- **Propsy**: `icon: string`, `message: string`, `ctaText?: string`, `onCta?: () => void`
- **Example**: "📭 No schedules yet. Generate your first week!"

#### 5.7.6 ConflictWarningComponent
- **Cel**: Pokazywanie konfliktów time blocks
- **Użycie**: Weekly Schedule View, TimeBlockFormComponent
- **Propsy**: `conflicts: Conflict[]`, `onResolve?: () => void`
- **Features**:
  - ⚠️ icon + message
  - List konfliktujących bloków
  - Resolution suggestions: [Adjust Time] [Override]

#### 5.7.7 ButtonComponent
- **Cel**: Standardized button component
- **Propsy**: `variant: 'primary' | 'secondary' | 'danger'`, `size: 'sm' | 'md' | 'lg'`, `loading?: boolean`, `disabled?: boolean`
- **Features**:
  - Consistent styling
  - Loading state (spinner replacement)
  - Disabled state
  - Keyboard accessible

#### 5.7.8 ModalComponent
- **Cel**: Generic modal wrapper
- **Propsy**: `isOpen: Signal<boolean>`, `onClose: () => void`, `title?: string`, `size?: 'sm' | 'md' | 'lg'`
- **Features**:
  - Backdrop click closes (jeśli nie critical)
  - Escape key closes
  - Focus trap
  - ARIA attributes (role="dialog")
  - Scroll lock na body

### 5.8 Onboarding Components

#### 5.8.1 OnboardingStepperComponent
- **Cel**: Progress indicator dla wizard
- **Użycie**: Onboarding Wizard
- **Propsy**: `currentStep: number`, `totalSteps: number`, `stepLabels: string[]`
- **Features**:
  - Visual stepper (●━━━○━━━○━━━○)
  - Active step highlight
  - Completed steps checkmark

#### 5.8.2 OnboardingWelcomeComponent
- **Cel**: Step 1 - welcome screen
- **Features**:
  - App explanation
  - What user will do (bullets)
  - [Let's Get Started] CTA

#### 5.8.3 OnboardingReviewComponent
- **Cel**: Step 4 - summary przed first generation
- **Features**:
  - Family members count + names
  - Goals count
  - [Generate My First Week] [Skip to Dashboard]

### 5.9 Store Services (State Management)

#### 5.9.1 AuthStore
- **Odpowiedzialność**: User authentication state
- **Signals**:
  - `user: Signal<User | null>`
  - `token: Signal<string | null>`
  - `isAuthenticated: Signal<boolean>`
- **Methods**:
  - `register(credentials): Observable<{token, user}>`
  - `login(credentials): Observable<{token, user}>`
  - `logout(): Observable<void>`
  - `refreshToken(): Observable<string>`
- **API**: POST /auth/register, POST /auth/login, POST /auth/logout

#### 5.9.2 FamilyStore
- **Odpowiedzialność**: Family members state
- **Signals**:
  - `members: Signal<FamilyMember[]>`
  - `loading: Signal<boolean>`
  - `error: Signal<ApiError | null>`
- **Methods**:
  - `loadMembers(): Observable<FamilyMember[]>`
  - `addMember(data): Observable<FamilyMember>`
  - `updateMember(id, data): Observable<FamilyMember>`
  - `deleteMember(id): Observable<void>`
- **API**: GET /family-members, POST /family-members, PATCH /family-members/{id}, DELETE /family-members/{id}

#### 5.9.3 GoalsStore
- **Odpowiedzialność**: Recurring goals state
- **Signals**:
  - `goals: Signal<RecurringGoal[]>`
  - `loading: Signal<boolean>`
- **Methods**:
  - `loadGoals(memberId?): Observable<RecurringGoal[]>`
  - `addGoal(data): Observable<RecurringGoal>`
  - `updateGoal(id, data): Observable<RecurringGoal>`
  - `deleteGoal(id): Observable<void>`
- **API**: GET /recurring-goals, POST /recurring-goals, PATCH /recurring-goals/{id}, DELETE /recurring-goals/{id}

#### 5.9.4 ScheduleStore
- **Odpowiedzialność**: Weekly schedules & time blocks state
- **Signals**:
  - `currentWeek: Signal<WeeklySchedule | null>`
  - `schedules: Signal<WeeklySchedule[]>`
  - `timeBlocks: Signal<TimeBlock[]>`
  - `generating: Signal<boolean>`
- **Methods**:
  - `loadSchedule(weekStartDate): Observable<WeeklySchedule>`
  - `generateSchedule(params): Observable<{scheduleId, summary}>`
  - `regenerateSchedule(id): Observable<WeeklySchedule>`
  - `loadTimeBlocks(scheduleId): Observable<TimeBlock[]>`
  - `addTimeBlock(data): Observable<TimeBlock>`
  - `updateTimeBlock(id, data): Observable<TimeBlock>` (optimistic update)
  - `deleteTimeBlock(id): Observable<void>`
- **API**: Wszystkie /weekly-schedules i /time-blocks endpoints

#### 5.9.5 FeedbackStore
- **Odpowiedzialność**: Feedback submission
- **Methods**:
  - `submitFeedback(data): Observable<void>`
  - `loadFeedback(scheduleId): Observable<Feedback[]>`
- **API**: POST /feedback, GET /feedback

#### 5.9.6 UsageStatsStore
- **Odpowiedzialność**: Usage statistics
- **Signals**:
  - `stats: Signal<UsageStats[]>`
  - `weeklyStats: Signal<WeeklyUsageStats>`
- **Methods**:
  - `loadStats(from, to): Observable<UsageStats[]>`
  - `loadWeeklyStats(): Observable<WeeklyUsageStats>`
- **API**: GET /usage-stats, GET /weekly-usage-stats

### 5.10 Facade Services (Orchestration)

#### 5.10.1 ScheduleGeneratorFacade
- **Cel**: Orchestracja procesu generowania schedule
- **Methods**:
  - `initializeUserData(): Observable<{members, goals}>`
  - `generateWeekWithValidation(params): Observable<GeneratedSchedule>`
  - `handleConflicts(conflicts): Observable<Resolution>`
- **Wykorzystuje**: FamilyStore, GoalsStore, ScheduleStore

#### 5.10.2 OnboardingFacade
- **Cel**: Orchestracja onboarding flow
- **Methods**:
  - `completeOnboarding(data): Observable<{members, goals, schedule?}>`
  - `saveProgress(step, data): void` (localStorage)
  - `loadProgress(): OnboardingProgress | null`

### 5.11 HTTP Interceptors

#### 5.11.1 AuthInterceptor
- **Cel**: Dodawanie JWT token do requestów
- **Logika**:
  - Dodaje `Authorization: Bearer <token>` do wszystkich requestów (poza /auth/**)
  - Catches 401 → próbuje refresh token
  - Jeśli refresh fails → redirect do /login

#### 5.11.2 CacheInterceptor
- **Cel**: Cache'owanie GET requestów
- **Logika**:
  - Cache TTL: family-members (5min), recurring-goals (5min), weekly-schedules current (2min)
  - Invalidation na mutations (POST, PATCH, DELETE)
  - Respektuje SuggestionCache z API (expiresAt)

#### 5.11.3 ErrorInterceptor
- **Cel**: Globalna obsługa błędów
- **Logika**:
  - Transformuje API error model na user-friendly messages
  - Mapowanie status codes:
    - 400 → "Invalid data"
    - 401 → "Session expired"
    - 403 → "No permission"
    - 404 → "Not found"
    - 409 → "Conflict detected"
    - 429 → "Too many requests"
    - 500 → "Server error"
  - Loguje błędy do monitoring service
  - Pokazuje toast dla non-field errors

#### 5.11.4 LoadingInterceptor (optional)
- **Cel**: Global loading state
- **Logika**:
  - Increment counter na request start
  - Decrement na completion
  - Show global spinner gdy counter > 0

## 6. Przepływ danych i zarządzanie stanem

### 6.1 Architektura State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMPONENTS                               │
│  (Presentational & Smart Components)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ inject
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      FACADE SERVICES                             │
│  (Business Logic Orchestration)                                  │
│  - ScheduleGeneratorFacade                                       │
│  - OnboardingFacade                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │ uses
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      STORE SERVICES                              │
│  (State Management with Signals)                                 │
│  - AuthStore, FamilyStore, GoalsStore, ScheduleStore, etc.      │
└────────────────────────┬────────────────────────────────────────┘
                         │ calls
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      HTTP CLIENT                                 │
│  (with Interceptors)                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                         API                                      │
│  (NestJS Backend)                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Data Flow Pattern

**Read Flow (GET):**
```
Component → injects Store → calls loadData()
Store → HTTP GET → API
API response → Store updates Signal
Signal change → Component auto-updates (Angular Signals reactivity)
```

**Write Flow (POST/PATCH/DELETE) z Optimistic Updates:**
```
Component → calls Store.updateData(id, newData)
Store → 1. Update local Signal immediately (optimistic)
Store → 2. HTTP PATCH → API
API success → Signal already updated, no action needed
API error → Rollback Signal to previous state + show error toast
```

### 6.3 Cache Strategy

**Cache Levels:**
1. **HTTP Interceptor Cache**: GET requests z TTL (2-5min)
2. **Store-level Cache**: Signals persist w pamięci podczas session
3. **API SuggestionCache**: Respektowanie expiresAt z API response
4. **LocalStorage**: Tylko dla preferences, onboarding progress, theme

**Invalidation:**
- Mutations (POST, PATCH, DELETE) → invalidate related cache keys
- Manual refresh button → bypass cache
- Session logout → clear all cache

## 7. Accessibility & UX Considerations

### 7.1 WCAG AA Compliance

**Keyboard Navigation:**
- Tab order logiczny (top-to-bottom, left-to-right)
- Focus indicators (outline visible)
- Skip links ("Skip to main content")
- Keyboard shortcuts dla głównych akcji (Ctrl+N → New schedule, Escape → Close modal)

**Screen Readers:**
- Semantic HTML5 (nav, main, section, article, aside)
- ARIA labels dla interactive elements
- ARIA live regions dla dynamic content (toast notifications, loading states)
- Alt text dla images/icons (jeśli używane)

**Color & Contrast:**
- WCAG AA minimum (4.5:1 dla tekstu, 3:1 dla UI components)
- Nie poleganie tylko na kolorze (dodatkowe indicators: icons, text)
- Color-blind friendly palette

**Focus Management:**
- Focus trap w modalach
- Auto-focus na pierwszy input w formach
- Return focus po zamknięciu modala

### 7.2 Performance Optimization

**Bundle Size:**
- Lazy loading routes
- Code splitting per feature module
- Tree-shaking
- Minification & compression (gzip/brotli)

**Rendering:**
- OnPush change detection strategy
- Virtual scrolling dla długich list (history, time blocks)
- Memoization (Angular computed signals)
- Debounce input events (300ms dla search/filter)

**Network:**
- HTTP/2 multiplexing
- Request deduplication
- Pagination (default 20 items)
- Eager loading relationships w backend (schedules + time blocks)

**Images (jeśli używane):**
- Lazy loading (loading="lazy")
- Responsive images (srcset)
- WebP format z fallback

### 7.3 Error Prevention & Recovery

**Validation:**
- Real-time field validation (debounce 300ms)
- Disabled submit button until form valid
- Clear error messages pod fieldem

**Confirmations:**
- Confirmation modals dla destructive actions (delete account, delete schedule)
- "Are you sure?" dialogs
- Typing verification dla critical actions (DELETE account)

**Auto-save (Phase 2):**
- Draft saving dla form data (localStorage)
- Recovery po accidental page close

**Undo/Redo (Phase 2):**
- Undo ostatniej edycji time block
- Toast z undo button po delete action

### 7.4 Loading States

**Skeleton Loaders:**
- Zamiast spinnerów dla list/cards
- Maintain layout (no content jumping)
- Consistent z final content shape

**Progress Indicators:**
- Determinate dla known operations (file upload)
- Indeterminate dla unknown duration (AI generation initially)
- Progress bar dla multi-step processes

**Optimistic UI:**
- Immediate feedback na user actions
- Rollback + toast notification przy błędzie

### 7.5 Empty States

**Messaging:**
- Wyjaśnienie dlaczego puste ("No schedules yet")
- Helpful CTA ("Generate your first week")
- Friendly tone, encouraging

**Visuals:**
- Icon/illustration
- Centered layout
- Primary action button

### 7.6 Responsive Design Breakpoints

```
Desktop (>1280px) - Primary Target
├─ 7-column calendar grid
├─ Side-by-side layout (calendar + side panel)
├─ Full navigation visible
└─ Hover states, tooltips

Tablet (768-1279px)
├─ Stacked calendar (3-4 days visible, horizontal scroll)
├─ Collapsible navigation (hamburger menu)
├─ Modal-based editing instead of side panel
└─ Touch-optimized targets (min 44×44px)

Mobile (<768px)
├─ Single day view with date picker
├─ Bottom sheet for editing
├─ Hamburger menu navigation
├─ Swipe gestures (calendar days)
└─ Bottom navigation bar (alternative)
```

## 8. Security Considerations

### 8.1 Authentication & Authorization

**JWT Storage:**
- Primary: Memory (AuthStore Signal) - XSS safe
- Refresh token: httpOnly cookie (CSRF protection via SameSite)
- Never localStorage dla tokens (XSS vulnerability)

**Session Management:**
- Token expiry timer (warning modal przed expiry)
- Auto token refresh (silent, w tle)
- Logout clears wszystkie client state
- Multi-tab coordination (BroadcastChannel API)

**Route Guards:**
- AuthGuard → sprawdza isAuthenticated
- PublicOnlyGuard → redirect zalogowanych
- FirstTimeUserGuard → onboarding tylko dla nowych

### 8.2 Input Validation & Sanitization

**Client-side:**
- Reactive Forms validators (required, email, minLength, pattern)
- Custom validators (async email uniqueness, password match)
- Debounce async validators (500ms)

**Angular Security:**
- Built-in XSS protection (template sanitization)
- No innerHTML z user data
- DomSanitizer tylko gdy absolutnie konieczny (z caution)

**API Communication:**
- HTTPS only (enforced)
- CORS properly configured
- Rate limiting (API Gateway level)

### 8.3 Data Privacy (GDPR)

**User Rights:**
- Right to access: GET /user (profile view)
- Right to rectification: PATCH /user
- Right to erasure: DELETE /user (full cascade)
- Right to data portability: Download data button (export JSON)

**Consent:**
- Terms & Privacy Policy checkbox przy rejestracji
- Links do legal documents
- Cookie consent (jeśli używamy analytics)

**Data Minimization:**
- Collect only necessary data
- Optional fields clearly marked
- No tracking bez consent

### 8.4 Error Handling & Security

**Sensitive Errors:**
- Don't expose stack traces do użytkownika
- Generic error messages dla security-related issues
- Detailed errors tylko w dev mode

**Logging:**
- Client-side error logging (do monitoring service)
- No sensitive data w logach (PII, tokens)
- User actions tracking (audit trail)

## 9. Testing Strategy

### 9.1 Unit Tests (Jest)

**Coverage targets:**
- Components: 80%+
- Services/Stores: 90%+
- Utilities: 100%

**Focus areas:**
- Component logic (bez TestBed dla simplicity)
- Store methods (Signal updates)
- Form validators
- Utility functions (date parsing, validation)

**Example test patterns:**
```typescript
// Component test (no TestBed)
describe('TimeBlockCardComponent', () => {
  it('should display block details correctly', () => {
    const component = new TimeBlockCardComponent();
    component.timeBlock = mockTimeBlock;
    // Assert rendering logic
  });
});

// Store test
describe('ScheduleStore', () => {
  it('should update timeBlocks signal on successful PATCH', () => {
    // Mock HTTP response
    // Call updateTimeBlock()
    // Assert signal updated
  });
  
  it('should rollback on PATCH error', () => {
    // Mock HTTP error
    // Call updateTimeBlock()
    // Assert signal rolled back to original
  });
});
```

### 9.2 E2E Tests (Playwright)

**Critical paths:**
1. **User Registration & Onboarding**
   - Register → Complete onboarding → Generate first week
2. **Weekly Schedule Generation**
   - Login → Generate → Preview → Accept → View calendar
3. **Time Block Editing**
   - Navigate to schedule → Click block → Edit → Save
4. **Add Recurring Goal**
   - Navigate to Family → Add goal → Verify in list
5. **Delete Account**
   - Navigate to Profile → Delete account → Confirm → Logout

**Browser coverage:**
- Chromium (Desktop Chrome) - primary target
- Additional browsers (Phase 2): Firefox, Safari

**Test organization:**
- Page Object Model dla maintainability
- Fixtures dla test data setup
- Trace viewer dla debugging failures

## 10. Future Enhancements (Post-MVP)

### Phase 2 Features (UI impacts):

**Activity Finder Module:**
- New view: `/activities`
- Search form z filters (location, age, time, weather)
- Results list (3-5 suggestions)
- Add to schedule button

**Meal Planner Module:**
- New view: `/meals`
- Recipe search z filters (meal type, diet, ingredients, time)
- Recipe details view
- Add to schedule jako MEAL block

**Multi-user Collaboration:**
- Shared calendar view
- Real-time updates (WebSocket)
- User presence indicators
- Commenting/notifications

**Advanced Features:**
- Drag & drop calendar editing
- Recurring events (RRULE support)
- Template schedules
- Export to Google Calendar, iCal
- Shopping list generation (z meal plans)
- Mobile app (React Native)

**Analytics Enhancements:**
- Goal completion tracking
- Habit streaks
- Insights & recommendations
- Comparative analytics (week-over-week)

---

## Podsumowanie

Architektura UI Family Life Planner została zaprojektowana z myślą o:

✅ **Desktop-first approach** z responsywnością jako enhancement
✅ **AI-driven core feature** (schedule generation) jako centralny punkt UX
✅ **Modular structure** zgodna z NX monorepo (libs/frontend/*)
✅ **Security & Privacy** (JWT auth, route guards, GDPR compliance)
✅ **Accessibility** (WCAG AA, keyboard nav, screen readers)
✅ **Performance** (lazy loading, caching, optimistic updates)
✅ **Scalability** (clear separation: components → facades → stores → API)
✅ **User-centric design** (clear user journeys, error prevention, helpful empty states)

Kluczowe decyzje architektoniczne:
- **Angular Signals** dla state management (reactive, performant)
- **Facade Pattern** dla business logic orchestration
- **Side panel editing** zamiast modals dla lepszego UX w calendar view
- **Optimistic updates** z rollback dla instant feedback
- **3-level error handling** (inline, toast, modal)
- **Progressive enhancement** - łatwa rozbudowa o Phase 2 features

Architektura jest gotowa do implementacji zgodnie z PRD, API Plan i Session Notes, zapewniając solidną podstawę dla MVP i przyszłych rozszerzeń.

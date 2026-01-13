<pytania>
1. Hierarchia widoków głównych i nawigacja
Pytanie: Jaka powinna być główna struktura nawigacji aplikacji i hierarchia widoków, biorąc pod uwagę że MVP koncentruje się na Weekly Schedule Generator, a inne moduły (Activity Finder, Meal Planner) są w Phase 2?
Zalecenie: Zaimplementować uproszczoną nawigację z 4-5 głównymi widokami: Dashboard (przegląd tygodnia), Family Setup (członkowie rodziny + recurring goals), Schedule View (kalendarz z możliwością edycji), History (poprzednie tygodnie), Profile (ustawienia użytkownika). Pozostawić miejsce w architekturze na przyszłe moduły, ale nie implementować ich w UI MVP.
2. Przepływ onboardingu nowego użytkownika
Pytanie: Jak powinien wyglądać przepływ onboardingu po pierwszej rejestracji, aby poprowadzić użytkownika przez konfigurację profilu rodziny (family members + recurring goals) zanim będzie mógł wygenerować pierwszy tydzień?
Zalecenie: Zaimplementować wieloetapowy wizard onboardingu: (1) Powitanie i wyjaśnienie funkcji, (2) Dodanie członków rodziny (POST /family-members), (3) Konfiguracja recurring goals dla każdego członka (POST /recurring-goals), (4) Opcjonalnie dodanie fixed blocks, (5) Wygenerowanie pierwszego tygodnia (POST /schedule-generator). Użyć linear stepper z możliwością zapisania postępu i powrotu później.
3. Zarządzanie stanem aplikacji i synchronizacja z API
Pytanie: Jaką strategię zarządzania stanem wybrać dla Angular aplikacji, aby efektywnie obsługiwać synchronizację z wieloma endpointami API (family members, recurring goals, schedules, time blocks)?
Zalecenie: Wykorzystać Angular Signals (zgodnie z tech stack) z dedykowanymi Store services dla głównych domen: FamilyStore, GoalsStore, ScheduleStore. Zastosować facade pattern dla złożonych operacji. Zaimplementować optymistic updates dla lepszego UX przy edycji time blocks, z rollback przy błędach API. Używać RxJS do obsługi side effects i retry logic.
4. Obsługa generowania AI i long-running operations
Pytanie: Jak obsłużyć w UI potencjalnie długotrwały proces generowania tygodnia przez AI (max 15s według PRD), aby użytkownik miał feedback o postępie i mógł przerwać operację?
Zalecenie: Zaimplementować modal z progress indicator podczas wywołania POST /schedule-generator. Rozważyć streaming response lub polling mechanism jeśli backend wspiera partial results. Dodać możliwość anulowania żądania (AbortController). Po zakończeniu pokazać summary z możliwością preview przed zaakceptowaniem (wykorzystać endpoint /schedule-generator/preview jeśli dostępny).
5. Edycja harmonogramu - interakcja z kalendarzem
Pytanie: Jaki wzorzec interakcji wybrać dla edycji time blocks w widoku kalendarza tygodniowego, aby był intuicyjny i efektywny (drag & drop, modal forms, inline editing)?
Zalecenie: Zaimplementować hybrydowe podejście: (1) Click na istniejący block otwiera side panel z formularzem do edycji (PATCH /time-blocks/{blockId}), (2) Click na pusty slot otwiera quick-add dialog (POST /time-blocks), (3) Drag & drop dla przesuwania blocks z validation konfliktów (API zwraca overlap errors), (4) Visual indicators dla shared blocks i konfliktów. Używać reaktywnych formularzy Angular z debounce przy zapisie.
6. Obsługa błędów i konfliktów z API
Pytanie: Jak wyświetlać i obsługiwać błędy walidacji zwracane przez API, szczególnie konflikty time blocks (overlapping) i błędy AI generation?
Zalecenie: Zaimplementować 3-poziomowy system komunikatów: (1) Inline field errors dla walidacji formularzy (integration z Angular Forms), (2) Toast notifications dla operation feedback (success/error), (3) Error modal dla krytycznych błędów (AI timeout, network issues). Dla konfliktów time blocks pokazać visual highlight na kalendarzu z sugestiami rozwiązania. Przechowywać standardowy error model z API (status, message, timestamp) i mapować na user-friendly messages.
7. Strategie cache'owania i optymalizacji wydajności
Pytanie: Jak efektywnie cache'ować dane z API aby zminimalizować liczbę requestów, szczególnie dla często używanych zasobów (family members, recurring goals), jednocześnie zapewniając świeżość danych?
Zalecenie: Implementować wielopoziomowe cache'owanie: (1) HTTP Interceptor z cache dla GET requests z TTL 5 min dla family members/goals, (2) Store-level cache dla current week schedule z invalidation przy edycji, (3) Wykorzystać SuggestionCache z API dla activities/meals z respektowaniem expiresAt, (4) Service Worker dla offline-first approach (future enhancement). Dodać manual refresh button w UI dla force reload.
8. Responsywność i layout dla desktop-first approach
Pytanie: Jaki layout framework i breakpoint strategy zastosować, biorąc pod uwagę deklarowany focus na desktop w MVP, ale z potrzebą responsywności w przyszłości?
Zalecenie: Użyć CSS Grid dla głównego layoutu kalendarza (7 kolumn dla dni tygodnia) z fallback na stack layout dla tablet/mobile (display: block). Zdefiniować 3 breakpoints: desktop (>1280px - primary target), tablet (768-1279px - stacked calendar), mobile (< 768px - single day view). Wykorzystać SCSS mixins dla consistency. Wszystkie komponenty tworzyć mobile-first w SCSS, ale optymalizować UX dla desktop.
9. Bezpieczeństwo i autoryzacja w warstwie UI
Pytanie: Jak obsłużyć session management, token refresh i zabezpieczenie wrażliwych operacji w UI, integrując się z Supabase JWT authentication?
Zalecenie: Zaimplementować: (1) HTTP Interceptor dodający Authorization: Bearer header do wszystkich requestów (poza /auth/**), (2) Automatic token refresh przy 401 responses, (3) Route guards dla protected routes z redirect do login, (4) Timeout warning przed session expiry z możliwością extend, (5) Secure storage dla tokens (nie localStorage dla production, rozważyć httpOnly cookies), (6) Clear all state przy logout (POST /auth/logout).
10. Feedback mechanism i usage tracking
Pytanie: Jak zintegrować w UI mechanizm zbierania feedbacku (thumbs up/down) dla AI-generated schedules oraz jak wizualizować usage statistics, aby realizować metryki sukcesu z PRD?
Zalecenie: Dodać thumbs up/down buttons przy każdym AI-generated schedule z możliwością dodania comments (POST /feedback). Pokazać subtle indicator ile schedules zostało zaakceptowanych. W Profile/Dashboard dodać sekcję "Your Progress" wyświetlającą tygodniowe statystyki z GET /weekly-usage-stats: liczba wygenerowanych planów, acceptance rate, time saved estimate. Użyć prostych charts (Angular Charts library lub Chart.js) dla wizualizacji trendów.
</pytania>
{{latest-round-answers}} <- lista odpowiedzi na drugą runde pytań



---



Jesteś asystentem AI, którego zadaniem jest podsumowanie rozmowy na temat planowania architektury UI dla MVP i przygotowanie zwięzłego podsumowania dla następnego etapu rozwoju. W historii konwersacji znajdziesz następujące informacje:

1. Dokument wymagań produktu (PRD)

2. Informacje o stacku technologicznym

3. Plan API

4. Historia rozmów zawierająca pytania i odpowiedzi

5. Zalecenia dotyczące architektury UI



Twoim zadaniem jest:

1. Podsumować historię konwersacji, koncentrując się na wszystkich decyzjach związanych z planowaniem architektury UI.

2. Dopasować zalecenia modelu do odpowiedzi udzielonych w historii konwersacji. Zidentyfikować, które zalecenia są istotne w oparciu o dyskusję.

3. Przygotować szczegółowe podsumowanie rozmowy, które obejmuje:

   a. Główne wymagania dotyczące architektury UI

   b. Kluczowe widoki, ekrany i przepływy użytkownika

   c. Strategię integracji z API i zarządzania stanem

   d. Kwestie dotyczące responsywności, dostępności i bezpieczeństwa

   e. Wszelkie nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia

4. Sformatować wyniki w następujący sposób:



<conversation_summary>

<decisions>

[Wymień decyzje podjęte przez użytkownika, ponumerowane].

</decisions>

<matched_recommendations>

[Lista najistotniejszych zaleceń dopasowanych do rozmowy, ponumerowanych]

</matched_recommendations>

<ui_architecture_planning_summary>

[Podaj szczegółowe podsumowanie rozmowy, w tym elementy wymienione w kroku 3].

</ui_architecture_planning_summary>

<unresolved_issues>

[Wymień wszelkie nierozwiązane kwestie lub obszary wymagające dalszych wyjaśnień, jeśli takie istnieją]

</unresolved_issues>

</conversation_summary>



Końcowy wynik powinien zawierać tylko treść w formacie markdown. Upewnij się, że Twoje podsumowanie jest jasne, zwięzłe i zapewnia cenne informacje dla następnego etapu planowania architektury UI i integracji z API.

Zauważam, że w Twoim zapytaniu znajduje się placeholder {{latest-round-answers}}, ale nie otrzymałem faktycznych odpowiedzi na zadane wcześniej pytania.
Przygotowałem jednak podsumowanie bazujące na dostępnej dokumentacji (PRD, tech stack, API plan) oraz wygenerowanych przeze mnie zaleceniach, które mogą służyć jako punkt wyjścia do dalszej dyskusji i podejmowania decyzji.
<conversation_summary>
Decisions
[Uwaga: Brak formalnych decyzji użytkownika - poniższe punkty to kluczowe ustalenia wynikające z analizy dokumentacji PRD, tech stack i API plan]
Scope MVP: Focus na Weekly Schedule Generator (Phase 1), Activity Finder i Meal Planner odkładane do Phase 2
Tech Stack Frontend: Angular 20+, standalone components, Signals dla state management, reactive forms
Backend Integration: NestJS REST API z Supabase JWT authentication
Deployment Target: Desktop-first approach, responsywność jako secondary concern
AI Integration: GPT-4o Turbo z max 15s response time
Storage Strategy: Rozpoczęcie od localStorage, migracja do Postgres
Authentication: Email/password w MVP, Cognito w przyszłości
Core Functionality: Generowanie tygodniowego harmonogramu uwzględniającego fixed blocks, recurring goals, family members
Matched Recommendations
Uproszczona nawigacja MVP - 4-5 głównych widoków: Dashboard, Family Setup, Schedule View, History, Profile z możliwością rozbudowy w Phase 2
Multi-step onboarding wizard - Prowadzenie użytkownika przez konfigurację rodziny i recurring goals przed pierwszym wygenerowaniem tygodnia
Angular Signals + Facade Pattern - Dedykowane Store services (FamilyStore, GoalsStore, ScheduleStore) z optymistic updates i rollback mechanism
Progress feedback dla AI operations - Modal z progress indicator, możliwość anulowania, preview przed zaakceptowaniem schedule
Hybrydowa edycja time blocks - Side panel dla edycji, quick-add dialog, drag & drop z konfliktów validation
3-poziomowy system error handling - Inline field errors, toast notifications, error modals z user-friendly messages
Multi-level caching strategy - HTTP interceptor cache, store-level cache, respektowanie SuggestionCache z API
CSS Grid layout z 3 breakpoints - Desktop (>1280px), tablet (768-1279px), mobile (<768px) z progressive enhancement
Comprehensive security layer - HTTP interceptors, token refresh, route guards, session timeout warnings
Integrated feedback mechanism - Thumbs up/down dla schedules, wizualizacja usage statistics w dashboard
UI Architecture Planning Summary
1. Główne Wymagania Architektury UI
Funkcjonalne:
Generowanie tygodniowego harmonogramu z wykorzystaniem AI (GPT-4o Turbo)
Zarządzanie członkami rodziny i ich recurring goals
Edycja time blocks z wykrywaniem konfliktów
System feedbacku dla AI-generated schedules
Wizualizacja usage statistics
Niefunkcjonalne:
Desktop-first design z podstawową responsywnością
Czas odpowiedzi AI ≤15 sekund z visual feedback
Bezpieczne uwierzytelnienie (Supabase JWT)
Zgodność z RODO (prawo dostępu/usunięcia danych)
Optymalizacja wydajności przez cache'owanie
2. Kluczowe Widoki i Przepływy Użytkownika
A. Onboarding Flow (nowy użytkownik):
Registration (POST /auth/register)  ↓Welcome & App Overview  ↓Add Family Members (POST /family-members) [Multi-step]  ↓Configure Recurring Goals (POST /recurring-goals) [Per member]  ↓Optional: Add Fixed Blocks (POST /time-blocks)  ↓Generate First Week (POST /schedule-generator)  ↓Dashboard
B. Core Views:
Login/Registration View
Forms dla POST /auth/register, POST /auth/login
Email + password validation
Error handling dla 400 (email exists), 401 (invalid credentials)
Dashboard (Home)
Current week overview (GET /weekly-schedules?weekStartDate=...)
Quick actions: Generate New Week, Edit Current Week
Usage stats summary (GET /weekly-usage-stats)
Navigation hub
Family Setup View
List członków rodziny (GET /family-members)
CRUD operations (POST, PATCH, DELETE /family-members/{memberId})
Validation: role (USER|SPOUSE|CHILD), age requirement for children
Nested section: Recurring goals per member
List goals (GET /recurring-goals?memberId=...)
CRUD operations (POST, PATCH, DELETE /recurring-goals/{goalId})
Fields: name, frequencyPerWeek, preferredDurationMinutes, priority, rules
Schedule Generator View
Week selector (calendar picker)
Strategy selector (balanced, etc.)
Generate button → POST /schedule-generator lub /schedule-generator/preview
Progress modal (15s max) z możliwością cancel
Preview mode z summary
Accept/Reject actions
Feedback mechanism (thumbs up/down → POST /feedback)
Weekly Schedule View (Calendar)
7-day grid layout (Mon-Sun)
Time blocks display (GET /weekly-schedules/{scheduleId} z embedded time-blocks)
Visual indicators:
Block types: WORK, ACTIVITY, MEAL, OTHER (color coding)
Shared blocks vs personal
Conflicts/overlaps (highlight)
Interactions:
Click block → side panel edit (PATCH /time-blocks/{blockId})
Click empty slot → quick-add dialog (POST /time-blocks)
Drag & drop (future enhancement)
Filters: family member, block type
Regenerate option (POST /schedule-generator/{scheduleId}/regenerate)
History View
List past weeks (GET /weekly-schedules?pagination)
Filters: date range, AI-generated flag
View/Compare previous schedules
Analytics: acceptance rate, patterns
Profile/Settings View
User info (GET /user)
Update profile (PATCH /user)
Delete account (DELETE /user) - GDPR compliance
Logout (POST /auth/logout)
Usage statistics detailed view
3. Strategia Integracji z API i Zarządzania Stanem
A. State Management Architecture:
// Store Services (Angular Signals-based)FamilyStore {  - members: Signal<FamilyMember[]>  - loading: Signal<boolean>  - error: Signal<ApiError | null>    - loadMembers() // GET /family-members  - addMember(data) // POST /family-members  - updateMember(id, data) // PATCH /family-members/{id}  - deleteMember(id) // DELETE /family-members/{id}}GoalsStore {  - goals: Signal<RecurringGoal[]>  - loading: Signal<boolean>    - loadGoals(memberId?) // GET /recurring-goals  - addGoal(data) // POST /recurring-goals  - updateGoal(id, data) // PATCH /recurring-goals/{id}  - deleteGoal(id) // DELETE /recurring-goals/{id}}ScheduleStore {  - currentWeek: Signal<WeeklySchedule | null>  - schedules: Signal<WeeklySchedule[]>  - timeBlocks: Signal<TimeBlock[]>  - generating: Signal<boolean>    - loadSchedule(weekStartDate) // GET /weekly-schedules  - generateSchedule(params) // POST /schedule-generator  - regenerateSchedule(id) // POST /schedule-generator/{id}/regenerate  - updateSchedule(id, data) // PATCH /weekly-schedules/{id}    - loadTimeBlocks(scheduleId) // GET /time-blocks  - addTimeBlock(data) // POST /time-blocks  - updateTimeBlock(id, data) // PATCH /time-blocks/{id}  - deleteTimeBlock(id) // DELETE /time-blocks/{id}}AuthStore {  - user: Signal<User | null>  - token: Signal<string | null>  - isAuthenticated: Signal<boolean>    - register(credentials) // POST /auth/register  - login(credentials) // POST /auth/login  - logout() // POST /auth/logout  - refreshToken()}FeedbackStore {  - submitFeedback(data) // POST /feedback  - loadFeedback(scheduleId) // GET /feedback?scheduleId=...}UsageStatsStore {  - stats: Signal<UsageStats[]>  - loadStats(from, to) // GET /usage-stats  - loadWeeklyStats() // GET /weekly-usage-stats}
B. Facade Services (Orchestration):
ScheduleGeneratorFacade {  // Combines multiple store operations  - initializeUserData() // Load family + goals  - generateWeekWithValidation()  - handleConflicts()}
C. HTTP Layer:
// InterceptorsAuthInterceptor {  - Add Bearer token to all requests except /auth/**  - Handle 401 → token refresh or redirect to login}CacheInterceptor {  - Cache GET requests with TTL:    * /family-members: 5 min    * /recurring-goals: 5 min    * /weekly-schedules (current): 2 min  - Invalidate on mutations (POST, PATCH, DELETE)}ErrorInterceptor {  - Transform API error model to user-friendly messages  - Log errors to monitoring service}LoadingInterceptor {  - Global loading state (optional)}
D. Optimistic Updates:
// Example dla time block updateupdateTimeBlock(id, data) {  // 1. Update local state immediately  this.timeBlocks.update(blocks =>     blocks.map(b => b.id === id ? {...b, ...data} : b)  );    // 2. Call API  return this.http.patch(`/time-blocks/${id}`, data).pipe(    catchError(error => {      // 3. Rollback on error      this.timeBlocks.update(blocks =>         blocks.map(b => b.id === id ? originalBlock : b)      );      return throwError(error);    })  );}
4. Responsywność, Dostępność i Bezpieczeństwo
A. Responsywność:
Desktop (>1280px) - Primary target
7-column calendar grid
Side-by-side layout (calendar + side panel)
Full navigation visible
Tablet (768-1279px)
Stacked calendar (2-3 days visible, horizontal scroll)
Collapsible navigation
Modal-based editing instead of side panel
Mobile (<768px)
Single day view with date picker
Bottom sheet for editing
Hamburger menu navigation
B. Dostępność (A11y):
Semantic HTML5 (nav, main, section, article)
ARIA labels dla interactive elements
Keyboard navigation (Tab, Enter, Escape)
Focus management (trap focus in modals)
Color contrast WCAG AA minimum
Screen reader announcements (aria-live) dla dynamic content
Skip links dla navigation
C. Bezpieczeństwo:
Authentication Flow:
Login → Store JWT in memory (Signal)     → Optional: httpOnly cookie dla refresh token     → Set expiry timer → Warning before timeout
Route Protection:
AuthGuard {  canActivate() {    if (!authStore.isAuthenticated()) {      router.navigate(['/login']);      return false;    }    return true;  }}
Sensitive Operations Confirmation:
Delete account → confirmation modal + password re-entry
Delete schedule → confirmation
Regenerate (override) → warning about losing changes
XSS Prevention:
Angular's built-in sanitization
No innerHTML with user data
Validate all inputs
CSRF Protection:
Rely on JWT (stateless)
SameSite cookies if using cookie storage
5. Error Handling Strategy
Levels:
Field-level (Form Validation)
Real-time validation z debounce (300ms)
Display errors under fields
Disable submit until valid
Operation-level (Toast Notifications)
Success: "Schedule generated successfully"
Info: "Generating schedule..."
Warning: "Some conflicts detected"
Error: "Failed to save changes"
Auto-dismiss (5s) with manual close option
Critical Errors (Modal)
AI timeout (>15s)
Network failures
Authentication errors
Actionable buttons (Retry, Cancel, Go to Login)
API Error Mapping:
errorMessageMap = {  400: 'Invalid data. Please check your input.',  401: 'Session expired. Please log in again.',  403: 'You don\'t have permission for this action.',  404: 'Resource not found.',  409: 'Conflict detected. Please refresh and try again.',  429: 'Too many requests. Please wait a moment.',  500: 'Server error. Please try again later.',  503: 'Service temporarily unavailable.'};
6. Performance Optimization
A. Caching Strategy:
HTTP cache (Interceptor) - 2-5 min TTL
Component-level memoization (computed Signals)
Virtual scrolling dla długich list (history, time blocks)
Lazy loading routes
OnPush change detection strategy
B. Bundle Optimization:
Code splitting per route
Lazy load heavy libraries (charts, date pickers)
Tree-shaking
Image optimization (if używane)
C. API Request Optimization:
Debounce search/filter inputs (300ms)
Request deduplication
Pagination dla list views (default 20 items)
Eager loading relationships (schedules + time blocks) w backend
7. User Feedback & Analytics Integration
Feedback Collection:
// Po wygenerowaniu schedule<schedule-feedback>  <button (click)="submitFeedback(1)">👍</button>  <button (click)="submitFeedback(-1)">👎</button>  <textarea [(ngModel)]="comments" placeholder="Optional comments"></textarea></schedule-feedback>// POST /feedback{  scheduleId: 'uuid',  blockId: null, // optional  rating: 1 | -1,  comments: 'Great suggestions!'}
Usage Stats Display:
// Dashboard widget<usage-stats-summary>  Weeks generated: {{ stats.totalGenerated }}  Acceptance rate: {{ stats.acceptanceRate }}%  Time saved: ~{{ stats.timeSavedMinutes }} min/week</usage-stats-summary>
8. Component Architecture (Przykłady)
Smart Components (Containers):
ScheduleGeneratorContainer - orchestrates generation flow
WeeklyCalendarContainer - manages calendar state
FamilySetupContainer - handles family & goals CRUD
Presentational Components:
CalendarGrid - pure visualization
TimeBlockCard - displays single block
FeedbackButtons - thumbs up/down
LoadingSpinner, ErrorMessage, SuccessToast
Shared UI Components:
FormField (input, select, textarea)
Modal, SidePanel, Dropdown
Button, IconButton
DatePicker, TimePicker, DurationInput
Unresolved Issues
AI Generation Feedback Loop
Jak AI powinno wykorzystywać feedback użytkownika (thumbs up/down) do poprawy przyszłych sugestii?
Czy implementować learning mechanism już w MVP czy w Phase 2?
Conflict Resolution Strategy
Jakie dokładnie algorytmy rozwiązywania konfliktów timeBlocks?
Czy automatyczne przesuwanie, czy tylko warning + manual resolution?
Offline Capabilities
Czy implementować Service Worker już w MVP?
Jaki zakres funkcjonalności offline (read-only? queue mutations?)?
Multi-user Scenarios (Przyszłość)
Jak przygotować architekturę na future family sharing?
Real-time updates (WebSocket vs polling)?
Data Migration Plan
Szczegóły migracji localStorage → Postgres
Czy użytkownik musi ręcznie eksportować/importować dane?
AI Fallback Strategy
Co jeśli GPT-4o Turbo jest niedostępny?
Czy mieć backup model (GPT-3.5) czy tylko error message?
Accessibility Testing
Jaki poziom WCAG compliance jest wymagany (AA vs AAA)?
Czy planowane testy z screen readers?
Internationalization
Czy aplikacja ma być wielojęzyczna już w MVP?
PRD jest po polsku - czy UI również, czy angielski?
Token Storage Security
localStorage (obecny plan) vs httpOnly cookies vs memory-only
Trade-off: convenience vs security
Testing Strategy
Jaki poziom test coverage dla MVP?
E2E tests dla critical paths (onboarding, schedule generation)?
Czy mockować API w testach czy używać test environment?
</conversation_summary>
Następne kroki:
Jeśli chcesz kontynuować dyskusję i podjąć konkretne decyzje dotyczące wymienionych nierozwiązanych kwestii lub omówić szczegóły implementacji poszczególnych komponentów, jestem gotów pomóc. Możemy również przejść do:
Tworzenia szczegółowych wireframes/mockups dla kluczowych widoków
Definiowania szczegółowej struktury komponentów Angular
Projektowania modeli danych TypeScript
Planowania testów jednostkowych i E2E
Tworzenia user journey maps dla głównych przepływów
Daj znać, w którym kierunku chciałbyś się skupić! 🎯
stwórzymy pkt 1 - szczegółowe mockupy kluczowych widoków

Szczegółowe Mockupy Kluczowych Widoków - Family Life Planner MVP
Przygotowałem kompletne mockupy w formie tekstowej z szczegółowymi opisami komponentów, interakcji i stanów. Każdy widok zawiera layouty dla desktop i informacje o adaptacji na mniejsze ekrany.
1. Login & Registration View
1.1 Login Screen
┌─────────────────────────────────────────────────────────────────────┐│                                                                         ││                         Family Life Planner                             ││                    Plan your week with AI assistance                    ││                                                                         ││                    ┌─────────────────────────────┐                     ││                    │                             │                     ││                    │  📧 Email                   │                     ││                    │  ┌─────────────────────┐   │                     ││                    │  │ your@email.com      │   │                     ││                    │  └─────────────────────┘   │                     ││                    │                             │                     ││                    │  🔒 Password                │                     ││                    │  ┌─────────────────────┐   │                     ││                    │  │ ••••••••••••        │   │                     ││                    │  └─────────────────────┘   │                     ││                    │                             │                     ││                    │  ☐ Remember me              │                     ││                    │                             │                     ││                    │  ┌─────────────────────┐   │                     ││                    │  │   Log In            │   │                     ││                    │  └─────────────────────┘   │                     ││                    │                             │                     ││                    │  Don't have an account?     │                     ││                    │  [Sign up]                  │                     ││                    │                             │                     ││                    └─────────────────────────────┘                     ││                                                                         │└─────────────────────────────────────────────────────────────────────┘
Komponenty:
LoginFormComponent
Email input (reactive form control, email validator)
Password input (type="password", min length 8)
Remember me checkbox
Submit button → POST /auth/login
Link do registration
Stany:
Default: Puste formularze
Loading: Button disabled, spinner, "Logging in..."
Error: Toast notification z komunikatem błędu (401: "Invalid credentials")
Success: Redirect do Dashboard lub Onboarding (jeśli pierwszy raz)
Walidacja:
Real-time: email format, password min length
Submit: wszystkie pola required
Error messages pod polami
1.2 Registration Screen
┌─────────────────────────────────────────────────────────────────────┐│                                                                         ││                         Create Your Account                             ││                                                                         ││        ┌───────────────────────────────────────────────────┐           ││        │                                                   │           ││        │  Display Name (optional)                         │           ││        │  ┌─────────────────────────────────────────┐     │           ││        │  │ John                                    │     │           ││        │  └─────────────────────────────────────────┘     │           ││        │                                                   │           ││        │  Email *                                          │           ││        │  ┌─────────────────────────────────────────┐     │           ││        │  │ your@email.com                          │     │           ││        │  └─────────────────────────────────────────┘     │           ││        │                                                   │           ││        │  Password *                                       │           ││        │  ┌─────────────────────────────────────────┐     │           ││        │  │ ••••••••••••                            │     │           ││        │  └─────────────────────────────────────────┘     │           ││        │  Must be at least 8 characters                    │           ││        │                                                   │           ││        │  Confirm Password *                               │           ││        │  ┌─────────────────────────────────────────┐     │           ││        │  │ ••••••••••••                            │     │           ││        │  └─────────────────────────────────────────┘     │           ││        │                                                   │           ││        │  ☑ I agree to Terms of Service and Privacy       │           ││        │      Policy (GDPR compliance)                     │           ││        │                                                   │           ││        │  ┌─────────────────────────────────────────┐     │           ││        │  │          Create Account                 │     │           ││        │  └─────────────────────────────────────────┘     │           ││        │                                                   │           ││        │  Already have an account? [Log in]               │           ││        │                                                   │           ││        └───────────────────────────────────────────────────┘           ││                                                                         │└─────────────────────────────────────────────────────────────────────┘
Komponenty:
RegistrationFormComponent
Display name (optional)
Email (unique validation)
Password + Confirm password (match validator)
Terms checkbox (required)
Submit → POST /auth/register
Walidacja:
Email: format + async uniqueness check
Password: min 8 chars, strength indicator (optional)
Confirm password: must match
Terms: must be checked
Success Flow:
Account created → Auto login → Redirect to Onboarding Wizard
2. Onboarding Wizard
Multi-step wizard dla nowych użytkowników. Progress indicator na górze.
2.1 Step 1: Welcome
┌─────────────────────────────────────────────────────────────────────┐│  ●━━━○━━━○━━━○                                         [Skip] [×]    ││  Welcome  Family  Goals  Review                                      │├─────────────────────────────────────────────────────────────────────┤│                                                                       ││                    👋 Welcome to Family Life Planner!                ││                                                                       ││              We'll help you set up your family profile               ││                    and start planning your week.                     ││                                                                       ││                         This will take ~5 minutes                    ││                                                                       ││                    What you'll do:                                   ││                    ✓ Add family members                              ││                    ✓ Set recurring goals                             ││                    ✓ Generate your first week                        ││                                                                       ││                                                                       ││                    ┌─────────────────────┐                           ││                    │   Let's Get Started │                           ││                    └─────────────────────┘                           ││                                                                       ││                                                                       │└─────────────────────────────────────────────────────────────────────┘
Komponenty:
OnboardingWelcomeComponent
Progress stepper (4 steps)
Skip option (goes to empty Dashboard)
CTA button → Next step
2.2 Step 2: Add Family Members
┌─────────────────────────────────────────────────────────────────────┐│  ○━━━●━━━○━━━○                                    [Back] [Skip] [×]  ││  Welcome  Family  Goals  Review                                      │├─────────────────────────────────────────────────────────────────────┤│                                                                       ││                      Add Your Family Members                         ││                                                                       ││  ┌─────────────────────────────────────────────────────────────┐    ││  │  You (Owner)                                                │    ││  │  John Doe                                            [Edit] │    ││  └─────────────────────────────────────────────────────────────┘    ││                                                                       ││  ┌─────────────────────────────────────────────────────────────┐    ││  │  👤 Name:    ┌──────────────────┐   Role: [Spouse ▾]       │    ││  │              │ Jane Doe         │                           │    ││  │              └──────────────────┘                           │    ││  │                                                             │    ││  │  Preferences (optional):                                    │    ││  │  ┌─────────────────────────────────────────────────────┐   │    ││  │  │ Prefers morning activities, vegetarian meals        │   │    ││  │  └─────────────────────────────────────────────────────┘   │    ││  │                                                             │    ││  │                           [+ Add This Member]               │    ││  └─────────────────────────────────────────────────────────────┘    ││                                                                       ││  Added Members:                                                      ││  ┌──────────────────────────────────────────────────────────┐       ││  │  Jane Doe (Spouse)                            [Edit] [×] │       ││  │  Emma (Child, 5y)                             [Edit] [×] │       ││  │  Luke (Child, 3y)                             [Edit] [×] │       ││  └──────────────────────────────────────────────────────────┘       ││                                                                       ││                 [+ Add Another Member]    [Continue →]               ││                                                                       │└─────────────────────────────────────────────────────────────────────┘
Komponenty:
FamilyMemberFormComponent
Name input
Role dropdown (USER/SPOUSE/CHILD)
Age input (conditional: pokazuje się gdy role=CHILD)
Preferences textarea (optional)
Add button → POST /family-members
FamilyMemberListComponent
Cards z dodanymi członkami
Edit/Delete actions
Auto-created owner (current user)
Walidacja:
Name required
Age required and >0 when role=CHILD
Min 1 member (owner) to continue
API Calls:
POST /family-members przy dodaniu
PATCH /family-members/{id} przy edycji
DELETE /family-members/{id} przy usunięciu
2.3 Step 3: Configure Recurring Goals
┌─────────────────────────────────────────────────────────────────────┐│  ○━━━○━━━●━━━○                                    [Back] [Skip] [×]  ││  Welcome  Family  Goals  Review                                      │├─────────────────────────────────────────────────────────────────────┤│                                                                       ││                    Set Up Recurring Goals                            ││              (These will be automatically scheduled weekly)          ││                                                                       ││  For: [John Doe (You) ▾]                                            ││                                                                       ││  ┌────────────────────────────────────────────────────────────┐     ││  │  Goal Name: ┌────────────────────────┐                     │     ││  │             │ Morning Workout         │                     │     ││  │             └────────────────────────┘                     │     ││  │                                                             │     ││  │  Description (optional):                                    │     ││  │  ┌──────────────────────────────────────────────────┐      │     ││  │  │ 30 min cardio or strength training              │      │     ││  │  └──────────────────────────────────────────────────┘      │     ││  │                                                             │     ││  │  Frequency: [3 ▾] times per week                           │     ││  │                                                             │     ││  │  Duration: [30 ▾] minutes each                             │     ││  │                                                             │     ││  │  Preferred Time: [Morning 6-10am ▾]                        │     ││  │                                                             │     ││  │  Priority: ○ Low  ●High  ○ Medium                         │     ││  │                                                             │     ││  │                              [+ Add This Goal]              │     ││  └────────────────────────────────────────────────────────────┘     ││                                                                       ││  Goals for John Doe:                                                 ││  ┌───────────────────────────────────────────────────────┐          ││  │  💪 Morning Workout │ 3x/week │ 30min │ 🌅 Morning    [×] │      ││  │  📚 Reading         │ 5x/week │ 20min │ 🌙 Evening    [×] │      ││  │  👥 Date Night      │ 1x/week │ 2hrs  │ 🌙 Evening    [×] │      ││  └───────────────────────────────────────────────────────┘          ││                                                                       ││           [+ Add Another Goal]        [Continue →]                   ││                                                                       │└─────────────────────────────────────────────────────────────────────┘
Komponenty:
RecurringGoalFormComponent
Family member selector
Goal name (required)
Description (optional)
Frequency selector (1-7 times/week)
Duration selector (15, 30, 45, 60, 90, 120 minutes)
Preferred time dropdown (Morning, Afternoon, Evening, Flexible)
Priority radio buttons (Low/Medium/High)
Add button → POST /recurring-goals
GoalListComponent
Compact cards per member
Group by family member
Delete action
Walidacja:
Goal name required
Frequency > 0
Duration > 0
Family member must be selected
API Calls:
POST /recurring-goals
DELETE /recurring-goals/{id}
2.4 Step 4: Review & Generate
┌─────────────────────────────────────────────────────────────────────┐│  ○━━━○━━━○━━━●                                    [Back]        [×]  ││  Welcome  Family  Goals  Review                                      │├─────────────────────────────────────────────────────────────────────┤│                                                                       ││                    🎉 You're All Set!                                ││                                                                       ││  Your Family:                                                        ││  ┌──────────────────────────────────────────────────────┐           ││  │  👤 John Doe (You)     👥 Jane Doe (Spouse)          │           ││  │  👧 Emma (5y)          👦 Luke (3y)                   │           ││  └──────────────────────────────────────────────────────┘           ││                                                                       ││  Total Goals Configured: 12                                          ││  ┌──────────────────────────────────────────────────────┐           ││  │  John: 4 goals  │  Jane: 5 goals  │  Kids: 3 shared  │           ││  └──────────────────────────────────────────────────────┘           ││                                                                       ││                                                                       ││           Ready to generate your first weekly schedule?              ││                                                                       ││                  ┌─────────────────────────────┐                     ││                  │  🪄 Generate My First Week  │                     ││                  └─────────────────────────────┘                     ││                                                                       ││                  Or [Skip to Dashboard]                              ││                                                                       ││                                                                       │└─────────────────────────────────────────────────────────────────────┘
Komponenty:
OnboardingReviewComponent
Summary cards (read-only)
CTA button → Generate first week
Skip option → Empty dashboard
Action:
Generate button → POST /schedule-generator → Show loading modal → Redirect to Schedule View
3. Dashboard (Home)
┌─────────────────────────────────────────────────────────────────────┐│  Family Life Planner          [Dashboard] [Schedule] [Family] [Profile] │├─────────────────────────────────────────────────────────────────────┤│                                                                       ││  👋 Welcome back, John!                              Week Jan 13-19  ││                                                                       ││  ┌────────────────────────────────────────────────────────────────┐ ││  │  This Week's Schedule                            [View Full] [✏️] │ ││  │  ┌──────────┬──────────┬──────────┬──────────┬──────────────┐  │ ││  │  │ Mon 13   │ Tue 14   │ Wed 15   │ Thu 16   │ Fri 17   ... │  │ ││  │  ├──────────┼──────────┼──────────┼──────────┼──────────────┤  │ ││  │  │ 🏢 Work  │ 🏢 Work  │ 🏢 Work  │ 🏢 Work  │ 🏢 Work      │  │ ││  │  │ 9-5pm    │ 9-5pm    │ 9-5pm    │ 9-5pm    │ 9-5pm        │  │ ││  │  │          │          │          │          │              │  │ ││  │  │ 💪 Gym   │ 👨‍👩‍👧‍👦 Park│ 💪 Gym   │ 📚 Reading│ 👥 Date   │  │ ││  │  │ 6-7pm    │ 4-5:30pm │ 6-7pm    │ 8-9pm    │ 7-10pm       │  │ ││  │  └──────────┴──────────┴──────────┴──────────┴──────────────┘  │ ││  │                                                                  │ ││  │  📊 Generated by AI    👍 85% acceptance rate                   │ ││  └────────────────────────────────────────────────────────────────┘ ││                                                                       ││  ┌──────────────────────────┐  ┌──────────────────────────────────┐ ││  │  Quick Actions           │  │  Your Progress                   │ ││  │                          │  │                                  │ ││  │  🪄 Generate New Week    │  │  Weeks Planned:  12              │ ││  │                          │  │  Goals Completed: 89%            │ ││  │  ➕ Add Fixed Block      │  │  Time Saved:  ~4 hrs/week       │ ││  │                          │  │                                  │ ││  │  👥 Edit Family          │  │  ┌────────────────────────────┐ │ ││  │                          │  │  │ Weekly Activity Chart      │ │ ││  │  🎯 Manage Goals         │  │  │                            │ │ ││  │                          │  │  │     📊 [mini chart]        │ │ ││  └──────────────────────────┘  │  │                            │ │ ││                                 │  └────────────────────────────┘ │ ││  ┌────────────────────────────────────────────────────────────┐   │ ││  │  Recent Activity                                            │   │ ││  │                                                             │   │ ││  │  • Week Jan 13-19 generated  (2 hours ago)                 │   │ ││  │  • Added goal "Morning Yoga" for Jane  (Yesterday)         │   │ ││  │  • Week Jan 6-12 completed ✓  (3 days ago)                 │   │ ││  └────────────────────────────────────────────────────────────┘   │ ││                                                                       │└─────────────────────────────────────────────────────────────────────┘
Komponenty:
WeekPreviewComponent
Mini calendar (tylko current week)
Pokazuje główne blocks
Link do full schedule view
GET /weekly-schedules?weekStartDate={current}
QuickActionsComponent
Buttons do głównych akcji
Generate new week → Schedule Generator
Add fixed block → Modal with form
Edit family → Family Setup
Manage goals → Goals view
UsageStatsCardComponent
Summary stats (GET /weekly-usage-stats)
Mini chart (line/bar)
Metrics: weeks planned, acceptance rate, time saved
RecentActivityFeedComponent
Timeline recent actions
Generated schedules, added goals, completed weeks
Responsive:
Tablet: Stack vertically (week preview full width, then 2 columns)
Mobile: Single column, collapsed week preview
4. Weekly Schedule View (Main Calendar)
┌─────────────────────────────────────────────────────────────────────────────────────────┐│  Family Life Planner     [Dashboard] [Schedule] [Family] [Profile]                      │├─────────────────────────────────────────────────────────────────────────────────────────┤│                                                                                          ││  📅 Weekly Schedule           ◀ Jan 13-19, 2026 ▶                   [🪄 Regenerate]    ││                                                                                          ││  Filter: [All Members ▾]  [All Types ▾]                         [+ Add Block] [Export]  ││                                                                                          ││  ┌─────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐  ││  │Time │ Mon 13   │ Tue 14   │ Wed 15   │ Thu 16   │ Fri 17   │ Sat 18   │ Sun 19   │  ││  ├─────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤  ││  │ 6am │          │          │          │          │          │          │          │  ││  ├─────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤  ││  │ 7am │ ┌──────┐ │          │ ┌──────┐ │          │ ┌──────┐ │          │          │  ││  │     │ │ 💪   │ │          │ │ 💪   │ │          │ │ 💪   │ │          │          │  ││  │ 8am │ │ Gym  │ │          │ │ Gym  │ │          │ │ Gym  │ │          │          │  ││  │     │ │(John)│ │          │ │(John)│ │          │ │(John)│ │          │          │  ││  ├─────┤ └──────┘ │          │ └──────┘ │          │ └──────┘ │          │          │  ││  │ 9am ├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤  ││  │     │          │          │          │          │          │          │          │  ││  │10am │ ┌─────────────────────────────────────────────────────────────┐│          │  ││  │     │ │ 🏢 Work (John)                                              ││          │  ││  │11am │ │                                                             ││          │  ││  │12pm │ │                                                             ││  ┌────┐  │  ││  │ 1pm │ │                                                             ││  │👨‍👩‍👧‍👦 │  ││  │ 2pm │ │                                                             ││  │Park│  │  ││  │ 3pm │ │                                                             ││  │    │  │  ││  │ 4pm │ │                                                             ││  │Fam │  │  ││  │ 5pm │ └─────────────────────────────────────────────────────────────┘│  └────┘  │  ││  │ 6pm │ ┌──────┐ │          │ ┌──────┐ │          │ ┌──────────────┐ │          │  ││  │     │ │🍽️ Din│ │          │ │🍽️ Din│ │          │ │ 👥          │ │          │  ││  │ 7pm │ └──────┘ │          │ └──────┘ │          │ │ Date Night  │ │          │  ││  │     │          │          │          │          │ │ (John+Jane) │ │          │  ││  │ 8pm │ ┌──────┐ │          │ ┌──────┐ │ ┌──────┐ │ └─────────────┘ │          │  ││  │     │ │📚    │ │          │ │📚    │ │ │📚    │ │                 │          │  ││  │ 9pm │ │Read  │ │          │ │Read  │ │ │Read  │ │                 │          │  ││  │     │ └──────┘ │          │ └──────┘ │ └──────┘ │                 │          │  ││  └─────┴──────────┴──────────┴──────────┴──────────┴──────────────────┴──────────────┘  ││                                                                                          ││  Legend: 🏢 Work  💪 Activity  🍽️ Meal  📚 Personal  👥 Shared                          ││                                                                                          │└─────────────────────────────────────────────────────────────────────────────────────────┘  [Side Panel - shown when block clicked]  ┌────────────────────────────────┐  │  Edit Time Block          [×]  │  ├────────────────────────────────┤  │                                │  │  Title: Morning Workout        │  │  ┌──────────────────────────┐  │  │  │ Morning Workout          │  │  │  └──────────────────────────┘  │  │                                │  │  Type: [Activity ▾]            │  │                                │  │  For: [John Doe ▾]             │  │                                │  │  Date: Jan 13, 2026            │  │  ┌──────────────────────────┐  │  │  │ [Calendar picker]        │  │  │  └──────────────────────────┘  │  │                                │  │  Time: [7:00 AM ▾] - [8:00 AM ▾]│  │                                │  │  ☐ Shared activity             │  │                                │  │  Notes (optional):             │  │  ┌──────────────────────────┐  │  │  │                          │  │  │  └──────────────────────────┘  │  │                                │  │  ⚠️ Conflict: Overlaps with   │  │     Jane's "Morning Walk"      │  │                                │  │  ┌──────────┐  ┌────────────┐ │  │  │  Delete  │  │    Save    │ │  │  └──────────┘  └────────────┘ │  │                                │  └────────────────────────────────┘
Komponenty:
WeeklyCalendarComponent
7-column grid (days)
Time slots 6am-11pm (30min intervals)
Renders TimeBlockCards
GET /weekly-schedules/{scheduleId} with time-blocks
TimeBlockCardComponent
Visual representation of block
Color-coded by type
Shows: emoji, title, member name, time
Click → opens side panel
Hover → tooltip with full details
TimeBlockEditPanelComponent (Side Panel)
Form fields:
Title (text input)
Type (dropdown: WORK/ACTIVITY/MEAL/OTHER)
Family member (dropdown)
Date (date picker)
Start time, End time (time pickers)
Shared checkbox
Notes (textarea)
Conflict warning (if API returns 409)
Actions:
Save → PATCH /time-blocks/{id}
Delete → DELETE /time-blocks/{id}
Cancel → close panel
CalendarHeaderComponent
Week navigation (prev/next buttons)
Week range display
Regenerate button → POST /schedule-generator/{scheduleId}/regenerate
Filters (member, block type)
Add block button → opens add modal
Export button (future: PDF/iCal)
Interakcje:
Click empty slot → Quick add modal
Click existing block → Edit side panel
Drag & drop (Phase 2) → Update time
Right-click → Context menu (duplicate, delete)
States:
Loading: Skeleton placeholders for blocks
Empty: "No blocks this day" message + "Add block" button
Conflicts: Red border + warning icon
Shared blocks: Special border/background
Responsive:
Tablet (768-1279px): 3-4 days visible, horizontal scroll
Mobile (<768px): Single day view, swipe to change days
5. Schedule Generator View
┌─────────────────────────────────────────────────────────────────────┐│  Family Life Planner     [Dashboard] [Schedule] [Family] [Profile]  │├─────────────────────────────────────────────────────────────────────┤│                                                                       ││                    🪄 Generate Weekly Schedule                       ││                                                                       ││  ┌────────────────────────────────────────────────────────────────┐ ││  │  Configuration                                                  │ ││  │                                                                 │ ││  │  Week to Generate:                                              │ ││  │  ┌──────────────────────────────────┐                          │ ││  │  │  Jan 20 - 26, 2026  [📅]        │  (next upcoming Monday)  │ ││  │  └──────────────────────────────────┘                          │ ││  │                                                                 │ ││  │  Strategy: [Balanced ▾]                                         │ ││  │  Options: Balanced, Energy-optimized, Goal-focused              │ ││  │                                                                 │ ││  │  ☑ Respect existing fixed blocks                               │ ││  │  ☑ Include all recurring goals                                 │ ││  │  ☐ Prefer morning activities                                   │ ││  │  ☐ Maximize family time                                        │ ││  │                                                                 │ ││  │  ┌────────────────────────────────────────────────────┐        │ ││  │  │                  🪄 Generate                       │        │ ││  │  └────────────────────────────────────────────────────┘        │ ││  │                                                                 │ ││  │  or [Preview Only]                                              │ ││  │                                                                 │ ││  └────────────────────────────────────────────────────────────────┘ ││                                                                       ││  ┌────────────────────────────────────────────────────────────────┐ ││  │  Current Setup Summary                                          │ ││  │                                                                 │ ││  │  Family Members: 4  (John, Jane, Emma, Luke)                   │ ││  │  Total Goals: 12                                                │ ││  │  Fixed Blocks: 5  (Work schedules, school pickup)               │ ││  │                                                                 │ ││  │  Available Time: ~32 hours                                      │ ││  │  Required Time: ~18 hours  (for all goals)                      │ ││  │                                                                 │ ││  │  ✅ All goals can fit in schedule                               │ ││  │                                                                 │ ││  └────────────────────────────────────────────────────────────────┘ ││                                                                       │└─────────────────────────────────────────────────────────────────────┘
Během generování - Loading Modal:
┌─────────────────────────────────────┐│  Generating Your Schedule...   [×]  │├─────────────────────────────────────┤│                                     ││         ⏳ Please wait...           ││                                     ││    ━━━━━━━━━━━━━━━━━━━ 75%         ││                                     ││  Current step:                      ││  Optimizing family activity times   ││                                     ││  This may take up to 15 seconds     ││                                     ││       [Cancel Generation]           ││                                     │└─────────────────────────────────────┘
Po wygenerowaniu - Preview Modal:
┌───────────────────────────────────────────────────────────────────┐│  Generated Schedule Preview                                  [×]  │├───────────────────────────────────────────────────────────────────┤│                                                                   ││  🎉 Your schedule is ready!                                       ││                                                                   ││  Summary:                                                         ││  ✓ 12/12 goals scheduled                                          ││  ✓ 0 conflicts detected                                           ││  ✓ Balanced distribution across the week                          ││                                                                   ││  ┌─────────────────────────────────────────────────────────────┐ ││  │  Quick Preview (Mon-Sun):                                   │ ││  │  Mon: 🏢 Work, 💪 Gym, 📚 Reading                            │ ││  │  Tue: 🏢 Work, 👨‍👩‍👧‍👦 Park Visit, 🍽️ Family Dinner           │ ││  │  Wed: 🏢 Work, 💪 Gym, 📚 Reading                            │ ││  │  ...                                                         │ ││  └─────────────────────────────────────────────────────────────┘ ││                                                                   ││  How do you feel about this schedule?                             ││                                                                   ││  ┌──────────┐  ┌──────────┐                                      ││  │ 👍 Great │  │ 👎 Nope  │                                      ││  └──────────┘  └──────────┘                                      ││                                                                   ││  ┌───────────────────────────┐  ┌────────────────────────────┐  ││  │  View Full Calendar       │  │  Accept & Save             │  ││  └───────────────────────────┘  └────────────────────────────┘  ││                                                                   ││  [Regenerate with different strategy]                             ││                                                                   │└───────────────────────────────────────────────────────────────────┘
Komponenty:
ScheduleGeneratorFormComponent
Week picker (defaults to next Monday)
Strategy dropdown
Preference checkboxes
Generate/Preview buttons
POST /schedule-generator or /schedule-generator/preview
GenerationProgressModal
Progress bar (if backend supports streaming)
Current step message
Cancel button (AbortController)
Timeout at 15s → error message
GeneratedSchedulePreviewModal
Summary stats
Quick preview (collapsed)
Feedback buttons (thumbs up/down)
Actions:
View full → Navigate to Calendar view
Accept & Save → POST /feedback + Navigate
Regenerate → Close modal, restart
API Calls:
POST /schedule-generator → { scheduleId, summary }
POST /feedback → { scheduleId, rating: 1 or -1 }
6. Family Setup View
┌─────────────────────────────────────────────────────────────────────┐│  Family Life Planner     [Dashboard] [Schedule] [Family] [Profile]  │├─────────────────────────────────────────────────────────────────────┤│                                                                       ││  👨‍👩‍👧‍👦 Family & Goals Setup                                           ││                                                                       ││  ┌─────────────────────────────────────────────────────────────┐    ││  │  FAMILY MEMBERS                              [+ Add Member]  │    ││  ├─────────────────────────────────────────────────────────────┤    ││  │  ┌───────────────────────────────────────────────────────┐  │    ││  │  │  John Doe (You)                         [Edit]    [×]  │  │    ││  │  │  4 goals assigned                                      │  │    ││  │  └───────────────────────────────────────────────────────┘  │    ││  │  ┌───────────────────────────────────────────────────────┐  │    ││  │  │  Jane Doe (Spouse)                      [Edit]    [×]  │  │    ││  │  │  5 goals assigned                                      │  │    ││  │  │  Preferences: Morning activities, vegetarian          │  │    ││  │  └───────────────────────────────────────────────────────┘  │    ││  │  ┌───────────────────────────────────────────────────────┐  │    ││  │  │  Emma (Child, 5 years)                  [Edit]    [×]  │  │    ││  │  │  2 shared goals                                        │  │    ││  │  └───────────────────────────────────────────────────────┘  │    ││  │  ┌───────────────────────────────────────────────────────┐  │    ││  │  │  Luke (Child, 3 years)                  [Edit]    [×]  │  │    ││  │  │  1 shared goal                                         │  │    ││  │  └───────────────────────────────────────────────────────┘  │    ││  └─────────────────────────────────────────────────────────────┘    ││                                                                       ││  ┌─────────────────────────────────────────────────────────────┐    ││  │  RECURRING GOALS                                            │    ││  │                                                             │    ││  │  For: [All Members ▾]  Sort: [Priority ▾]  [+ Add Goal]    │    ││  ├─────────────────────────────────────────────────────────────┤    ││  │                                                             │    ││  │  John Doe:                                                  │    ││  │  ┌─────────────────────────────────────────────────────┐   │    ││  │  │ 💪 Morning Workout                         [Edit] [×]│   │    ││  │  │ 3x/week • 30 min • Morning • High priority         │   │    ││  │  └─────────────────────────────────────────────────────┘   │    ││  │  ┌─────────────────────────────────────────────────────┐   │    ││  │  │ 📚 Reading                                 [Edit] [×]│   │    ││  │  │ 5x/week • 20 min • Evening • Medium priority       │   │    ││  │  └─────────────────────────────────────────────────────┘   │    ││  │  ┌─────────────────────────────────────────────────────┐   │    ││  │  │ 💼 Side Project                            [Edit] [×]│   │    ││  │  │ 2x/week • 90 min • Evening • High priority         │   │    ││  │  └─────────────────────────────────────────────────────┘   │    ││  │  ┌─────────────────────────────────────────────────────┐   │    ││  │  │ 👥 Date Night (shared)                     [Edit] [×]│   │    ││  │  │ 1x/week • 2 hrs • Evening • High priority          │   │    ││  │  └─────────────────────────────────────────────────────┘   │    ││  │                                                             │    ││  │  Jane Doe:                                                  │    ││  │  [Similar goal cards...]                                    │    ││  │                                                             │    ││  └─────────────────────────────────────────────────────────────┘    ││                                                                       │└─────────────────────────────────────────────────────────────────────┘
Komponenty:
FamilyMemberListComponent
Cards dla każdego członka
Expandable/collapsible
Edit/Delete actions
GET /family-members
RecurringGoalListComponent
Grouped by family member
Filter by member
Sort by priority
Compact cards z kluczowymi info
Edit/Delete actions
GET /recurring-goals
AddMemberModal (triggered by [+ Add Member])
Same form as onboarding
POST /family-members
AddGoalModal (triggered by [+ Add Goal])
Same form as onboarding
POST /recurring-goals
Responsive:
Tablet: Stack sections vertically
Mobile: Accordion-style sections
7. Profile/Settings View
┌─────────────────────────────────────────────────────────────────────┐│  Family Life Planner     [Dashboard] [Schedule] [Family] [Profile]  │├─────────────────────────────────────────────────────────────────────┤│                                                                       ││  ⚙️ Profile & Settings                                               ││                                                                       ││  ┌─────────────────────────────────────────────────────────────┐    ││  │  ACCOUNT INFORMATION                                         │    ││  ├─────────────────────────────────────────────────────────────┤    ││  │                                                              │    ││  │  Display Name:                                               │    ││  │  ┌──────────────────────────────────┐                       │    ││  │  │ John Doe                         │  [Save Changes]       │    ││  │  └──────────────────────────────────┘                       │    ││  │                                                              │    ││  │  Email:                                                      │    ││  │  john.doe@example.com  (cannot be changed)                   │    ││  │                                                              │    ││  │  Member since: January 5, 2026                               │    ││  │                                                              │    ││  └─────────────────────────────────────────────────────────────┘    ││                                                                       ││  ┌─────────────────────────────────────────────────────────────┐    ││  │  YOUR PROGRESS                                               │    ││  ├─────────────────────────────────────────────────────────────┤    ││  │                                                              │    ││  │  ┌────────────────┬────────────────┬────────────────────┐   │    ││  │  │ Weeks Planned  │ Goals Achieved │ Acceptance Rate    │   │    ││  │  │      12        │      89%       │       85%          │   │    ││  │  └────────────────┴────────────────┴────────────────────┘   │    ││  │                                                              │    ││  │  Time Saved: ~48 hours total                                 │    ││  │                                                              │    ││  │  ┌─────────────────────────────────────────────────────┐    │    ││  │  │  Weekly Activity Trend                              │    │    ││  │  │                                                      │    │    ││  │  │      [Line chart showing activity over weeks]       │    │    ││  │  │                                                      │    │    ││  │  └─────────────────────────────────────────────────────┘    │    ││  │                                                              │    ││  └─────────────────────────────────────────────────────────────┘    ││                                                                       ││  ┌─────────────────────────────────────────────────────────────┐    ││  │  PREFERENCES                                                 │    ││  ├─────────────────────────────────────────────────────────────┤    ││  │                                                              │    ││  │  ☑ Send weekly summary emails                               │    ││  │  ☐ Enable notifications (coming soon)                       │    ││  │                                                              │    ││  │  Default generation strategy: [Balanced ▾]                   │    ││  │                                                              │    ││  │  Theme: ◉ Light  ○ Dark  ○ Auto                             │    ││  │                                                              │    ││  └─────────────────────────────────────────────────────────────┘    ││                                                                       ││  ┌─────────────────────────────────────────────────────────────┐    ││  │  DATA & PRIVACY                                              │    ││  ├─────────────────────────────────────────────────────────────┤    ││  │                                                              │    ││  │  [Download My Data]  (GDPR compliance)                       │    ││  │                                                              │    ││  │  [View Privacy Policy]  [View Terms of Service]              │    ││  │                                                              │    ││  └─────────────────────────────────────────────────────────────┘    ││                                                                       ││  ┌─────────────────────────────────────────────────────────────┐    ││  │  DANGER ZONE                                                 │    ││  ├─────────────────────────────────────────────────────────────┤    ││  │                                                              │    ││  │  Delete Account                                              │    ││  │  This will permanently delete your account and all           │    ││  │  associated data. This action cannot be undone.              │    ││  │                                                              │    ││  │  [🗑️ Delete My Account]                                     │    ││  │                                                              │    ││  └─────────────────────────────────────────────────────────────┘    ││                                                                       ││  [Log Out]                                                            ││                                                                       │└─────────────────────────────────────────────────────────────────────┘
Delete Account Confirmation Modal:
┌─────────────────────────────────────┐│  ⚠️ Delete Account             [×]  │├─────────────────────────────────────┤│                                     ││  Are you absolutely sure?           ││                                     ││  This will permanently delete:      ││  • Your profile                     ││  • All family members               ││  • All schedules and goals          ││  • All usage history                ││                                     ││  This action CANNOT be undone!      ││                                     ││  Type "DELETE" to confirm:          ││  ┌───────────────────────────────┐  ││  │                               │  ││  └───────────────────────────────┘  ││                                     ││  ┌──────────┐  ┌────────────────┐  ││  │  Cancel  │  │  Delete [disabled] ││  └──────────┘  └────────────────┘  ││                                     │└─────────────────────────────────────┘
Komponenty:
ProfileInfoComponent
Display name edit form
Email (read-only)
Save button → PATCH /user
UsageStatsDetailComponent
Detailed stats from GET /weekly-usage-stats
Charts library (Chart.js or Angular Charts)
Cards with key metrics
PreferencesComponent
Checkboxes for notifications (future)
Theme selector (LocalStorage)
Default strategy (LocalStorage or future user settings endpoint)
DataPrivacyComponent
Download data button (export JSON)
Links to legal documents
DangerZoneComponent
Delete account button → Opens confirmation modal
Confirmation modal with typing verification
DELETE /user → Logout → Redirect to landing
API Calls:
GET /user
PATCH /user
DELETE /user
GET /weekly-usage-stats
8. Shared Components & Design System
8.1 Navigation Bar (Top)
┌─────────────────────────────────────────────────────────────────────┐│  🏠 Family Life Planner   [Dashboard] [Schedule] [Family] [Profile] │ [👤 John ▾]└─────────────────────────────────────────────────────────────────────┘
Komponenty:
Logo + app name (link to dashboard)
Main navigation links (active state highlighting)
User menu dropdown (profile, settings, logout)
Responsive:
Mobile: Hamburger menu, collapsible nav
8.2 Toast Notifications
┌──────────────────────────────────────────┐│  ✅ Schedule saved successfully!    [×]  │└──────────────────────────────────────────┘┌──────────────────────────────────────────┐│  ⚠️ Failed to save changes          [×]  │└──────────────────────────────────────────┘┌──────────────────────────────────────────┐│  ℹ️ Generating schedule...          [×]  │└──────────────────────────────────────────┘
Position: Top-right corner
Duration: 5 seconds (auto-dismiss)
Types: Success, Error, Warning, Info
8.3 Loading States
Skeleton Loaders:
┌────────────────────────────┐│  ▢▢▢▢▢▢▢▢▢▢               │  <- Title placeholder│  ▢▢▢▢▢▢▢▢▢▢▢▢▢▢           │  <- Content placeholder│  ▢▢▢▢▢                     │  <- Metadata placeholder└────────────────────────────┘
Spinners:
Full page: centered spinner with message
Inline: small spinner beside button text
Button: replace text with spinner when loading
8.4 Empty States
┌─────────────────────────────────────┐│                                     ││           📭                        ││                                     ││     No schedules yet                ││                                     ││  Generate your first weekly         ││  schedule to get started!           ││                                     ││  ┌───────────────────────┐          ││  │  Generate Schedule    │          ││  └───────────────────────┘          ││                                     │└─────────────────────────────────────┘
8.5 Color Coding & Icons
Block Types:
🏢 Work - Blue (#3B82F6)
💪 Activity - Green (#10B981)
🍽️ Meal - Orange (#F59E0B)
📚 Personal - Purple (#8B5CF6)
👥 Shared - Pink (#EC4899)
⚙️ Other - Gray (#6B7280)
Priority:
🔴 High - Red accent
🟡 Medium - Yellow accent
🟢 Low - Green accent
Conflict Warning:
⚠️ Yellow/Red border + icon
Podsumowanie Mockupów
Przygotowałem 8 kluczowych widoków z szczegółowymi layoutami:
✅ Login & Registration - Prosty, czytelny onboarding
✅ Onboarding Wizard - 4-step guided setup
✅ Dashboard - Hub z quick actions i stats
✅ Weekly Schedule (Calendar) - Main feature, editable grid
✅ Schedule Generator - AI configuration + preview
✅ Family Setup - CRUD members & goals
✅ Profile/Settings - Account, stats, GDPR compliance
✅ Shared Components - Navigation, toasts, loading states
Kluczowe design decisions:
Desktop-first z responsywnym fallbackiem
Color-coded blocks dla szybkiej identyfikacji
Side panel editing zamiast modali (lepsze UX)
Progress indicators dla AI operations
3-level error handling (inline, toast, modal)
WCAG AA accessible (semantic HTML, ARIA, keyboard nav)
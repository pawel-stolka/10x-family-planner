# Architektura UI dla Family Life Planner

## 1. Przegląd struktury UI

Family Life Planner to desktopowa aplikacja webowa zbudowana w Angular 20+ wykorzystująca standalone components, reactive forms i Angular Signals do zarządzania stanem. Architektura UI została zaprojektowana wokół koncepcji monorepo z wyraźnym podziałem na biblioteki feature (logika biznesowa i komponenty prezentacyjne) oraz data-access (zarządzanie stanem i komunikacja z API).

**Główne założenia architektoniczne:**

- **Wzorzec Feature-First**: Każda funkcjonalność ma dedykowaną bibliotekę feature zawierającą komponenty, routing i logikę UI
- **Centralizacja stanu**: Wykorzystanie Angular Signals poprzez dedykowane store'y (FamilyStore, GoalsStore, CommitmentsStore, ScheduleStore)
- **Separacja odpowiedzialności**: Biblioteki data-access obsługują komunikację z API i stan, feature libraries zawierają komponenty UI
- **Routing modularny**: Lazy-loaded routes dla każdej głównej funkcjonalności
- **Desktop-first**: Optymalizacja dla środowiska desktopowego (responsywność w Phase 2+)

**Kluczowe biblioteki:**

```
libs/frontend/
├── feature-auth/           # Rejestracja, logowanie
├── feature-family/         # Zarządzanie członkami rodziny
├── feature-goals/          # Recurring goals (cele cykliczne)
├── feature-commitments/    # Fixed commitments (stałe zobowiązania)
├── data-access-family/     # FamilyStore + API service
├── data-access-goals/      # GoalsStore + API service
├── data-access-commitments/# CommitmentsStore + API service
├── data-access-schedule/   # ScheduleStore + API service
└── ui-shared/              # Komponenty współdzielone
```

---

## 2. Lista widoków

### 2.1. Widok Rejestracji

**Ścieżka**: `/register`

**Główny cel**: Umożliwienie nowym użytkownikom utworzenia konta w systemie.

**Kluczowe informacje**:
- Formularz rejestracyjny z polami: email, hasło, displayName (opcjonalne)
- Link do strony logowania
- Komunikaty walidacji i błędów

**Kluczowe komponenty widoku**:
- `RegisterFormComponent`: Reaktywny formularz z walidacją
  - Email validator (format email)
  - Password validator (minimum 8 znaków, wymagania złożoności)
  - Password confirmation field
  - Display name (opcjonalny, 2-50 znaków)
- `AuthLayoutComponent`: Layout wrapper dla widoków uwierzytelniania
- Error banner dla komunikatów o błędach API (np. "Email już istnieje")
- Loading state podczas rejestracji
- Success state z przekierowaniem do `/dashboard`

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: 
  - Automatyczne przejście do logowania po sukcesie
  - Inline validation (real-time feedback)
  - Wyraźne komunikaty błędów
  - "Pokaż/ukryj hasło" toggle
- **Dostępność**: 
  - ARIA labels na wszystkich polach formularza
  - Fokus trap w formularzu
  - Keyboard navigation (Tab, Enter)
  - Error announcements przez screen reader (aria-live)
- **Bezpieczeństwo**: 
  - Client-side validation jako pierwsza linia obrony
  - Hasła nigdy nie wyświetlane w plain text
  - HTTPS only
  - Token otrzymany po rejestracji przechowywany w localStorage (lub sessionStorage)
  - Automatyczne przekierowanie po sesji wygasłej

---

### 2.2. Widok Logowania

**Ścieżka**: `/login`

**Główny cel**: Umożliwienie zarejestrowanym użytkownikom dostępu do aplikacji.

**Kluczowe informacje**:
- Formularz logowania: email, hasło
- Link do rejestracji
- Komunikaty błędów (nieprawidłowe dane)

**Kluczowe komponenty widoku**:
- `LoginFormComponent`: Reaktywny formularz
  - Email field
  - Password field
  - "Zapamiętaj mnie" checkbox (opcjonalnie)
- `AuthLayoutComponent`: Współdzielony layout
- Error banner dla błędów 401 (Unauthorized)
- Loading state podczas logowania
- Redirect guard do `/dashboard` jeśli już zalogowany

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: 
  - Automatyczne przekierowanie do `/dashboard` po sukcesie
  - Wyraźne komunikaty o nieprawidłowych danych
  - Loading indicator podczas weryfikacji
  - "Pokaż/ukryj hasło" toggle
- **Dostępność**: 
  - ARIA labels, fokus management
  - Keyboard-only navigation
  - Screen reader announcements dla błędów
- **Bezpieczeństwo**: 
  - Rate limiting (API-side, ale UI może pokazać info o blocku)
  - Token JWT przechowywany bezpiecznie
  - Auto-logout po wygaśnięciu tokena
  - Redirect do `/login` przy 401 na jakimkolwiek endpoincie

---

### 2.3. Widok Dashboard (Główny ekran)

**Ścieżka**: `/dashboard`

**Główny cel**: Centralne miejsce do generowania i przeglądania tygodniowego harmonogramu. Główny widok aplikacji po zalogowaniu.

**Kluczowe informacje**:
- Aktualny tydzień (Monday - Sunday)
- Weekly calendar z time blocks
- Przycisk "Generate Week Schedule"
- Przycisk "Regenerate" (jeśli harmonogram już istnieje)
- Summary statistics (totalBlocks, goalsScheduled, conflicts)
- Filtry widoku (All, Shared, per family member)

**Kluczowe komponenty widoku**:
- `DashboardComponent`: Główny kontener
- `WeeklyCalendarComponent`: Wyświetlanie tygodniowego kalendarza
  - Grupowanie bloków według dni (Monday-Sunday)
  - Grupowanie według członków rodziny w ramach każdego dnia
  - Sekcja "Shared / Family" dla bloków współdzielonych
  - Badge system: "Shared", "Goal", "Fixed"
  - Color coding (lewa ramka): WORK (purple), ACTIVITY (green), MEAL (orange), OTHER (gray)
- `ScheduleGeneratorControlsComponent`: Kontrolki generowania
  - Week selector (wybór tygodnia do generowania)
  - Strategy selector (opcjonalny: "balanced", "morning-focused", etc.)
  - "Generate" button z loading state
  - "Regenerate" button (jeśli harmonogram istnieje)
- `ScheduleSummaryComponent`: Statystyki harmonogramu
  - Total blocks, goals scheduled, fixed blocks count
  - Conflicts indicator (jeśli > 0, wyświetl warning)
  - Distribution chart/list (bloki per dzień)
- `FilterBarComponent`: Filtry wyświetlania
  - "All" button
  - "Shared" button
  - Buttons dla każdego członka rodziny (dynamicznie generowane)
  - Active filter highlighting
- `TimeBlockCardComponent`: Pojedynczy blok czasu
  - Title, time range, family member name
  - Block type indicator (color + icon)
  - Badges (Shared, Goal, Fixed)
  - Quick actions (edit, delete) - jeśli nie jest fixed commitment
  - Feedback controls (thumbs up/down) - dla AI-generated blocks

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: 
  - Loading state podczas generowania (15s max z progress indicator)
  - Success/error toast notifications
  - Smooth transitions przy filtrowaniu
  - Empty state jeśli brak harmonogramu ("Click Generate to create your first schedule")
  - Conflict warning jeśli AI wykryje nakładające się bloki
  - Możliwość bezpośredniej edycji bloków (inline editing lub modal)
- **Dostępność**: 
  - Keyboard navigation (Tab przez bloki, Enter do edycji)
  - Screen reader friendly (semantic HTML, ARIA labels)
  - High contrast mode support
  - Fokus management przy otwieraniu/zamykaniu modali
- **Bezpieczeństwo**: 
  - Route guard: tylko dla zalogowanych użytkowników
  - Dane harmonogramu należą tylko do zalogowanego usera
  - Walidacja po stronie API (userId check)

---

### 2.4. Widok Family Members (Członkowie rodziny)

**Ścieżka**: `/family`

**Główny cel**: Zarządzanie listą członków rodziny (dodawanie współmałżonka, dzieci).

**Kluczowe informacje**:
- Lista wszystkich członków rodziny
- Role: USER (właściciel konta), SPOUSE (współmałżonek), CHILD (dziecko z wiekiem)
- Name, role, age (dla dzieci), preferences (opcjonalne)

**Kluczowe komponenty widoku**:
- `FamilyListComponent`: Lista członków
  - Card dla każdego członka z: name, role badge, age (jeśli dziecko)
  - Quick actions: edit, delete (soft-delete)
  - Empty state: "Add your first family member"
- `FamilyFormComponent`: Formularz dodawania/edycji
  - Name field (wymagane, 2-100 znaków)
  - Role selector (USER, SPOUSE, CHILD)
  - Age field (conditional: wymagane jeśli CHILD, 0-17)
  - Preferences textarea (opcjonalne JSON lub plain text)
  - Save/Cancel buttons
- `FamilyMemberCardComponent`: Card prezentacyjny
  - Avatar (inicjały lub placeholder)
  - Name + role badge
  - Age display (dla dzieci)
  - Edit/delete icons

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: 
  - Conditional validation (age tylko dla CHILD)
  - Confirmation dialog przed usunięciem
  - Inline editing lub modal form
  - Toast notifications (success/error)
  - "Add Family Member" floating action button lub prominentny przycisk
- **Dostępność**: 
  - ARIA labels, keyboard navigation
  - Focus trap w formularzu
  - Screen reader friendly role badges
- **Bezpieczeństwo**: 
  - Tylko właściciel konta może zarządzać rodziną
  - Soft-delete (deleted_at) z możliwością przywrócenia
  - Walidacja roli i wieku po stronie API

---

### 2.5. Widok Recurring Goals (Cele cykliczne)

**Ścieżka**: `/goals`

**Główny cel**: Definiowanie celów/aktywności, które mają być regularnie planowane przez AI (np. "Morning Run" 3x/tydzień).

**Kluczowe informacje**:
- Lista wszystkich recurring goals
- Dla każdego: name, family member (owner), frequency per week, duration, preferred time of day, priority
- Goals są input do AI scheduler

**Kluczowe komponenty widoku**:
- `GoalsListComponent`: Lista celów
  - Filtry: All, per family member
  - Sortowanie: priority (high→low), createdAt
  - Card dla każdego celu z kluczowymi info
  - Empty state: "Create your first goal to get started"
- `GoalFormComponent`: Formularz tworzenia/edycji
  - Name field (wymagane, 2-100 znaków)
  - Description textarea (opcjonalne)
  - Family member selector (dropdown z members z FamilyStore)
  - Frequency per week (number input, 1-21, z sugestią: "How many times per week?")
  - Preferred duration minutes (number input, 15-480, z helper: "Typical duration in minutes")
  - Preferred time of day (multi-select: MORNING, AFTERNOON, EVENING)
  - Priority (slider lub select: 1-10, default 5)
  - Rules (opcjonalnie, advanced: RRULE format)
  - Save/Cancel
- `GoalCardComponent`: Card prezentacyjny
  - Name + description (truncated)
  - Family member name + avatar
  - Frequency badge (e.g., "3x/week")
  - Duration badge (e.g., "45 min")
  - Time preferences pills (Morning, Evening)
  - Priority indicator (stars lub numeric)
  - Edit/delete icons

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: 
  - Smart defaults (frequency: 2, duration: 30, priority: 5)
  - Inline validation (frequency > 0, duration > 0)
  - Confirmation przed usunięciem
  - Visual priority indicators
  - Helper text: "These goals will be automatically scheduled by AI"
- **Dostępność**: 
  - ARIA labels, keyboard nav
  - Screen reader friendly badges
  - Focus management w formularzu
- **Bezpieczeństwo**: 
  - Tylko właściciel konta może zarządzać goalami
  - FamilyMemberId validation (must belong to user)
  - Soft-delete

---

### 2.6. Widok Recurring Commitments (Stałe zobowiązania)

**Ścieżka**: `/commitments`

**Główny cel**: Definiowanie fixed time blocks (praca, szkoła, sen), które są hard constraints dla AI – nie mogą być nadpisane.

**Kluczowe informacje**:
- Lista wszystkich recurring commitments
- Dla każdego: title, day of week, start/end time, block type, family member (lub shared)
- Commitments są FIXED constraints w AI scheduling

**Kluczowe komponenty widoku**:
- `CommitmentsListComponent`: Lista zobowiązań
  - Filtry: All, per day of week, per family member, shared only
  - Grupowanie: według dnia tygodnia (Monday-Sunday)
  - Card dla każdego commitment
  - Empty state: "Add your first fixed commitment (e.g., work hours)"
- `CommitmentFormComponent`: Formularz tworzenia/edycji
  - Title field (wymagane)
  - Family member selector (lub "Shared" checkbox)
  - Day of week selector (1-7, Monday-Sunday, może być multi-select dla recurring)
  - Start time picker (time input)
  - End time picker (time input, validation: end > start)
  - Block type selector (WORK, ACTIVITY, MEAL, OTHER)
  - Is shared checkbox
  - Save/Cancel
- `CommitmentCardComponent`: Card prezentacyjny
  - Title
  - Day badge (e.g., "Monday", "Mon-Fri" jeśli recurring)
  - Time range (e.g., "09:00 - 17:00")
  - Block type badge + color
  - Family member name (lub "Shared" badge)
  - "Fixed" indicator (icon lub badge)
  - Edit/delete icons

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: 
  - Time picker z validation (end must be after start)
  - Conflict detection: warning jeśli commitment overlaps z innym dla tej samej osoby
  - Visual grouping według dni tygodnia
  - Helper text: "These blocks are fixed - AI will never overlap them"
  - Bulk create (e.g., "Mon-Fri" dla work hours)
- **Dostępność**: 
  - ARIA labels, keyboard nav
  - Accessible time picker
  - Screen reader friendly day badges
- **Bezpieczeństwo**: 
  - Tylko właściciel konta może zarządzać commitments
  - FamilyMemberId validation
  - Soft-delete

---

### 2.7. Widok User Profile (Profil użytkownika)

**Ścieżka**: `/profile`

**Główny cel**: Zarządzanie danymi konta użytkownika, zmiana ustawień, usunięcie konta.

**Kluczowe informacje**:
- Display name, email (read-only)
- Opcje: zmiana display name
- Usunięcie konta (GDPR compliance)
- Wylogowanie

**Kluczowe komponenty widoku**:
- `ProfileComponent`: Główny kontener
- `ProfileFormComponent`: Edycja display name
  - Display name field (2-50 znaków)
  - Save/Cancel
- `AccountSettingsComponent`: Ustawienia konta
  - Email display (read-only)
  - Created at display
  - Logout button (widoczny, wyraźny)
- `DangerZoneComponent`: Operacje niebezpieczne
  - "Delete Account" button z confirmation dialog
  - Warning text: "This action is permanent. All your data will be deleted."

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: 
  - Wyraźne oddzielenie "safe" i "dangerous" actions
  - Confirmation dialog dla usunięcia konta (two-step: checkbox + confirm button)
  - Toast notification po zapisaniu zmian
  - Logout button wyraźnie widoczny
- **Dostępność**: 
  - ARIA labels, keyboard nav
  - Focus trap w confirmation dialog
  - Screen reader warnings dla destructive actions
- **Bezpieczeństwo**: 
  - Email read-only (zmiana email w Phase 2+)
  - Confirmation przed delete account
  - Cascade delete wszystkich danych użytkownika (family, goals, commitments, schedules)
  - Logout invalidates JWT (server-side)

---

### 2.8. Widok Time Block Details/Edit (Szczegóły/Edycja bloku czasu)

**Ścieżka**: `/dashboard/blocks/:blockId` (lub modal w dashboard)

**Główny cel**: Edycja pojedynczego time block w harmonogramie.

**Kluczowe informacje**:
- Title, time range, block type
- Family member assignment
- Is shared flag
- Metadata (notes, source, recurringGoalId jeśli linked)

**Kluczowe komponenty widoku**:
- `TimeBlockEditComponent`: Formularz edycji (modal lub dedykowana strona)
  - Title field
  - Time range pickers (start, end)
  - Block type selector
  - Family member selector (lub "Shared")
  - Notes textarea
  - Save/Cancel/Delete buttons
- Badge indicators jeśli block jest linked do recurring goal lub fixed commitment

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: 
  - Read-only dla fixed commitments (można tylko usunąć cały commitment, nie pojedynczy block)
  - Warning jeśli edycja tworzy conflict
  - Toast notification po zapisaniu
  - Możliwość szybkiego usunięcia
- **Dostępność**: 
  - ARIA labels, keyboard nav
  - Focus trap w modalu
- **Bezpieczeństwo**: 
  - Walidacja: tylko właściciel może edytować
  - Conflict detection API-side

---

### 2.9. Widok Feedback/Statistics (Opcjonalny w MVP)

**Ścieżka**: `/stats` lub sekcja w `/dashboard`

**Główny cel**: Śledzenie statystyk użycia i feedbacku dla AI.

**Kluczowe informacje**:
- Ile harmonogramów wygenerowano
- Ile zaakceptowano (thumbs up)
- Usage stats (generacje per tydzień)

**Kluczowe komponenty widoku**:
- `UsageStatsComponent`: Wykresy i statystyki
  - Total schedules generated
  - Acceptance rate (thumbs up / total)
  - Weekly usage chart
- `FeedbackListComponent`: Historia feedbacku (opcjonalnie)

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: Proste wykresy, jasne metryki
- **Dostępność**: Tabele danych jako fallback dla wykresów
- **Bezpieczeństwo**: Tylko dane własne użytkownika

---

### 2.10. Widok Error/404

**Ścieżka**: `**` (wildcard route)

**Główny cel**: Obsługa nieistniejących ścieżek.

**Kluczowe informacje**:
- "404 - Page not found"
- Link do dashboard lub home

**Kluczowe komponenty widoku**:
- `NotFoundComponent`: Simple error message z CTA

---

## 3. Mapa podróży użytkownika

### 3.1. Onboarding Flow (Nowy użytkownik)

```
START
  ↓
1. Landing Page / Login (/)
  ↓ (jeśli nowy user kliknie "Register")
2. Rejestracja (/register)
  ↓ (wypełnienie formularza + submit)
3. Automatyczne zalogowanie
  ↓ (redirect)
4. Dashboard (/dashboard)
  ↓ (empty state - brak harmonogramu)
5. Setup Wizard (opcjonalnie) lub bezpośrednie linki:
  ↓
  5a. "Add Family Members" → /family
      - Dodanie SPOUSE, CHILD (opcjonalne)
      ↓ (po dodaniu członków rodziny)
  5b. "Create Recurring Goals" → /goals
      - Dodanie celów (np. "Morning Run", "Guitar Practice")
      ↓ (po dodaniu celów)
  5c. "Define Fixed Commitments" → /commitments
      - Dodanie work hours, school hours, sleep time
      ↓ (po skonfigurowaniu commitments)
6. Powrót do Dashboard (/dashboard)
  ↓
7. Kliknięcie "Generate Week Schedule"
  ↓ (loading 5-15s)
8. Wyświetlenie wygenerowanego harmonogramu
  ↓
9. Przegląd, filtrowanie, feedback (thumbs up/down)
  ↓
10. Opcjonalna edycja bloków
```

**Kluczowe momenty UX**:
- **First-time empty state**: Dashboard pokazuje helper cards: "Setup your family", "Add your goals", "Define fixed commitments", "Generate schedule"
- **Progressive disclosure**: Użytkownik może pominąć setup i od razu generować (AI poradzi sobie z minimalnym inputem)
- **Contextual help**: Tooltips, helper text przy każdym formularzu

---

### 3.2. Returning User Flow (Powracający użytkownik)

```
START
  ↓
1. Login (/login)
  ↓ (credentials OK)
2. Dashboard (/dashboard)
  ↓ (harmonogram już istnieje dla bieżącego/nadchodzącego tygodnia)
3. Przegląd aktualnego harmonogramu
  ↓
4. Opcje:
  4a. Filtrowanie widoku (All, Shared, per member)
  4b. Edycja pojedynczego bloku (klik → modal/edit view)
  4c. Regenerowanie tygodnia ("Regenerate")
  4d. Przejście do Family/Goals/Commitments w celu aktualizacji
  ↓
5. Weekly routine:
  - Poniedziałek/Wtorek: przegląd harmonogramu, drobne edycje
  - W tygodniu: feedback (thumbs up/down na blokach)
  - Piątek/Sobota: generowanie kolejnego tygodnia
```

**Kluczowe momenty UX**:
- **Fast access**: Po zalogowaniu użytkownik trafia od razu do harmonogramu
- **Quick actions**: Edycja inline, szybkie filtry, feedback bez opuszczania dashboard
- **Navigation**: Boczna nawigacja lub top nav bar z linkami: Dashboard, Family, Goals, Commitments, Profile

---

### 3.3. AI Generation Flow (Szczegółowy przebieg generowania)

```
START: User w widoku Dashboard
  ↓
1. Kliknięcie "Generate Week Schedule"
  ↓
2. Modal (opcjonalnie) z opcjami:
  - Week selector (default: najbliższy poniedziałek)
  - Strategy selector (balanced, morning-focused, evening-focused) - opcjonalnie
  - Advanced preferences toggle (opcjonalnie)
  ↓
3. Kliknięcie "Confirm" lub "Generate"
  ↓
4. Loading state:
  - Progress bar lub spinner
  - Status message: "Loading your family members..."
  - Status message: "Loading your goals..."
  - Status message: "Loading your commitments..."
  - Status message: "Generating schedule with AI..."
  - Status message: "Optimizing time blocks..."
  ↓ (5-15 sekund)
5. Success:
  - Toast notification: "Schedule generated successfully!"
  - Automatyczne wyświetlenie nowo wygenerowanego harmonogramu
  - Summary panel: "42 blocks, 5 goals scheduled, 0 conflicts"
  ↓
6. User review:
  - Przeglądanie bloków
  - Sprawdzanie czy goals zostały zaplanowane
  - Sprawdzanie czy commitments są respektowane
  ↓
7. Feedback:
  - Thumbs up/down na poziomie całego harmonogramu (opcjonalnie)
  - Thumbs up/down na poziomie pojedynczych bloków
  ↓
8. Optional edits:
  - Kliknięcie na blok → edit modal
  - Zmiana czasu, tytułu, family member
  - Save → blok zaktualizowany w harmonogramie
```

**Error handling w flow**:
- **API timeout (>15s)**: Error message: "AI is taking longer than expected. Please try again."
- **API error (500)**: Error message: "Something went wrong. Please check your internet connection and try again."
- **Validation error (400)**: Error message z szczegółami: "Please add at least one family member before generating."
- **Conflict detected**: Warning message: "We detected 2 conflicts in your schedule. Review blocks marked with ⚠️."

---

## 4. Układ i struktura nawigacji

### 4.1. Główna nawigacja

**Typ**: Boczna nawigacja (sidebar) lub górna nawigacja (top navbar), widoczna po zalogowaniu.

**Struktura** (Sidebar layout - rekomendowany):

```
┌─────────────────────────────────────────────────┐
│  [Logo] Family Life Planner                     │
│  ─────────────────────────────────────────────  │
│  🏠 Dashboard                                    │
│  👨‍👩‍👧‍👦 Family Members                              │
│  🎯 Recurring Goals                              │
│  📅 Fixed Commitments                            │
│  ─────────────────────────────────────────────  │
│  📊 Statistics (opcjonalnie)                     │
│  ─────────────────────────────────────────────  │
│  👤 Profile                                      │
│  🚪 Logout                                       │
└─────────────────────────────────────────────────┘
```

**Active state**: Aktywny link wyróżniony kolorem/bold.

**Responsywność** (dla przyszłości):
- Desktop: sidebar zawsze widoczny
- Tablet/mobile: hamburger menu z collapsible sidebar

---

### 4.2. Routing structure

```typescript
// app.routes.ts
const routes: Routes = [
  // Public routes
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login/login.component') },
  { path: 'register', loadComponent: () => import('./auth/register/register.component') },
  
  // Protected routes (za AuthGuard)
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component') },
      {
        path: 'family',
        loadChildren: () => import('@family-planner/frontend/feature-family').then(m => m.familyRoutes)
      },
      {
        path: 'goals',
        loadChildren: () => import('@family-planner/frontend/feature-goals').then(m => m.goalsRoutes)
      },
      {
        path: 'commitments',
        loadChildren: () => import('@family-planner/frontend/feature-commitments').then(m => m.commitmentsRoutes)
      },
      { path: 'profile', loadComponent: () => import('./profile/profile.component') },
      { path: 'stats', loadComponent: () => import('./stats/stats.component') }, // opcjonalnie
    ]
  },
  
  // Wildcard
  { path: '**', loadComponent: () => import('./not-found/not-found.component') }
];
```

---

### 4.3. Breadcrumbs (opcjonalnie)

Dla lepszej nawigacji w głębszych widokach:

```
Dashboard > Edit Time Block (#123)
Family Members > Edit Member (Anna)
Recurring Goals > Create New Goal
```

**Implementacja**: `BreadcrumbComponent` dynamicznie generowany na podstawie routing state.

---

### 4.4. Modals vs. Dedicated Pages

**Modals** (zalecane dla):
- Tworzenie/edycja time block (szybka edycja bez opuszczania dashboard)
- Confirmation dialogs (delete confirmation)
- Generation options (week selector, strategy)

**Dedicated Pages** (zalecane dla):
- Family member create/edit (więcej pól, bardziej skomplikowane)
- Recurring goal create/edit (wiele pól, advanced options)
- Commitment create/edit (time picker, day selector)
- Profile edit

**Trade-off**: Modals = szybkość, dedykowane strony = więcej miejsca na content i lepszy deep linking.

---

## 5. Kluczowe komponenty

### 5.1. Komponenty współdzielone (libs/frontend/ui-shared/)

#### 5.1.1. `ButtonComponent`

**Cel**: Jednolite przyciski w całej aplikacji.

**Props**:
- `variant`: 'primary' | 'secondary' | 'danger' | 'ghost'
- `size`: 'small' | 'medium' | 'large'
- `disabled`: boolean
- `loading`: boolean (pokazuje spinner)
- `icon`: string (optional, nazwa ikony)

**Użycie**: Wszystkie akcje (Save, Cancel, Delete, Generate, etc.)

---

#### 5.1.2. `FormFieldComponent`

**Cel**: Wrapper dla pól formularza z etykietą, walidacją, error message.

**Props**:
- `label`: string
- `error`: string | null
- `helperText`: string (optional)
- `required`: boolean

**Sloty**: Input content (ng-content)

**Użycie**: Wszystkie formularze

---

#### 5.1.3. `LoadingSpinnerComponent`

**Cel**: Jednolity loading indicator.

**Props**:
- `size`: 'small' | 'medium' | 'large'
- `message`: string (optional, "Loading...")

**Użycie**: Podczas ładowania danych, AI generation, API calls

---

#### 5.1.4. `ToastNotificationComponent`

**Cel**: Toast messages dla feedbacku (success, error, info, warning).

**Props**:
- `type`: 'success' | 'error' | 'info' | 'warning'
- `message`: string
- `duration`: number (default 5000ms, auto-dismiss)

**Service**: `ToastService` (injectable, singleton) do triggerowania toastów z dowolnego miejsca w aplikacji.

**Użycie**: Po każdej API akcji (save, delete, generate)

---

#### 5.1.5. `ConfirmDialogComponent`

**Cel**: Reusable confirmation modal.

**Props**:
- `title`: string
- `message`: string
- `confirmText`: string (default "Confirm")
- `cancelText`: string (default "Cancel")
- `danger`: boolean (jeśli true, confirm button jest red)

**Outputs**:
- `confirm`: EventEmitter
- `cancel`: EventEmitter

**Service**: `ConfirmDialogService` do otwierania dialogu z kodu.

**Użycie**: Delete confirmations, regenerate warnings

---

#### 5.1.6. `BadgeComponent`

**Cel**: Małe etykiety/tagi dla statusów.

**Props**:
- `variant`: 'success' | 'info' | 'warning' | 'danger' | 'neutral'
- `label`: string

**Użycie**: "Shared", "Goal", "Fixed", role badges, day badges

---

#### 5.1.7. `EmptyStateComponent`

**Cel**: Placeholder gdy brak danych.

**Props**:
- `icon`: string (optional)
- `title`: string
- `message`: string
- `actionLabel`: string (optional, e.g., "Add First Goal")
- `action`: EventEmitter (optional)

**Użycie**: Empty lists (no family members, no goals, no schedule)

---

#### 5.1.8. `ErrorBannerComponent`

**Cel**: Wyświetlanie error messages (np. API errors).

**Props**:
- `error`: string | HttpErrorResponse
- `dismissible`: boolean

**Użycie**: Góra formularzy, góra list views

---

### 5.2. Komponenty domenowe

#### 5.2.1. `WeeklyCalendarComponent`

**Lokalizacja**: `apps/frontend/src/app/dashboard/weekly-calendar/`

**Cel**: Główny komponent kalendarza tygodniowego.

**Inputs**:
- `timeBlocks`: TimeBlock[]
- `familyMembers`: FamilyMember[]
- `activeFilter`: string | null

**Outputs**:
- `blockClick`: EventEmitter<TimeBlock>
- `filterChange`: EventEmitter<string>

**Funkcjonalności**:
- Grupowanie bloków według dni (Monday-Sunday)
- Grupowanie według członków rodziny w ramach każdego dnia
- Filtrowanie (All, Shared, per member)
- Color coding według block type
- Badge system (Shared, Goal, Fixed)

**Sub-komponenty**:
- `DayColumnComponent`: Kolumna dla jednego dnia
- `MemberSectionComponent`: Sekcja dla jednego członka rodziny w ramach dnia
- `TimeBlockCardComponent`: Karta pojedynczego bloku

---

#### 5.2.2. `TimeBlockCardComponent`

**Lokalizacja**: `apps/frontend/src/app/dashboard/weekly-calendar/time-block-card/`

**Cel**: Prezentacja pojedynczego time block.

**Inputs**:
- `block`: TimeBlock
- `memberName`: string (dla display)

**Outputs**:
- `edit`: EventEmitter<TimeBlock>
- `delete`: EventEmitter<TimeBlock>
- `feedback`: EventEmitter<{block: TimeBlock, rating: number}>

**Funkcjonalności**:
- Wyświetlanie title, time range, member name
- Badges (Shared, Goal, Fixed)
- Color coding (left border)
- Quick actions (edit, delete)
- Feedback controls (thumbs up/down) dla AI-generated

---

#### 5.2.3. `ScheduleGeneratorControlsComponent`

**Lokalizacja**: `apps/frontend/src/app/dashboard/schedule-generator-controls/`

**Cel**: Kontrolki do generowania harmonogramu.

**Outputs**:
- `generate`: EventEmitter<{weekStartDate: string, strategy?: string}>
- `regenerate`: EventEmitter<{scheduleId: string}>

**Funkcjonalności**:
- Week selector (date picker, default: najbliższy poniedziałek)
- Strategy selector (dropdown, opcjonalnie)
- "Generate" button z loading state
- "Regenerate" button (jeśli harmonogram już istnieje)

---

#### 5.2.4. `FamilyMemberCardComponent`

**Lokalizacja**: `libs/frontend/feature-family/src/lib/family-member-card/`

**Cel**: Prezentacja pojedynczego członka rodziny.

**Inputs**:
- `member`: FamilyMember

**Outputs**:
- `edit`: EventEmitter<FamilyMember>
- `delete`: EventEmitter<FamilyMember>

**Funkcjonalności**:
- Avatar (inicjały)
- Name, role badge, age
- Edit/delete icons

---

#### 5.2.5. `GoalCardComponent`

**Lokalizacja**: `libs/frontend/feature-goals/src/lib/goal-card/`

**Cel**: Prezentacja pojedynczego recurring goal.

**Inputs**:
- `goal`: RecurringGoal
- `memberName`: string

**Outputs**:
- `edit`: EventEmitter<RecurringGoal>
- `delete`: EventEmitter<RecurringGoal>

**Funkcjonalności**:
- Name, description (truncated)
- Frequency badge (e.g., "3x/week")
- Duration badge
- Time preferences pills
- Priority indicator
- Member name

---

#### 5.2.6. `CommitmentCardComponent`

**Lokalizacja**: `libs/frontend/feature-commitments/src/lib/commitment-card/`

**Cel**: Prezentacja pojedynczego fixed commitment.

**Inputs**:
- `commitment`: RecurringCommitment
- `memberName`: string

**Outputs**:
- `edit`: EventEmitter<RecurringCommitment>
- `delete`: EventEmitter<RecurringCommitment>

**Funkcjonalności**:
- Title
- Day badge
- Time range
- Block type badge + color
- "Fixed" indicator
- Member name (lub "Shared")

---

### 5.3. Store Services (Angular Signals)

#### 5.3.1. `FamilyStore`

**Lokalizacja**: `libs/frontend/data-access-family/src/lib/stores/family.store.ts`

**Signals**:
- `familyMembers`: Signal<FamilyMember[]>
- `loading`: Signal<boolean>
- `error`: Signal<string | null>

**Methods**:
- `loadFamilyMembers()`: Promise<void>
- `addFamilyMember(dto: CreateFamilyMemberDto)`: Promise<void>
- `updateFamilyMember(id: string, dto: UpdateFamilyMemberDto)`: Promise<void>
- `deleteFamilyMember(id: string)`: Promise<void>

**Dependencies**: `FamilyApiService` (HTTP calls)

---

#### 5.3.2. `GoalsStore`

**Lokalizacja**: `libs/frontend/data-access-goals/src/lib/stores/goals.store.ts`

**Signals**:
- `goals`: Signal<RecurringGoal[]>
- `loading`: Signal<boolean>
- `error`: Signal<string | null>

**Methods**:
- `loadGoals()`: Promise<void>
- `addGoal(dto: CreateGoalDto)`: Promise<void>
- `updateGoal(id: string, dto: UpdateGoalDto)`: Promise<void>
- `deleteGoal(id: string)`: Promise<void>

**Computed**:
- `goalsByMember`: Computed<Map<string, RecurringGoal[]>> (grupowanie według family member)

---

#### 5.3.3. `CommitmentsStore`

**Lokalizacja**: `libs/frontend/data-access-commitments/src/lib/stores/commitments.store.ts`

**Signals**:
- `commitments`: Signal<RecurringCommitment[]>
- `loading`: Signal<boolean>
- `error`: Signal<string | null>

**Methods**:
- `loadCommitments()`: Promise<void>
- `addCommitment(dto: CreateCommitmentDto)`: Promise<void>
- `updateCommitment(id: string, dto: UpdateCommitmentDto)`: Promise<void>
- `deleteCommitment(id: string)`: Promise<void>

**Computed**:
- `commitmentsByDay`: Computed<Map<number, RecurringCommitment[]>> (grupowanie według day of week)

---

#### 5.3.4. `ScheduleStore`

**Lokalizacja**: `libs/frontend/data-access-schedule/src/lib/stores/schedule.store.ts`

**Signals**:
- `currentSchedule`: Signal<WeeklySchedule | null>
- `timeBlocks`: Signal<TimeBlock[]>
- `loading`: Signal<boolean>
- `generating`: Signal<boolean> (osobny flag dla AI generation)
- `error`: Signal<string | null>

**Methods**:
- `loadSchedule(weekStartDate: string)`: Promise<void>
- `generateSchedule(dto: GenerateScheduleDto)`: Promise<void>
- `regenerateSchedule(scheduleId: string)`: Promise<void>
- `updateTimeBlock(blockId: string, dto: UpdateTimeBlockDto)`: Promise<void>
- `deleteTimeBlock(blockId: string)`: Promise<void>
- `submitFeedback(dto: FeedbackDto)`: Promise<void>

**Computed**:
- `summary`: Computed<ScheduleSummary> (total blocks, goals scheduled, conflicts)
- `blocksByDay`: Computed<Map<string, TimeBlock[]>> (grupowanie według dnia)

---

#### 5.3.5. `AuthStore`

**Lokalizacja**: `libs/frontend/data-access-auth/src/lib/stores/auth.store.ts`

**Signals**:
- `currentUser`: Signal<User | null>
- `isAuthenticated`: Signal<boolean>
- `loading`: Signal<boolean>

**Methods**:
- `login(email: string, password: string)`: Promise<void>
- `register(dto: RegisterDto)`: Promise<void>
- `logout()`: Promise<void>
- `loadCurrentUser()`: Promise<void>
- `updateProfile(dto: UpdateUserDto)`: Promise<void>
- `deleteAccount()`: Promise<void>

**Token management**: Przechowywanie JWT w localStorage, automatyczne dodawanie do HTTP headers (via HTTP interceptor).

---

### 5.4. Guards & Interceptors

#### 5.4.1. `AuthGuard`

**Cel**: Ochrona route'ów wymagających uwierzytelnienia.

**Logika**:
- Check `AuthStore.isAuthenticated()`
- Jeśli false, redirect do `/login`
- Jeśli true, allow navigation

---

#### 5.4.2. `AuthInterceptor`

**Cel**: Automatyczne dodawanie JWT do headers.

**Logika**:
- Pobierz token z localStorage
- Dodaj `Authorization: Bearer <token>` do każdego request (poza `/auth/*`)
- Handle 401 responses: logout + redirect do `/login`

---

#### 5.4.3. `ErrorInterceptor`

**Cel**: Globalna obsługa błędów HTTP.

**Logika**:
- Catch HTTP errors
- Parse error response
- Wyświetl toast notification (via ToastService)
- Propagate error do komponentu (jeśli potrzeba custom handling)

---

## 6. Stany aplikacji i obsługa błędów

### 6.1. Loading States

**Gdzie**: Każda operacja asynchroniczna (API call, AI generation).

**Implementacja**:
- Store signals: `loading`, `generating`
- UI: LoadingSpinnerComponent, skeleton screens, disabled buttons, progress bars

**Przykłady**:
- **Dashboard**: Loading spinner podczas ładowania harmonogramu
- **AI Generation**: Progress bar + status messages (5-15s)
- **Forms**: Disabled submit button + spinner podczas save

---

### 6.2. Error States

**Typy błędów**:
1. **Network errors**: Brak połączenia, timeout
2. **Validation errors** (400): Błędne dane z formularza
3. **Authentication errors** (401): Token wygasły, nieautoryzowany dostęp
4. **Authorization errors** (403): Brak uprawnień (shouldn't happen w MVP)
5. **Server errors** (500): Backend problem

**Obsługa**:
- **Global**: ErrorInterceptor wyświetla toast notification
- **Local**: Komponenty mogą wyświetlić ErrorBannerComponent z szczegółami
- **Retry**: Button "Try again" dla network errors
- **Fallback**: Graceful degradation (jeśli nie można załadować danych, pokaż cached/stare dane)

**Error messages** (user-friendly):
- 400: "Please check your input and try again."
- 401: "Your session has expired. Please log in again."
- 500: "Something went wrong on our end. Please try again later."
- Network: "Unable to connect. Please check your internet connection."
- Timeout: "This is taking longer than expected. Please try again."

---

### 6.3. Empty States

**Gdzie**: Listy bez danych (family members, goals, commitments, schedule).

**Implementacja**: EmptyStateComponent z CTA.

**Przykłady**:
- **Dashboard (no schedule)**: "No schedule yet. Click 'Generate' to create your first week!"
- **Family (no members)**: "Add your first family member to get started."
- **Goals (no goals)**: "Create your first goal to let AI schedule it for you."
- **Commitments (no commitments)**: "Define your fixed blocks (e.g., work hours) so AI respects them."

---

### 6.4. Success States

**Gdzie**: Po udanej operacji (save, delete, generate).

**Implementacja**: Toast notification (success variant).

**Przykłady**:
- "Family member added successfully!"
- "Goal updated!"
- "Schedule generated successfully!"
- "Time block deleted."

---

## 7. Responsive Design (Przyszłość - Phase 2+)

**MVP**: Desktop-first, minimalna responsywność.

**Phase 2**:
- Mobile-friendly navigation (hamburger menu)
- Calendar view: vertical scrolling na mobile (jeden dzień na raz)
- Touch-friendly controls (większe tap targets)
- Responsive forms (stack fields vertically)

---

## 8. Dostępność (Accessibility)

**Wymagania WCAG 2.1 AA**:

1. **Keyboard Navigation**:
   - Wszystkie interaktywne elementy dostępne via Tab
   - Enter/Space do aktywacji
   - Escape do zamykania modali
   - Arrow keys do nawigacji w listach (opcjonalnie)

2. **Screen Reader Support**:
   - Semantic HTML (header, nav, main, section, article)
   - ARIA labels na wszystkich kontrolkach
   - ARIA live regions dla dynamicznych zmian (toast notifications, loading messages)
   - ARIA expanded/hidden dla collapsible sections

3. **Focus Management**:
   - Widoczny focus indicator (outline)
   - Focus trap w modalach
   - Auto-focus na pierwszym polu w formularzu
   - Return focus po zamknięciu modalu

4. **Color Contrast**:
   - Minimum 4.5:1 dla tekstu
   - Minimum 3:1 dla UI elementów
   - Nie polegać tylko na kolorze (ikony + tekst)

5. **Alt Text**:
   - Wszystkie ikony mają aria-label lub title
   - Dekoracyjne ikony: aria-hidden="true"

---

## 9. Performance

**Optymalizacje**:

1. **Lazy Loading**:
   - Route-based lazy loading dla feature modules
   - Defer loading dla heavy components (charts, calendar)

2. **Change Detection**:
   - OnPush strategy dla wszystkich komponentów
   - Angular Signals (automatyczny OnPush)

3. **Bundle Size**:
   - Tree-shaking (Angular default)
   - Minimize third-party dependencies
   - Analyze bundle size (webpack-bundle-analyzer)

4. **API Calls**:
   - Caching w store'ach (don't refetch jeśli dane już są)
   - Debouncing dla search/filter inputs
   - Optimistic updates (update UI immediately, rollback on error)

5. **Images/Icons**:
   - SVG icons (inline lub sprite)
   - Lazy load images (jeśli będą używane)

---

## 10. Bezpieczeństwo

**Frontend Security Measures**:

1. **Authentication**:
   - JWT przechowywany w localStorage (lub httpOnly cookies w Phase 2)
   - Token expiry handling (auto-logout)
   - Refresh token mechanizm (Phase 2)

2. **Authorization**:
   - AuthGuard na protected routes
   - API zwraca tylko dane użytkownika (userId check backend-side)

3. **Input Validation**:
   - Client-side validation jako pierwsza linia obrony
   - Server-side validation jako source of truth
   - Sanitization (Angular domyślnie sanitizuje)

4. **XSS Protection**:
   - Angular DomSanitizer dla dynamic content
   - Nie używać innerHTML bez sanitization
   - CSP headers (backend config)

5. **HTTPS**:
   - Wyłącznie HTTPS w production
   - HSTS headers

6. **Secrets**:
   - Brak API keys w kodzie frontend
   - Environment variables dla konfiguracji

---

## 11. Mapowanie historyjek użytkownika na widoki

| User Story ID | Tytuł | Główne widoki | Komponenty |
|--------------|-------|---------------|------------|
| US-001 | Rejestracja konta | `/register` | RegisterFormComponent, AuthLayoutComponent |
| US-002 | Logowanie do aplikacji | `/login` | LoginFormComponent, AuthLayoutComponent |
| US-003 | Generowanie nadchodzącego tygodnia przy użyciu AI | `/dashboard` | DashboardComponent, WeeklyCalendarComponent, ScheduleGeneratorControlsComponent, TimeBlockCardComponent |
| US-004 | Przegląd i zatwierdzanie propozycji harmonogramów | `/dashboard` | WeeklyCalendarComponent, ScheduleSummaryComponent, feedback controls w TimeBlockCardComponent |
| US-005 | Edycja harmonogramów | `/dashboard`, edit modal | TimeBlockEditComponent, TimeBlockCardComponent (edit action) |
| US-006 | Bezpieczny dostęp i autoryzacja | Wszystkie protected routes | AuthGuard, AuthInterceptor, AuthStore |

**Dodatkowe funkcjonalności z PRD**:

| Wymaganie | Widoki | Komponenty |
|-----------|--------|------------|
| Wprowadzenie fixed blocks | `/commitments` | CommitmentsListComponent, CommitmentFormComponent, CommitmentCardComponent |
| Definiowanie recurring goals | `/goals` | GoalsListComponent, GoalFormComponent, GoalCardComponent |
| Zarządzanie rodziną | `/family` | FamilyListComponent, FamilyFormComponent, FamilyMemberCardComponent |
| Feedback (thumbs up/down) | `/dashboard` (w TimeBlockCardComponent) | Feedback controls, FeedbackService |
| Statystyki generowania | `/stats` lub sekcja w `/dashboard` | UsageStatsComponent, ScheduleSummaryComponent |
| Usunięcie konta (GDPR) | `/profile` | ProfileComponent, DangerZoneComponent, confirmation dialog |

---

## 12. Mapowanie wymagań na elementy UI

### 12.1. Automatyczne generowanie planów tygodnia

**Wymaganie**: Sugeruje aktywności uwzględniające lokalizację, pogodę, wiek dzieci i upodobania.

**Elementy UI**:
- `ScheduleGeneratorControlsComponent`: Przycisk "Generate Week Schedule"
- `WeeklyCalendarComponent`: Wyświetlanie wygenerowanych bloków
- `ScheduleSummaryComponent`: Podsumowanie (ile bloków, ile goalów zaplanowano)
- Loading state z progress indicator (5-15s)
- Success/error toast notifications

---

### 12.2. Edycja planu dzień po dniu

**Wymaganie**: Użytkownik może modyfikować dowolny blok.

**Elementy UI**:
- `TimeBlockCardComponent`: Edit icon/button
- `TimeBlockEditComponent`: Modal lub dedykowana strona z formularzem edycji
- Validation w formularzu (time range, conflict detection)
- Save/Cancel/Delete buttons
- Toast notification po zapisaniu

---

### 12.3. Podstawowy system uwierzytelniania

**Wymaganie**: Rejestracja/logowanie, usunięcie konta.

**Elementy UI**:
- `LoginFormComponent`: Email, password, submit
- `RegisterFormComponent`: Email, password, displayName (optional), submit
- `ProfileComponent`: Display name edit, delete account
- `AuthGuard`: Ochrona route'ów
- `AuthInterceptor`: Automatyczne dodawanie JWT
- Logout button w nawigacji

---

### 12.4. Statystyki generowania planów

**Wymaganie**: Śledzenie, ile sugestii wygenerowano i ile zaakceptowano (feedback thumbs up/down).

**Elementy UI**:
- `UsageStatsComponent`: Wykresy, metryki (total generated, acceptance rate)
- `ScheduleSummaryComponent`: Podsumowanie dla bieżącego tygodnia
- Thumbs up/down buttons w `TimeBlockCardComponent`
- `FeedbackService`: Wysyłanie feedbacku do API

---

### 12.5. Wymagania prawne (GDPR)

**Wymaganie**: Prawo dostępu/usunięcia danych.

**Elementy UI**:
- `ProfileComponent`: "Delete Account" button z confirmation dialog
- DangerZoneComponent: Ostrzeżenie, że operacja jest nieodwracalna
- Confirmation dialog: Two-step confirmation (checkbox + button)
- API call: `DELETE /user` → cascade delete wszystkich danych

---

## 13. Rozwiązania dla punktów bólu użytkownika

### 13.1. Punkt bólu: "Brakuje nam jednego miejsca, w którym połączymy wszystkie cele w jednym tygodniowym planie"

**Rozwiązanie UI**:
- **Dashboard jako centralne miejsce**: Wszystko widoczne na jednym ekranie – aktualny tydzień, wszystkie bloki, wszystkie członkowie rodziny
- **Unified calendar view**: Wszystkie cele, commitments i shared activities w jednym kalendarzu
- **Filter by family member**: Szybki podgląd harmonogramu dla każdej osoby z osobna
- **AI integration**: Generowanie harmonogramu automatycznie łączy wszystkie cele i commitments

---

### 13.2. Punkt bólu: "Szybko znajdziemy aktywności i posiłki dopasowane do rodziny"

**Rozwiązanie UI** (Phase 2 - Meal Planner & Activity Finder):
- **Suggestions views**: Dedykowane widoki `/activities` i `/meals` (Non-MVP)
- **Contextual AI**: AI uwzględnia wiek dzieci, preferencje (z family members), pogodę
- **Quick add**: Możliwość dodania zasugerowanej aktywności/posiłku do harmonogramu jednym klikiem

**MVP workaround**:
- Recurring goals mogą obejmować "Family Activity Time" jako placeholder
- AI może sugerować ogólne bloki czasu na aktywności rodzinne

---

### 13.3. Punkt bólu: "Zbalansujemy priorytety: pracę, rodzinę, hobby i relacje"

**Rozwiązanie UI**:
- **Fixed commitments**: Użytkownik definiuje work hours jako non-negotiable → AI nigdy ich nie nadpisze
- **Recurring goals z priorytetami**: Użytkownik ustawia priority (1-10) dla każdego celu → AI bierze to pod uwagę
- **Visual balance**: ScheduleSummaryComponent pokazuje distribution bloków (ile work, ile activity, ile family time)
- **Feedback loop**: Thumbs up/down pozwala użytkownikowi komunikować, czy balans jest OK
- **Family member filtering**: Szybki podgląd, czy każdy członek rodziny ma zbalansowany harmonogram

---

### 13.4. Punkt bólu: "AI tworzy nierealistyczne plany" (z sekcji Ryzyka)

**Rozwiązanie UI**:
- **Edycja ręczna**: Każdy blok można edytować/usunąć
- **Conflict warnings**: Jeśli AI przypadkowo stworzy conflict, UI wyświetla ostrzeżenie z listą konfliktów
- **Regenerate z feedbackiem**: Thumbs down na bloku + komentarz → użytkownik może regenerować z uwzględnieniem feedbacku (Phase 2)
- **Validation layer**: Backend waliduje przed zapisem, frontend pokazuje błędy przed submitem

---

## 14. Diagram przepływu danych

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                       │
│  (Components: Dashboard, Family, Goals, Commitments)    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ User Actions (clicks, form submits)
                  ↓
┌─────────────────────────────────────────────────────────┐
│                  STORES (Angular Signals)               │
│  - FamilyStore                                          │
│  - GoalsStore                                           │
│  - CommitmentsStore                                     │
│  - ScheduleStore                                        │
│  - AuthStore                                            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ API Calls (HTTP)
                  ↓
┌─────────────────────────────────────────────────────────┐
│                  API SERVICES                           │
│  - FamilyApiService                                     │
│  - GoalsApiService                                      │
│  - CommitmentsApiService                                │
│  - ScheduleApiService                                   │
│  - AuthApiService                                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ HTTP Requests (+ JWT in headers)
                  ↓
┌─────────────────────────────────────────────────────────┐
│                  BACKEND API                            │
│  (NestJS REST endpoints)                                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ OpenAI calls (for schedule generation)
                  ↓
┌─────────────────────────────────────────────────────────┐
│                  OpenAI API                             │
│  (GPT-4 Turbo for schedule generation)                  │
└─────────────────────────────────────────────────────────┘
```

**Data Flow dla Schedule Generation**:
1. User kliknie "Generate" → DashboardComponent
2. DashboardComponent wywołuje `ScheduleStore.generateSchedule(dto)`
3. ScheduleStore wywołuje `ScheduleApiService.generate(dto)`
4. ScheduleApiService wysyła POST `/api/v1/schedule-generator/generate`
5. Backend:
   - Ładuje family members, goals, commitments
   - Wywołuje OpenAI API
   - Persists schedule + time blocks
   - Zwraca response z scheduleId, summary, timeBlocks
6. ScheduleApiService zwraca dane do ScheduleStore
7. ScheduleStore aktualizuje signals: `currentSchedule`, `timeBlocks`, `loading = false`
8. Components (WeeklyCalendarComponent, etc.) reactively update (Angular Signals auto-detect changes)
9. User widzi wygenerowany harmonogram

---

## 15. Kolejne kroki implementacyjne

### Faza 1: Podstawy (Week 1-2)

1. **Setup projektu**:
   - Nx monorepo z Angular 20+
   - Utworzenie struktury bibliotek (feature, data-access, ui-shared)
   - Konfiguracja routing, environment variables

2. **Uwierzytelnianie**:
   - `feature-auth`: LoginFormComponent, RegisterFormComponent
   - `data-access-auth`: AuthStore, AuthApiService
   - AuthGuard, AuthInterceptor
   - Podstawowy layout (AuthLayoutComponent)

3. **Główna nawigacja**:
   - Sidebar/TopNav component
   - Routing setup dla protected routes
   - ProfileComponent (basic)

---

### Faza 2: Core Features (Week 3-4)

4. **Family Management**:
   - `feature-family`: FamilyListComponent, FamilyFormComponent, FamilyMemberCardComponent
   - `data-access-family`: FamilyStore, FamilyApiService
   - CRUD operations

5. **Recurring Goals**:
   - `feature-goals`: GoalsListComponent, GoalFormComponent, GoalCardComponent
   - `data-access-goals`: GoalsStore, GoalsApiService
   - CRUD operations

6. **Fixed Commitments**:
   - `feature-commitments`: CommitmentsListComponent, CommitmentFormComponent, CommitmentCardComponent
   - `data-access-commitments`: CommitmentsStore, CommitmentsApiService
   - CRUD operations

---

### Faza 3: AI Schedule Generation (Week 5-6)

7. **Dashboard & Calendar**:
   - DashboardComponent
   - WeeklyCalendarComponent + sub-components (DayColumnComponent, TimeBlockCardComponent)
   - `data-access-schedule`: ScheduleStore, ScheduleApiService

8. **AI Generation**:
   - ScheduleGeneratorControlsComponent
   - Integration z backend `/schedule-generator/generate`
   - Loading states, error handling
   - ScheduleSummaryComponent

9. **Editing & Feedback**:
   - TimeBlockEditComponent (modal)
   - Feedback controls (thumbs up/down)
   - Delete time block

---

### Faza 4: Polish & Testing (Week 7-8)

10. **UI Shared Components**:
    - ButtonComponent, FormFieldComponent, LoadingSpinnerComponent
    - ToastNotificationComponent + ToastService
    - ConfirmDialogComponent + ConfirmDialogService
    - BadgeComponent, EmptyStateComponent, ErrorBannerComponent

11. **Error Handling**:
    - ErrorInterceptor
    - Globalne error states, retry mechanisms
    - Validation w formularzach

12. **Accessibility**:
    - ARIA labels, keyboard navigation
    - Focus management, screen reader testing

13. **Testing**:
    - Unit tests (Jest) dla stores, services
    - Component tests (no TestBed)
    - E2E tests (Playwright) dla main user journeys

---

## 16. Technologie i biblioteki

**Core**:
- Angular 20+ (standalone components)
- TypeScript
- RxJS (minimal, głównie Signals)
- SCSS

**State Management**:
- Angular Signals (built-in)

**Forms**:
- Reactive Forms (Angular built-in)

**HTTP**:
- HttpClient (Angular built-in)

**Routing**:
- Angular Router (lazy loading)

**UI Components** (jeśli potrzebne third-party):
- **Opcja 1**: Custom components (zalecane dla MVP, pełna kontrola)
- **Opcja 2**: Angular Material (jeśli chcemy przyspieszyć, gotowe komponenty)
- **Opcja 3**: PrimeNG (alternatywa)

**Date/Time**:
- `date-fns` (lightweight) lub native Date API

**Icons**:
- SVG inline lub sprite
- Opcjonalnie: `@angular/material/icon` lub `lucide-angular`

**Charts** (dla stats view):
- `chart.js` + `ng2-charts` (jeśli stats w MVP)
- Lub proste custom charts

**Testing**:
- Jest (unit tests)
- Playwright (E2E tests)

---

## 17. Podsumowanie

Architektura UI Family Life Planner została zaprojektowana z myślą o:

1. **Modularności**: Wyraźny podział na feature libraries i data-access libraries zgodnie z monorepo structure
2. **Skalowalności**: Angular Signals dla reaktywności, lazy loading dla performance
3. **User Experience**: Intuicyjna nawigacja, wyraźne stany (loading, error, empty, success), contextual help
4. **Dostępności**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support
5. **Bezpieczeństwie**: AuthGuard, JWT handling, input validation, HTTPS
6. **Maintainability**: Shared components, consistent design system, clear data flow

**Główne user journeys**:
- **Onboarding**: Register → Setup family/goals/commitments → Generate schedule
- **Daily use**: Login → View dashboard → Filter/edit blocks → Feedback
- **Weekly routine**: Generate next week → Review → Minor edits → Feedback

**Kluczowe widoki**:
- `/dashboard`: Centralne miejsce, weekly calendar, AI generation
- `/family`, `/goals`, `/commitments`: CRUD dla danych wejściowych do AI
- `/profile`: Zarządzanie kontem

**Next steps**: Implementacja według faz (Auth → Core Features → AI Generation → Polish), z ciągłym testowaniem i feedbackiem użytkowników.

---

**Dokument przygotowany**: 13 stycznia 2026  
**Wersja**: 1.1  
**Status**: Gotowy do implementacji

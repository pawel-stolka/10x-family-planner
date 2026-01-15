# Architektura UI dla Family Life Planner

**Data utworzenia**: 2026-01-14  
**Status**: ✅ Zatwierdzona do implementacji  
**Wersja**: 1.0

---

## 1. Przegląd struktury UI

Family Life Planner to desktopowa aplikacja webowa zaprojektowana w architekturze **SPA (Single Page Application)** z wykorzystaniem Angular 20+. Aplikacja składa się z trzech głównych obszarów funkcjonalnych:

### 1.1 Obszary funkcjonalne

**🔒 Publiczny obszar (Unauthenticated)**
- Landing page z informacją o produkcie
- Strona logowania
- Strona rejestracji

**👤 Obszar użytkownika (Authenticated)**
- Dashboard (centrum kontrolne)
- Konfiguracja rodziny (Family Setup)
- Zarządzanie celami (Recurring Goals)
- Główny widok tygodnia (Week Schedule Grid)
- Generator harmonogramów AI
- Ustawienia profilu

**🎯 Komponenty współdzielone**
- Nawigacja główna
- Modale
- Notyfikacje/alerty
- Loading states
- Error boundaries

### 1.2 Filozofia projektowa

- **Desktop-first**: Optymalizacja dla ekranów ≥1280px
- **Grid-centric**: Kalendarz tygodniowy jako główny interfejs
- **AI-assisted**: Generowanie automatyczne z możliwością ręcznej edycji
- **Member-focused**: Kolorowe rozróżnienie członków rodziny
- **Performance-optimized**: Angular signals, OnPush, lazy rendering
- **Accessible**: WCAG 2.1 Level AA, keyboard navigation, screen readers

---

## 2. Lista widoków

### 2.1 Landing View
**Ścieżka**: `/`  
**Dostęp**: Publiczny (niezalogowani)

#### Główny cel
Przedstawienie wartości produktu i zachęcenie do rejestracji.

#### Kluczowe informacje
- Hero section z opisem problemu i rozwiązania
- Przykładowy screenshot widoku tygodnia
- Kluczowe funkcje (AI generation, family coordination, conflict detection)
- Call-to-action: "Zacznij planować" → Register
- Link do logowania

#### Kluczowe komponenty
- `HeroSectionComponent`
- `FeatureListComponent`
- `CTAButtonsComponent`

#### UX, dostępność, bezpieczeństwo
- **UX**: Jasny komunikat wartości, wizualna prezentacja funkcji
- **Dostępność**: Semantyczne headings (h1, h2), alt text dla obrazów
- **Bezpieczeństwo**: Redirect zalogowanych użytkowników do Dashboard

---

### 2.2 Register View
**Ścieżka**: `/auth/register`  
**Dostęp**: Publiczny (niezalogowani)

#### Główny cel
Umożliwienie rejestracji nowego konta użytkownika.

#### Kluczowe informacje
- Formularz rejestracyjny:
  - Email (wymagany, walidacja formatu)
  - Hasło (wymagany, min. 8 znaków, walidacja siły)
  - Potwierdzenie hasła (wymagany, musi być identyczne)
  - Imię (opcjonalne)
- Checkbox zgody na regulamin/RODO (wymagany)
- Link do strony logowania
- Komunikaty błędów walidacji inline

#### Kluczowe komponenty
- `RegisterFormComponent`
- `PasswordStrengthIndicatorComponent`
- `FormErrorMessageComponent`

#### UX, dostępność, bezpieczeństwo
- **UX**: 
  - Real-time walidacja formularza
  - Widoczność/ukrycie hasła (toggle icon)
  - Wskaźnik siły hasła
  - Auto-focus na pierwszym polu
- **Dostępność**: 
  - Label dla każdego pola
  - ARIA error messages
  - Keyboard navigation (Tab order)
  - Screen reader announcements dla błędów
- **Bezpieczeństwo**: 
  - HTTPS only
  - Walidacja po stronie frontend i backend
  - Rate limiting (zapobieganie spam registrations)
  - Hasło nigdy nie jest logowane
  - Wywołanie: `POST /v1/auth/register`

---

### 2.3 Login View
**Ścieżka**: `/auth/login`  
**Dostęp**: Publiczny (niezalogowani)

#### Główny cel
Uwierzytelnienie użytkownika i uzyskanie JWT token.

#### Kluczowe informacje
- Formularz logowania:
  - Email (wymagany)
  - Hasło (wymagany)
- Checkbox "Zapamiętaj mnie" (opcjonalny)
- Link do rejestracji
- Komunikaty błędów (np. "Nieprawidłowe dane logowania")

#### Kluczowe komponenty
- `LoginFormComponent`
- `FormErrorMessageComponent`

#### UX, dostępność, bezpieczeństwo
- **UX**: 
  - Auto-focus na email field
  - Enter key submits form
  - Loading indicator podczas logowania
  - Przekierowanie do Dashboard po sukcesie
- **Dostępność**: 
  - Labels i ARIA attributes
  - Keyboard accessible
  - Error announcements
- **Bezpieczeństwo**: 
  - JWT token przechowywany w httpOnly cookie (preferowane) lub localStorage
  - Automatyczne wylogowanie po wygaśnięciu tokenu
  - Rate limiting (zapobieganie brute force)
  - Wywołanie: `POST /v1/auth/login`

---

### 2.4 Dashboard View
**Ścieżka**: `/dashboard`  
**Dostęp**: Zalogowani użytkownicy

#### Główny cel
Centrum kontrolne - przegląd statusu i szybki dostęp do głównych funkcji.

#### Kluczowe informacje
- Welcome message z imieniem użytkownika
- Quick stats:
  - Liczba członków rodziny
  - Liczba recurring goals
  - Liczba harmonogramów w bazie
  - Statystyki generowania AI (acceptance rate)
- Quick actions (karty/przyciski):
  - "Zobacz aktualny tydzień" → Week Schedule View
  - "Wygeneruj nowy tydzień" → Schedule Generator
  - "Zarządzaj rodziną" → Family Setup
  - "Zarządzaj celami" → Recurring Goals
- Sekcja "Co dalej?" (onboarding steps):
  - ✅ Konto utworzone
  - ⏳ Dodaj członków rodziny (jeśli empty)
  - ⏳ Zdefiniuj cele (jeśli empty)
  - ⏳ Wygeneruj pierwszy tydzień

#### Kluczowe komponenty
- `DashboardHeaderComponent`
- `QuickStatsCardComponent`
- `QuickActionsGridComponent`
- `OnboardingChecklistComponent`

#### UX, dostępność, bezpieczeństwo
- **UX**: 
  - Progressive disclosure (onboarding hints dla nowych użytkowników)
  - Loading skeleton podczas pobierania danych
  - Empty states z call-to-action
- **Dostępność**: 
  - Heading hierarchy
  - Clickable cards z keyboard focus
  - ARIA landmarks (main, navigation)
- **Bezpieczeństwo**: 
  - Auth guard (wymaga zalogowania)
  - Wywołania: `GET /v1/user`, `GET /v1/family-members`, `GET /v1/recurring-goals`, `GET /v1/usage-stats`

---

### 2.5 Family Setup View
**Ścieżka**: `/family`  
**Dostęp**: Zalogowani użytkownicy

#### Główny cel
Zarządzanie listą członków rodziny (CRUD operations).

#### Kluczowe informacje
- Header z licznikiem członków
- Lista członków rodziny (cards/table):
  - Color square (kolor przypisany)
  - Initial badge (inicjały)
  - Name
  - Role badge (USER/SPOUSE/CHILD)
  - Age (dla dzieci)
  - Akcje: Edit, Delete
- Przycisk "Dodaj członka rodziny" → otwiera modal/form
- Empty state (jeśli brak członków): "Dodaj pierwszego członka rodziny"

#### Kluczowe komponenty
- `FamilyMemberListComponent`
- `FamilyMemberCardComponent`
- `FamilyMemberFormModalComponent` (add/edit)
- `ConfirmDeleteModalComponent`

#### Formularz członka (modal):
- Name (wymagany, string)
- Role (wymagany, dropdown: USER/SPOUSE/CHILD)
- Age (wymagany dla CHILD, number)
- Color (opcjonalny, color picker - auto-assigned jeśli puste)
- Initial (opcjonalny, 1-2 znaki - auto-generated jeśli puste)
- Preferences (opcjonalny, JSON - dla advanced użytkowników)

#### UX, dostępność, bezpieczeństwo
- **UX**: 
  - Visual preview koloru i inicjału podczas edycji
  - Auto-generate color/initial z name
  - Confirmacja przed usunięciem
  - Soft-delete (możliwość przywrócenia przez admin)
  - Toast notification po zapisie/usunięciu
- **Dostępność**: 
  - Color picker z keyboard support
  - Screen reader friendly labels
  - Focus management w modalach
- **Bezpieczeństwo**: 
  - Walidacja unikalności imion w ramach rodziny
  - Nie można usunąć użytkownika będącego właścicielem (USER role)
  - Wywołania: `GET/POST/PATCH/DELETE /v1/family-members`

---

### 2.6 Recurring Goals Setup View
**Ścieżka**: `/goals`  
**Dostęp**: Zalogowani użytkownicy

#### Główny cel
Zarządzanie celami powtarzającymi się (fitness, hobby, relacje, itp.) dla członków rodziny.

#### Kluczowe informacje
- Header z licznikiem celów
- Filtr: "Wszyscy członkowie" / dropdown z członkami
- Sortowanie: "Według priorytetu" / "Według częstotliwości"
- Lista celów (cards/table):
  - Member badge (kolor + inicjał)
  - Goal name
  - Description (skrócony)
  - Frequency badge (np. "3x/tydzień")
  - Duration badge (np. "60 min")
  - Preferred time (np. "Rano 06:00-09:00")
  - Priority indicator (⭐⭐⭐)
  - Akcje: Edit, Delete
- Przycisk "Dodaj cel" → otwiera modal/form

#### Kluczowe komponenty
- `RecurringGoalListComponent`
- `RecurringGoalCardComponent`
- `RecurringGoalFormModalComponent` (add/edit)
- `MemberFilterComponent`
- `ConfirmDeleteModalComponent`

#### Formularz celu (modal):
- Family Member (wymagany, dropdown z członkami)
- Goal Name (wymagany, string - np. "Fitness", "Quality time z żoną")
- Description (opcjonalny, textarea)
- Frequency per Week (wymagany, number >0 - np. 3)
- Preferred Duration (wymagany, number >0 w minutach - np. 60)
- Preferred Time of Day (opcjonalny, time range - np. "06:00-09:00")
- Priority (wymagany, 1-5 scale)
- Rules (opcjonalny, JSON - dla advanced users, np. RRULE)

#### UX, dostępność, bezpieczeństwo
- **UX**: 
  - Grouped by member (visual grouping)
  - Priority sorting jako default
  - Empty state per member: "Brak celów dla [member]"
  - Visual examples w tooltipach (np. "Frequency: ile razy w tygodniu chcesz to robić?")
  - Toast notifications
- **Dostępność**: 
  - Label dla wszystkich pól
  - Number inputs z keyboard arrows
  - Time picker accessible
- **Bezpieczeństwo**: 
  - Walidacja: frequencyPerWeek >0, duration >0
  - Nie można dodać celu dla usuniętego członka
  - Wywołania: `GET/POST/PATCH/DELETE /v1/recurring-goals`

---

### 2.7 Week Schedule View (GŁÓWNY WIDOK)
**Ścieżka**: `/schedule` lub `/schedule/week/:weekStartDate`  
**Dostęp**: Zalogowani użytkownicy

#### Główny cel
Wyświetlenie pełnego tygodniowego harmonogramu w formacie grid calendar z możliwością filtrowania, edycji i szczegółowego przeglądania aktywności.

#### Kluczowe informacje
- **Header section:**
  - Week title: "Tydzień 13-19 stycznia 2026"
  - Week navigation: "< Poprzedni tydzień" | "Dzisiaj" | "Następny tydzień >"
  - Action buttons: "Wygeneruj ponownie" | "Eksportuj" (future)
  
- **Filter bar (sticky):**
  - Przyciski filtrów: [Wszyscy] [tata] [mama] [hania] [małgosia] [monika] [👨‍👩‍👧‍👦 Wspólne]
  - Active filter podświetlony
  
- **Legend (sticky):**
  - Horizontal strip: ■ tata  ■ mama  ■ hania  ■ małgosia  ■ monika  ▨ Wspólne
  
- **Grid calendar:**
  - Time column (sticky left): dynamiczny zakres godzin (np. 06:00-22:00)
  - 7 day columns (Mon-Sun): równomiernie rozłożone
  - Today column: podświetlona (inny background)
  - Cells: 1-godzinne sloty
  - Activities in cells:
    - Background color (member color)
    - Initial badge (T, M, H, itd.)
    - Emoji icon (💼 💪 🍽️ 📌)
    - Title (truncated with ellipsis)
    - Proportional height (dla aktywności <1h)
    - Shared activities: diagonal stripes pattern
    - Conflicts: czerwona ramka 3px + ⚠️ icon
  
- **Empty state:**
  - Grid pokazany z pustymi komórkami
  - Central message: "Brak harmonogramu na ten tydzień. [Wygeneruj harmonogram]"
  
- **Loading state:**
  - Skeleton grid z pulsującymi komórkami

#### Kluczowe komponenty
- `WeekScheduleContainerComponent` (smart component)
- `WeekGridComponent` (presentation, główny grid)
- `WeekHeaderComponent` (tytuł + nawigacja)
- `FilterBarComponent` (filtry członków)
- `LegendComponent` (legenda kolorów)
- `TimeColumnComponent` (kolumna z godzinami)
- `DayHeaderComponent` (nagłówek dnia)
- `GridCellComponent` (pojedyncza komórka)
- `ActivityCellComponent` (aktywność w komórce)
- `ConflictIndicatorComponent` (wskaźnik konfliktu)
- `EmptyWeekStateComponent`
- `GridLoadingSkeletonComponent`

#### Interakcje użytkownika
1. **Hover na aktywności:**
   - Wyświetlenie tooltipa z pełnymi szczegółami:
     - 🍽️ Family Dinner
     - ⏰ 18:00 - 19:00 (1h)
     - 👤 tata, mama, hania, małgosia
     - 📝 Pizza night with the family!
     - 🏷️ MEAL • Fixed
     - 💡 Kliknij dla pełnych szczegółów

2. **Kliknięcie aktywności:**
   - Otwarcie modalu Activity Details (patrz 2.9)

3. **Kliknięcie filtru:**
   - Aplikacja filtra:
     - Selected member: opacity 1.0
     - Others: opacity 0.3 + grayscale(0.5)
   - Fade animation 200ms
   - Debounced 150ms

4. **Nawigacja tygodniowa:**
   - Poprzedni/Następny tydzień: zmiana daty + reload danych
   - "Dzisiaj": skok do bieżącego tygodnia

5. **Kliknięcie "Wygeneruj ponownie":**
   - Przekierowanie do Schedule Generator z parametrem `weekStartDate`
   - Confirmation dialog: "Czy na pewno? Aktualne aktywności zostaną nadpisane."

#### UX, dostępność, bezpieczeństwo
- **UX**: 
  - Cały tydzień widoczny bez scrollowania (optymalizacja zakresu godzin)
  - Smooth animations (fade, scale on hover)
  - Performance: <100ms initial render, <50ms filtering
  - Visual hierarchy: sticky elements z-index
  - Empty slots jako "wolny czas" - jasne tło
  - Konflikty natychmiast widoczne
- **Dostępność**: 
  - ARIA grid role
  - Keyboard navigation: Arrow keys dla poruszania się po grid
  - Tab focus na aktywności
  - Enter/Space otwiera modal
  - Screen reader announcements dla filtrów
  - Color contrast >4.5:1
- **Bezpieczeństwo**: 
  - Tylko własne harmonogramy
  - Wywołania: `GET /v1/weekly-schedules?view=grid&weekStartDate=2026-01-13`

---

### 2.8 Schedule Generator View
**Ścieżka**: `/schedule/generate` lub `/schedule/generate?week=2026-01-13`  
**Dostęp**: Zalogowani użytkownicy

#### Główny cel
Formularz konfiguracji i generowanie tygodniowego harmonogramu przez AI z możliwością preview przed zapisem.

#### Kluczowe informacje
- **Header:**
  - Tytuł: "Generator harmonogramu AI"
  - Opis: "Wybierz tydzień i pozwól AI zaplanować Twój czas na podstawie zdefiniowanych celów i zobowiązań."

- **Form Section:**
  - Week Start Date (date picker, default: następny poniedziałek)
  - Strategy (opcjonalny, dropdown):
    - "Balanced" (default) - równowaga między celami
    - "Work-focused" - priorytet pracy
    - "Family-focused" - priorytet rodziny
    - "Health-focused" - priorytet zdrowia/fitness
  - Checkbox: "Uwzględnij istniejące Fixed Blocks" (checked by default)
  
- **Preview Section (po kliknięciu "Podgląd"):**
  - Miniaturowy grid calendar z wygenerowanym harmonogramem
  - Summary card:
    - Liczba aktywności: X
    - Pokrycie celów: Y/Z celów zaplanowanych
    - Wykryte konflikty: N (jeśli >0, lista konfliktów)
  - Akcje:
    - "Zaakceptuj i zapisz" (primary button)
    - "Regeneruj" (secondary button)
    - "Anuluj" (text button)

- **Loading State (podczas generowania):**
  - Loader z komunikatem: "AI generuje harmonogram... (może potrwać do 15 sekund)"
  - Progress indicator (optional)

- **Error State:**
  - Komunikat błędu: "Nie udało się wygenerować harmonogramu. [Spróbuj ponownie]"
  - Przyczyna błędu (jeśli dostępna)

#### Kluczowe komponenty
- `ScheduleGeneratorFormComponent`
- `GeneratorConfigFormComponent`
- `SchedulePreviewComponent` (mini grid)
- `GenerationSummaryCardComponent`
- `GenerationLoadingComponent`
- `GenerationErrorComponent`

#### Workflow:
1. Użytkownik wypełnia formularz
2. Klika "Podgląd" → wywołanie `POST /v1/schedule-generator/preview`
3. Backend zwraca draft harmonogramu (nie zapisuje do DB)
4. Wyświetlenie preview + summary
5. Użytkownik może:
   - "Zaakceptuj i zapisz" → `POST /v1/schedule-generator` → redirect do Week Schedule View
   - "Regeneruj" → ponowne wywołanie z nowymi parametrami
   - "Anuluj" → powrót do poprzedniego widoku

#### UX, dostępność, bezpieczeństwo
- **UX**: 
  - Two-step process: Preview przed save (zapobiega niechcianym nadpisaniom)
  - Validation: nie można generować dla przeszłych tygodni
  - Confirmation dialog przy "Zaakceptuj" jeśli harmonogram już istnieje
  - Toast notification po sukcesie
  - Timeout handling (>15s → error)
- **Dostępność**: 
  - Date picker keyboard accessible
  - Loading state announced
  - Error messages announced
- **Bezpieczeństwo**: 
  - Rate limiting: max 5 requests/min dla AI endpoints
  - Walidacja daty po stronie backend
  - Wywołania: `POST /v1/schedule-generator/preview`, `POST /v1/schedule-generator`

---

### 2.9 Activity Details Modal
**Typ**: Modal dialog (overlay)  
**Trigger**: Kliknięcie aktywności w Week Schedule View

#### Główny cel
Wyświetlenie pełnych szczegółów aktywności z możliwością edycji lub usunięcia.

#### Kluczowe informacje
- **Header:**
  - Type emoji + title (np. "🍽️ Family Dinner")
  - Close button (X)

- **Details Section:**
  - ⏰ Time: "18:00 - 19:00 (1h)"
  - 📅 Date: "Środa, 15 stycznia 2026"
  - 👤 Participants: Lista z color badges (■ tata ■ mama ■ hania)
  - 🏷️ Type: Badge (WORK / ACTIVITY / MEAL / OTHER)
  - 📝 Description: Pełny opis (jeśli dostępny)
  - 🎯 Category: "Fixed" lub "Goal" badge
  - 🔄 Recurring: "Nie" lub "Tak - 3x/tydzień" (jeśli isGoal=true)

- **Conflict Warning (jeśli hasConflict=true):**
  - ⚠️ Red alert box: "Konflikt czasowy z innymi aktywnościami"
  - Lista konfliktujących aktywności (klikalne, otwierają ich modale)

- **Actions Section:**
  - "Edytuj" (primary button) → otwiera Edit Mode
  - "Usuń" (danger button, text) → confirmation dialog
  - "Dodaj feedback" (secondary button) → thumbs up/down + comment field

#### Edit Mode (w tym samym modalu):
- Form z polami:
  - Title (editable)
  - Start Time (time picker)
  - End Time (time picker)
  - Day of Week (date picker - tylko w obrębie tygodnia)
  - Description (textarea)
  - Participants (multi-select member checkboxes)
  - Type (dropdown)
- Akcje:
  - "Zapisz zmiany" → `PATCH /v1/time-blocks/{blockId}`
  - "Anuluj" → powrót do widoku szczegółów

#### Kluczowe komponenty
- `ActivityDetailsModalComponent`
- `ActivityDetailsViewComponent` (read mode)
- `ActivityEditFormComponent` (edit mode)
- `ConflictWarningComponent`
- `FeedbackFormComponent`
- `ConfirmDeleteModalComponent` (nested modal)

#### UX, dostępność, bezpieczeństwo
- **UX**: 
  - Modal backdrop (darkened screen)
  - Smooth open/close animation (200ms fade + slide)
  - ESC key closes modal
  - Click outside closes modal (z confirmation jeśli w edit mode)
  - Optimistic UI: immediate update po zapisie, rollback on error
  - Toast notification po zapisie/usunięciu
- **Dostępność**: 
  - Focus trap (focus pozostaje w modalu)
  - Focus management: pierwszy element focusowany przy otwarciu
  - ARIA role="dialog"
  - ARIA-labelledby, ARIA-describedby
  - Keyboard navigation (Tab, Shift+Tab, ESC)
- **Bezpieczeństwo**: 
  - Walidacja: nie można edytować cudzych aktywności
  - Soft-delete time blocks
  - Conflict detection przy zapisie (backend validation)
  - Wywołania: `GET /v1/time-blocks/{blockId}`, `PATCH /v1/time-blocks/{blockId}`, `DELETE /v1/time-blocks/{blockId}`

---

### 2.10 Profile Settings View
**Ścieżka**: `/settings`  
**Dostęp**: Zalogowani użytkownicy

#### Główny cel
Zarządzanie ustawieniami konta użytkownika.

#### Kluczowe informacje
- **Account Section:**
  - Display Name (editable)
  - Email (read-only, wyświetlony)
  - "Zmień hasło" (button → otwiera modal)
  - Account created date (read-only)

- **Preferences Section (future):**
  - Language (dropdown) - future
  - Time format (12h/24h) - current: 24h
  - Week start day (Mon/Sun) - current: Mon

- **Data & Privacy Section:**
  - "Pobierz moje dane" (GDPR compliance) → generuje JSON export
  - "Usuń konto" (danger button) → confirmation dialog z info o kaskadownym usunięciu

- **Statistics Section:**
  - Liczba wygenerowanych harmonogramów
  - Acceptance rate (% zaakceptowanych sugestii AI)
  - Total feedback submitted

#### Kluczowe komponenty
- `ProfileSettingsComponent`
- `AccountSettingsSectionComponent`
- `PreferencesSectionComponent`
- `DataPrivacySectionComponent`
- `StatisticsSectionComponent`
- `ChangePasswordModalComponent`
- `DeleteAccountModalComponent` (z confirmation + password re-entry)

#### UX, dostępność, bezpieczeństwo
- **UX**: 
  - Grouped sections (visual separation)
  - Inline editing dla Display Name (save on blur)
  - Clear warnings dla destructive actions
  - Toast notifications po zapisie
- **Dostępność**: 
  - Heading hierarchy (h2 dla sekcji)
  - Labels dla wszystkich pól
  - Keyboard accessible
- **Bezpieczeństwo**: 
  - Zmiana hasła wymaga podania starego hasła
  - Usunięcie konta wymaga re-authentication (password confirmation)
  - GDPR compliance: pełny export danych, kaskadowne usunięcie
  - Wywołania: `GET/PATCH /v1/user`, `DELETE /v1/user`

---

### 2.11 Feedback & Statistics View (future enhancement)
**Ścieżka**: `/feedback`  
**Dostęp**: Zalogowani użytkownicy

#### Główny cel
Przegląd historii feedbacku i statystyk użytkowania (dla power users).

#### Kluczowe informacje
- Lista feedbacków z paginacją
- Filtry: Rating (All/👍/👎), Date range
- Charts: Acceptance rate over time, Frequency of use
- Insights: "Najczęściej akceptowane typy aktywności", "Typowe konflikty"

#### Kluczowe komponenty
- `FeedbackListComponent`
- `FeedbackCardComponent`
- `UsageChartsComponent`

---

## 3. Mapa podróży użytkownika

### 3.1 Główna ścieżka (Happy Path)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PIERWSZY WIZYTA (Nowy użytkownik)                    │
└─────────────────────────────────────────────────────────────────────────────┘

1. Landing View
   ↓ [Klik "Zacznij planować"]
   
2. Register View
   ↓ [Wypełnienie formularza + submit]
   
3. Auto-login → Dashboard View
   │
   ├─ Onboarding checklist widoczny:
   │  • ✅ Konto utworzone
   │  • ⏳ Dodaj członków rodziny
   │  • ⏳ Zdefiniuj cele
   │  • ⏳ Wygeneruj pierwszy tydzień
   │
   ↓ [Klik "Zarządzaj rodziną"]
   
4. Family Setup View
   ↓ [Dodanie 3-5 członków rodziny]
   ↓ [Zapisanie członków]
   ↓ [Powrót do Dashboard]
   
5. Dashboard View (updated checklist)
   │  • ✅ Konto utworzone
   │  • ✅ Dodaj członków rodziny
   │  • ⏳ Zdefiniuj cele ← następny krok
   │
   ↓ [Klik "Zarządzaj celami"]
   
6. Recurring Goals Setup View
   ↓ [Dodanie 5-10 celów dla członków]
   ↓ [Zapisanie celów]
   ↓ [Powrót do Dashboard]
   
7. Dashboard View (updated checklist)
   │  • ✅ Konto utworzone
   │  • ✅ Dodaj członków rodziny
   │  • ✅ Zdefiniuj cele
   │  • ⏳ Wygeneruj pierwszy tydzień ← ostatni krok
   │
   ↓ [Klik "Wygeneruj nowy tydzień"]
   
8. Schedule Generator View
   ↓ [Wybór tygodnia + strategii]
   ↓ [Klik "Podgląd"]
   ↓ [Loading 5-15s...]
   ↓ [Preview wyświetlony]
   ↓ [Klik "Zaakceptuj i zapisz"]
   
9. Week Schedule View
   │
   ├─ Grid calendar z wygenerowanym harmonogramem
   ├─ Wszystkie członkowie widoczni (kolorowe bloki)
   ├─ Legend + Filters dostępne
   │
   ↓ [User eksploruje]
   
10. Hover na aktywności → Tooltip z szczegółami
    
11. Klik na aktywności → Activity Details Modal
    ↓ [Przegląd szczegółów]
    ↓ [Opcjonalnie: Edycja]
    ↓ [Zapisanie zmian]
    ↓ [Zamknięcie modalu]
    
12. Week Schedule View (zaktualizowany)
    ↓ [Klik filtru "mama"]
    ↓ [Widok przefiltrowany - inne osoby przygaszone]
    
13. [Zadowolony użytkownik wraca regularnie co tydzień]

┌─────────────────────────────────────────────────────────────────────────────┐
│                     POWRACAJĄCY UŻYTKOWNIK (Regular Use)                     │
└─────────────────────────────────────────────────────────────────────────────┘

1. Login View
   ↓ [Zalogowanie]
   
2. Dashboard View
   ↓ [Klik "Zobacz aktualny tydzień"]
   
3. Week Schedule View
   │
   ├─ Przegląd aktualnego tygodnia
   ├─ Używanie filtrów do fokusowania
   ├─ Edycja aktywności gdy plany się zmieniają
   │
   ↓ [Na koniec tygodnia]
   ↓ [Klik "Następny tydzień"]
   ↓ [Tydzień pusty → klik "Wygeneruj harmonogram"]
   
4. Schedule Generator View
   ↓ [Szybkie generowanie (znane ustawienia)]
   
5. Week Schedule View (nowy tydzień)
   ↓ [Cykl się powtarza]
```

### 3.2 Alternatywne ścieżki

**Ścieżka A: Edycja zamiast generowania AI**
```
Dashboard → Week Schedule View → Pusta komórka (future: add activity)
→ Obecnie: przez Schedule Generator lub Import
```

**Ścieżka B: Regeneracja tygodnia**
```
Week Schedule View → [Niezadowolony z planu]
→ Klik "Wygeneruj ponownie"
→ Schedule Generator (pre-filled)
→ Preview → Accept
→ Week Schedule View (nadpisany)
```

**Ścieżka C: Zarządzanie celami w trakcie tygodnia**
```
Week Schedule View → [Nowy cel pojawił się]
→ Main Navigation → "Cele"
→ Recurring Goals Setup → Add Goal
→ Powrót do Week Schedule
→ Regeneracja tygodnia (optional)
```

---

## 4. Układ i struktura nawigacji

### 4.1 Główna nawigacja (Top Navigation Bar)

**Dla niezalogowanych:**
```
┌────────────────────────────────────────────────────────────┐
│ [Logo] Family Life Planner        [Logowanie] [Rejestracja] │
└────────────────────────────────────────────────────────────┘
```

**Dla zalogowanych:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Logo/Home] [📅 Tydzień] [👨‍👩‍👧‍👦 Rodzina] [🎯 Cele]        [⚙️ Ustawienia] [Wyloguj] │
└──────────────────────────────────────────────────────────────────────────┘
```

**Struktura:**
- **Logo/Home**: Link do Dashboard
- **📅 Tydzień**: Link do Week Schedule View (current week)
- **👨‍👩‍👧‍👦 Rodzina**: Link do Family Setup View
- **🎯 Cele**: Link do Recurring Goals Setup View
- **⚙️ Ustawienia**: Link do Profile Settings View
- **Wyloguj**: Logout action → POST /v1/auth/logout → redirect to Landing

### 4.2 Nawigacja kontekstowa

**Week Schedule View:**
- Week navigation w headerze: `[< Poprzedni] [Dzisiaj] [Następny >]`
- Quick actions: `[Wygeneruj ponownie]` `[Eksportuj]` (future)

**Dashboard:**
- Quick action cards (navigational tiles)

**Family Setup / Recurring Goals:**
- CTA button: `[+ Dodaj]` (sticky/floating)

### 4.3 Breadcrumbs (optional, dla deep navigation)

```
Home > Tydzień > 13-19 stycznia 2026
Home > Rodzina
Home > Cele
Home > Ustawienia
```

### 4.4 Mobile Navigation (future - Phase 3)

Hamburger menu z collapsed navigation dla mobile/tablet.

---

## 5. Kluczowe komponenty

### 5.1 Komponenty współdzielone (Shared Components)

#### `NavigationBarComponent`
**Typ**: Smart component  
**Odpowiedzialność**: 
- Wyświetlanie głównego menu nawigacji
- Highlight aktywnej ścieżki
- User avatar/name dropdown (future)

**Props**: 
- `isAuthenticated: boolean`
- `currentUser: User | null`

**Używany w**: Wszystkie widoki (App Root)

---

#### `AuthGuard` (Route Guard)
**Typ**: Angular Guard  
**Odpowiedzialność**: 
- Ochrona ścieżek wymagających autoryzacji
- Redirect do Login View jeśli niezalogowany
- Weryfikacja JWT token

**Używany w**: Wszystkie protected routes

---

#### `ModalComponent`
**Typ**: Reusable container  
**Odpowiedzialność**: 
- Generic modal wrapper z backdrop
- Focus trap
- ESC key handler
- Click outside handler

**Props**: 
- `isOpen: boolean`
- `onClose: () => void`
- `size: 'sm' | 'md' | 'lg'`
- `title: string`

**Używany w**: Activity Details, Confirm Delete, Change Password, itd.

---

#### `TooltipComponent`
**Typ**: Presentation component  
**Odpowiedzialność**: 
- Wyświetlanie tooltipa z pozycjonowaniem
- Fade in/out animation
- Auto-positioning (avoid viewport edges)

**Props**: 
- `content: string | TemplateRef`
- `position: 'top' | 'bottom' | 'left' | 'right'`
- `delay: number` (default: 10ms)

**Używany w**: Week Grid (activity hover)

---

#### `LoadingSpinnerComponent`
**Typ**: Presentation component  
**Odpowiedzialność**: 
- Generic loading indicator
- Różne rozmiary (sm, md, lg)
- Opcjonalny message

**Props**: 
- `size: 'sm' | 'md' | 'lg'`
- `message?: string`

**Używany w**: Wszędzie gdzie async operations

---

#### `EmptyStateComponent`
**Typ**: Presentation component  
**Odpowiedzialność**: 
- Wyświetlanie empty state z icon + message + CTA

**Props**: 
- `icon: string` (emoji)
- `title: string`
- `message: string`
- `ctaLabel?: string`
- `onCtaClick?: () => void`

**Używany w**: Empty lists, empty week schedule

---

#### `SkeletonLoaderComponent`
**Typ**: Presentation component  
**Odpowiedzialność**: 
- Pulsujące placeholdery podczas ładowania
- Dopasowywane kształty (text, card, grid)

**Props**: 
- `type: 'text' | 'card' | 'grid'`
- `count: number`

**Używany w**: List views, grid calendar loading

---

#### `ToastNotificationComponent`
**Typ**: Service + Component  
**Odpowiedzialność**: 
- Toast notifications (success, error, info, warning)
- Auto-dismiss z timerem
- Stackable (multiple toasts)

**Service API**: 
- `showSuccess(message: string)`
- `showError(message: string)`
- `showInfo(message: string)`

**Używany w**: Po każdej akcji CRUD

---

#### `ConfirmDialogComponent`
**Typ**: Reusable modal  
**Odpowiedzialność**: 
- Confirmation dialog dla destructive actions
- Customizable message + buttons

**Props**: 
- `title: string`
- `message: string`
- `confirmLabel: string` (default: "Potwierdź")
- `cancelLabel: string` (default: "Anuluj")
- `isDangerous: boolean` (red confirm button)
- `onConfirm: () => void`
- `onCancel: () => void`

**Używany w**: Delete actions, regenerate schedule

---

### 5.2 Komponenty specyficzne dla Week Schedule

#### `WeekGridComponent`
**Typ**: Presentation component  
**Odpowiedzialność**: 
- Renderowanie CSS Grid layout
- Obsługa sticky headers/columns
- Tracking dla performance (`@for` track functions)

**Props**: 
- `gridCells: GridCell[]` (computed signal)
- `familyMembers: FamilyMember[]`
- `selectedFilter: string`
- `onActivityClick: (activityId: string) => void`

**Używany w**: Week Schedule View

---

#### `ActivityCellComponent`
**Typ**: Presentation component  
**Odpowiedzialność**: 
- Renderowanie pojedynczej aktywności w komórce
- Member color + initial badge
- Type emoji
- Truncated title
- Proportional height
- Conflict indicator
- Hover effect

**Props**: 
- `activity: ActivityInCell`
- `isDimmed: boolean`
- `onClick: () => void`

**Używany w**: WeekGridComponent

---

#### `FilterBarComponent`
**Typ**: Smart component  
**Odpowiedzialność**: 
- Przyciski filtrów (All, per member, Shared)
- Active filter state
- Debounced filter changes (150ms)

**Props**: 
- `familyMembers: FamilyMember[]`
- `selectedFilter: string`
- `onFilterChange: (filter: string) => void`

**Używany w**: Week Schedule View

---

#### `LegendComponent`
**Typ**: Presentation component  
**Odpowiedzialność**: 
- Wyświetlanie legendy kolorów członków
- Color square + name

**Props**: 
- `familyMembers: FamilyMember[]`

**Używany w**: Week Schedule View

---

#### `ConflictIndicatorComponent`
**Typ**: Presentation component  
**Odpowiedzialność**: 
- Red border styling
- Warning icon overlay
- Tooltip z listą konfliktów

**Props**: 
- `conflictingActivities: ActivityInCell[]`

**Używany w**: ActivityCellComponent

---

### 5.3 Komponenty formularzy

#### `FamilyMemberFormComponent`
**Typ**: Smart component  
**Odpowiedzialność**: 
- Formularz add/edit członka rodziny
- Walidacja (reactive forms)
- Color picker
- Auto-generation koloru/inicjału

**Props**: 
- `member?: FamilyMember` (dla edit mode)
- `onSave: (member: FamilyMemberDto) => void`
- `onCancel: () => void`

**Używany w**: Family Setup View (w modalu)

---

#### `RecurringGoalFormComponent`
**Typ**: Smart component  
**Odpowiedzialność**: 
- Formularz add/edit celu
- Walidacja (frequencyPerWeek >0, duration >0)
- Time picker dla preferowanego czasu
- Priority scale (1-5)

**Props**: 
- `goal?: RecurringGoal` (dla edit mode)
- `familyMembers: FamilyMember[]`
- `onSave: (goal: RecurringGoalDto) => void`
- `onCancel: () => void`

**Używany w**: Recurring Goals Setup View (w modalu)

---

#### `ActivityEditFormComponent`
**Typ**: Smart component  
**Odpowiedzialność**: 
- Edycja time block
- Time range picker
- Participants multi-select
- Conflict validation przy zapisie

**Props**: 
- `activity: TimeBlock`
- `familyMembers: FamilyMember[]`
- `onSave: (activity: TimeBlockDto) => void`
- `onCancel: () => void`

**Używany w**: Activity Details Modal (edit mode)

---

### 5.4 Komponenty AI/Generator

#### `ScheduleGeneratorFormComponent`
**Typ**: Smart component  
**Odpowiedzialność**: 
- Formularz konfiguracji generowania
- Week date picker
- Strategy selection
- Wywołanie AI preview

**Props**: 
- `prefilledWeek?: string` (ISO date)
- `onPreview: (config: GeneratorConfig) => void`

**Używany w**: Schedule Generator View

---

#### `SchedulePreviewComponent`
**Typ**: Presentation component  
**Odpowiedzialność**: 
- Mini version of WeekGridComponent
- Read-only
- Summary statistics

**Props**: 
- `previewSchedule: WeeklyScheduleDto`
- `onAccept: () => void`
- `onRegenerate: () => void`

**Używany w**: Schedule Generator View

---

#### `GenerationLoadingComponent`
**Typ**: Presentation component  
**Odpowiedzialność**: 
- Dedicated loader dla AI generation
- Progress indicator (optional)
- Timeout message (po 15s)

**Używany w**: Schedule Generator View

---

### 5.5 Komponenty nawigacji

#### `WeekNavigationComponent`
**Typ**: Smart component  
**Odpowiedzialność**: 
- Week title display
- Previous/Next/Today buttons
- Date calculation

**Props**: 
- `currentWeekStart: string` (ISO date)
- `onWeekChange: (weekStart: string) => void`

**Używany w**: Week Schedule View header

---

## 6. Mapowanie User Stories na UI

| User Story | Widoki/Komponenty | Kluczowe elementy UI |
|------------|-------------------|----------------------|
| **US-001**: Rejestracja konta | Register View | RegisterFormComponent, Email input, Password input z strength indicator, Checkbox RODO |
| **US-002**: Logowanie | Login View | LoginFormComponent, Email input, Password input, "Zapamiętaj mnie" checkbox |
| **US-003**: Generowanie AI | Schedule Generator View, Week Schedule View | ScheduleGeneratorFormComponent, SchedulePreviewComponent, Week date picker, Strategy selector, Preview button, Accept button |
| **US-004**: Przegląd propozycji | Schedule Generator View (preview mode) | SchedulePreviewComponent, GenerationSummaryCardComponent, Accept/Regenerate/Cancel buttons |
| **US-005**: Edycja harmonogramów | Activity Details Modal, Week Schedule View | ActivityEditFormComponent w modalu, Inline edycja pól, Save/Cancel buttons |
| **US-006**: Bezpieczeństwo | AuthGuard, NavigationBarComponent | JWT token management, Auth interceptor, Logout button, Protected routes |
| **US-007**: Grid calendar | Week Schedule View | WeekGridComponent, GridCellComponent, ActivityCellComponent, TimeColumnComponent, DayHeaderComponent, Member colors, Conflict indicators |
| **US-008**: Filtrowanie | Week Schedule View | FilterBarComponent, "Dim others" logic, Fade animations, LegendComponent |

---

## 7. Stany i przypadki brzegowe

### 7.1 Loading States

| Widok | Loading State | UI Implementacja |
|-------|---------------|------------------|
| Week Schedule View | Pobieranie harmonogramu | GridLoadingSkeletonComponent - pulsujące komórki grid |
| Schedule Generator | AI generuje plan | GenerationLoadingComponent - "AI generuje... (do 15s)" |
| Family Setup | Pobieranie listy | SkeletonLoaderComponent - card placeholders |
| Recurring Goals | Pobieranie listy | SkeletonLoaderComponent - card placeholders |
| Dashboard | Pobieranie stats | SkeletonLoaderComponent - stat card placeholders |
| Activity Modal | Pobieranie szczegółów | LoadingSpinnerComponent w modalu |

### 7.2 Empty States

| Widok | Warunek | UI Implementacja |
|-------|---------|------------------|
| Week Schedule View | Brak harmonogramu na tydzień | EmptyStateComponent - "Brak harmonogramu. [Wygeneruj harmonogram]" |
| Family Setup | Brak członków | EmptyStateComponent - "Dodaj pierwszego członka rodziny. [+ Dodaj członka]" |
| Recurring Goals | Brak celów | EmptyStateComponent - "Zdefiniuj pierwszy cel. [+ Dodaj cel]" |
| Dashboard | Nowy użytkownik | OnboardingChecklistComponent - guided setup |
| Feedback View | Brak feedbacku | EmptyStateComponent - "Zacznij oceniać harmonogramy" |

### 7.3 Error States

| Scenariusz | Error State | UI Implementacja |
|------------|-------------|------------------|
| AI generation failed | Timeout/API error | GenerationErrorComponent - "Nie udało się wygenerować. [Spróbuj ponownie]" |
| Schedule fetch failed | Network error | Error banner w Week Schedule View - "Błąd ładowania. [Odśwież]" |
| Login failed | Nieprawidłowe credentials | Inline error message - "Nieprawidłowe dane logowania" |
| Form validation | Validation errors | Inline field errors (red borders + messages) |
| Conflict na save | Backend validation error | Modal alert - "Wykryto konflikt czasowy. Zmień godziny lub usuń inną aktywność." |
| Delete failed | Backend error | Toast notification - "Nie udało się usunąć. Spróbuj ponownie." |
| Session expired | JWT expired | Redirect to Login + toast - "Sesja wygasła. Zaloguj się ponownie." |

### 7.4 Edge Cases

| Edge Case | Scenariusz | Rozwiązanie UI |
|-----------|------------|----------------|
| Zero activities in week | Pusty harmonogram | Pokazać grid z pustymi komórkami + empty state message |
| 50+ activities in day | Overflow w komórce | Vertical scroll w komórce OR "... +5 more" indicator |
| Conflicting activities | Nakładające się bloki | Czerwona ramka + ⚠️ icon + lista konfliktów w tooltip |
| Very short activity (<15 min) | Proporcjonalny height zbyt mały | Min-height 24px (readable) + tooltip z pełną informacją |
| Very long activity (>8h) | Span przez wiele slotów | Powtórzyć aktywność w każdym slocie (visual continuity) |
| All filters off | Niemożliwy stan | "Wszyscy" filter zawsze aktywny (nie można odznaczyć wszystkich) |
| Regenerate existing week | Nadpisanie danych | Confirmation dialog - "Aktualne aktywności zostaną nadpisane. Kontynuować?" |
| Delete last family member | Brak członków | Prevent delete - "Musisz mieć przynajmniej jednego członka rodziny" |
| Goal frequency >7 per week | Niemożliwe do zaplanowania | Walidacja formularza - "Maksymalnie 7x/tydzień (raz dziennie)" |
| Mobile user (future) | Desktop-only w MVP | Info banner - "Dla najlepszych wrażeń użyj desktopa. Aplikacja mobilna wkrótce." |

### 7.5 Network/Offline Scenarios

| Scenariusz | UI Handling |
|------------|-------------|
| Offline detection | Global banner - "Brak połączenia z internetem. Niektóre funkcje mogą nie działać." |
| Slow network | Show loading states + timeout messages |
| Request timeout (>15s for AI) | Error state + "Spróbuj ponownie" button |
| 401 Unauthorized | Auto-logout + redirect to Login + toast |
| 403 Forbidden | Error message - "Nie masz uprawnień do tej akcji" |
| 404 Not Found | 404 page - "Nie znaleziono strony. [Wróć do Dashboard]" |
| 500 Server Error | Error page - "Problem z serwerem. Spróbuj ponownie za chwilę." |

---

## 8. Performance & Optymalizacja UX

### 8.1 Performance Targets

| Metryka | Target | Implementacja |
|---------|--------|---------------|
| Initial page load | <2s | Code splitting, lazy loading routes |
| Week grid render | <100ms | Angular signals, OnPush, track functions |
| Filter response | <50ms | Debouncing (150ms), memoization |
| Tooltip delay | <10ms | Optimized hover listeners |
| Modal open | <30ms | Preloaded modal component |
| Animation frame rate | 60fps | CSS transitions, GPU acceleration |

### 8.2 Optymalizacje Angular

- **Signals**: `computed()` dla grid data transformation
- **OnPush change detection**: Dla wszystkich presentation components
- **Track functions**: `@for` loops z unique identifiers
- **Lazy loading**: Route-based code splitting
- **Lazy rendering**: Intersection Observer dla offscreen cells (jeśli grid bardzo duży)
- **Memoization**: Cache transformed grid data

### 8.3 UX Enhancements

- **Optimistic UI**: Immediate feedback, rollback on error
- **Debouncing**: Filter changes (150ms), search inputs
- **Loading skeletons**: Zamiast spinners dla lepszej perceived performance
- **Toast notifications**: Non-blocking feedback
- **Keyboard shortcuts**: Arrow keys w grid, ESC dla modalów
- **Auto-save**: Dla inline edycji (save on blur)
- **Sticky elements**: Headers, legends, filters - zawsze widoczne

---

## 9. Dostępność (Accessibility)

### 9.1 WCAG 2.1 Level AA Compliance

| Aspekt | Implementacja |
|--------|---------------|
| **Kontrast kolorów** | Minimum 4.5:1 dla tekstu, 3:1 dla UI components |
| **Keyboard navigation** | Wszystkie interaktywne elementy dostępne przez Tab/Enter/Space |
| **Focus indicators** | Wyraźne outline dla focusowanych elementów |
| **ARIA labels** | Dla wszystkich grid cells, buttons, form fields |
| **ARIA roles** | `role="grid"`, `role="dialog"`, `role="navigation"` |
| **Heading hierarchy** | Logiczna struktura h1 → h2 → h3 |
| **Alt text** | Dla wszystkich obrazów (jeśli będą) |
| **Screen reader** | Announcements dla zmian stanu (filtrowanie, ładowanie) |
| **Form labels** | Każde pole ma `<label>` lub `aria-label` |
| **Error messages** | `aria-describedby` dla błędów walidacji |

### 9.2 Keyboard Navigation

| Kontekst | Skróty klawiszowe |
|----------|-------------------|
| Week Grid | Arrow keys (Up/Down/Left/Right) dla nawigacji między komórkami |
| Week Grid | Enter/Space otwiera Activity Details Modal |
| Modal | ESC zamyka modal |
| Modal | Tab/Shift+Tab dla nawigacji w modalu |
| Filters | Tab + Enter/Space dla przełączania filtrów |
| Forms | Tab order logiczny (top-to-bottom, left-to-right) |
| Global | Ctrl+/ otwiera keyboard shortcuts help (future) |

---

## 10. Bezpieczeństwo UI

### 10.1 Autentykacja i autoryzacja

| Mechanizm | Implementacja |
|-----------|---------------|
| **JWT Token** | Przechowywany w httpOnly cookie (preferowane) lub localStorage |
| **Auth Guard** | Ochrona wszystkich protected routes |
| **Token refresh** | Automatyczne odświeżanie przed wygaśnięciem |
| **Auto-logout** | Po wygaśnięciu tokenu + redirect to Login |
| **Re-authentication** | Dla destructive actions (delete account, change password) |

### 10.2 Walidacja i sanityzacja

| Aspekt | Implementacja |
|--------|---------------|
| **Input sanitization** | Angular built-in XSS protection |
| **Form validation** | Client-side (reactive forms) + server-side (backend) |
| **CSRF protection** | CSRF token w requestach mutujących |
| **Rate limiting** | UI pokazuje błąd po przekroczeniu limitu + cooldown timer |

### 10.3 Prywatność danych

| Aspekt | Implementacja |
|--------|---------------|
| **RODO compliance** | Checkbox zgody przy rejestracji, export danych, kaskadowne usunięcie |
| **Data isolation** | Użytkownik widzi tylko swoje dane (backend RLS + frontend checks) |
| **No sensitive data in URLs** | IDs w path params OK, ale nie hasła/tokeny |
| **HTTPS only** | Wymóg dla production |

---

## 11. Responsive Design (Future - Phase 3)

**MVP (Phase 1)**: Desktop-only (≥1280px)

**Future enhancements**:
- Tablet (768px-1279px): Adapted grid layout (stack some days)
- Mobile (<768px): Week view jako lista dni, tap to expand day details

---

## 12. Następne kroki implementacji

### Phase 1A: Infrastruktura (Week 1)
1. Setup Angular project (nx workspace)
2. Configure routing
3. Create shared components (Navigation, Modal, Toast, Loading, Empty State)
4. Setup authentication (Auth Guard, Login/Register views)
5. API service layer (HttpClient, interceptors)

### Phase 1B: Core Views (Week 2-3)
1. Dashboard View
2. Family Setup View + Form
3. Recurring Goals Setup View + Form
4. Profile Settings View

### Phase 1C: Week Schedule Grid (Week 4-6)
1. Week Schedule View - core structure
2. WeekGridComponent - CSS Grid layout
3. ActivityCellComponent - rendering logic
4. FilterBarComponent + LegendComponent
5. Tooltip + Activity Details Modal
6. Conflict detection visualization
7. Performance optimization

### Phase 1D: AI Generator (Week 7-8)
1. Schedule Generator View
2. ScheduleGeneratorFormComponent
3. SchedulePreviewComponent
4. Integration z AI endpoint
5. Error handling + timeout logic

### Phase 1E: Testing & Polish (Week 9-10)
1. Unit tests (Jest)
2. E2E tests (Playwright)
3. Accessibility audit
4. Performance testing
5. User acceptance testing (family feedback)

---

## 13. Podsumowanie

Architektura UI Family Life Planner została zaprojektowana z naciskiem na:

✅ **User-centric design** - Rozwiązanie realnych problemów rodziny (brak centralnego miejsca na plan, trudność w balansowaniu priorytetów)

✅ **AI-assisted workflow** - Generowanie przez AI z możliwością ręcznej edycji (best of both worlds)

✅ **Visual clarity** - Grid calendar z kolorowym rozróżnieniem członków, intuicyjne ikony, clear hierarchy

✅ **Performance** - Angular signals, OnPush, lazy rendering, memoization dla płynnego UX

✅ **Accessibility** - WCAG 2.1 Level AA, keyboard navigation, screen reader support

✅ **Scalability** - Struktura przygotowana na przyszłe rozszerzenia (mobile, advanced features)

✅ **Security** - Auth guards, JWT, RODO compliance, input validation

Główny widok (Week Schedule Grid) jest sercem aplikacji - to tutaj użytkownicy spędzą 80% czasu, więc został zaprojektowany z maksymalną dbałością o detale, performance i UX.

Architektura mapuje się 1:1 na API plan i spełnia wszystkie wymagania z PRD, jednocześnie uwzględniając insights z session notes (szczególnie szczegóły grid view design).

**Ready for implementation!** 🚀

---

**Autorzy**: Team Family Life Planner  
**Wersja dokumentu**: 1.0  
**Data**: 2026-01-14

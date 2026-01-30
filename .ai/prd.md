# Dokument Wymagań Produktu (PRD) – Family Life Planner

> **Status:** Phase 1A ✅ Ukończona | Phase 1B 🚧 85% Complete  
> **Ostatnia aktualizacja:** Styczeń 2026  
> **Wersja:** 1.2

## 1. Przegląd
Family Life Planner to desktopowa aplikacja webowa, która konsoliduje wszystkie zobowiązania rodziny (praca, cele, posiłki, aktywności) i umożliwia generowanie tygodniowego planu za pomocą AI (GPT-4o Turbo). Użytkownik wprowadza priorytety, a system podpowiada harmonogramy, pomysły na aktywności i posiłki, które można ręcznie dopracować.

**Kluczowe cechy zaimplementowane:**
- ✅ AI-powered schedule generation (GPT-4o Turbo)
- ✅ Interactive week grid calendar z dual orientation
- ✅ JWT authentication + PostgreSQL/Supabase persistence
- ✅ Family member & recurring goals management
- ✅ Smart filtering z member color coding
- ✅ Conflict detection z visual indicators
- ✅ CI/CD z GitHub Actions

## 2. Problem użytkownika
Jesteśmy rodzicami trójki dzieci; jedno z nas pracuje w ciągu dnia, ma poboczne projekty i osobiste cele (fitness, hobby, czas wspólny 1:1 z żoną/mężem), a druga osoba jest na urlopie wychowawczym. Brakuje nam jednego miejsca, w którym:
- połączymy wszystkie cele w jednym tygodniowym planie,
- szybko znajdziemy aktywności i posiłki dopasowane do rodziny,
- zbalansujemy priorytety: pracę, rodzinę, hobby i relacje.

## 3. Wymagania funkcjonalne
1. **Automatyczne generowanie planów tygodnia**
   - sugeruje aktywności uwzględniające lokalizację, pogodę, wiek dzieci i upodobania,
   - rekomenduje szybkie, przyjazne dzieciom przepisy,
   - dynamicznie adaptuje plan przy zmianach w życiu.

2. **Edycja planu dzień po dniu**
   - użytkownik może modyfikować dowolny blok (np. przeciągając sloty lub nadpisując).

3. **Podstawowy system uwierzytelniania**
   - rejestracja/logowanie,
   - możliwość usunięcia konta i powiązanych planów na żądanie.

4. **Przechowywanie i skalowalność**
   - dane użytkowników przechowywane bezpiecznie w PostgreSQL z Supabase,
   - Row-Level Security (RLS) dla izolacji danych między użytkownikami,
   - migracje bazy danych zarządzane przez Supabase CLI.

5. **Statystyki generowania planów**
   - śledzenie, ile sugestii wygenerowano i ile z nich zaakceptowano (feedback thumbs up/down).

6. **Wymagania prawne**
   - zgodność z RODO (prawo dostępu/usunięcia danych).

## 4. Wymagania niefunkcjonalne
- **Desktop-first:** Deklarowana dostępność na desktopie (web-first, responsywność mobilna/tabletowa w przyszłości).
- **Wydajność renderowania:** Pierwszy render grid view <100ms, filtrowanie <50ms, płynne animacje 60fps.
- **Obsługa AI:** Czas odpowiedzi ≤15 sekund (GPT-4o Turbo).
- **Dostępność (Accessibility):** WCAG 2.1 Level AA, obsługa klawiatury, screen reader-friendly, kontrast kolorów >4.5:1.
- **Optymalizacja:** Angular signals z memoizacją, OnPush change detection, lazy rendering dla viewport.
- **MVP exclusions:** Brak powiadomień, udostępniania i Google Calendar w MVP.

## 5. Historyjki użytkowników (Podsumowanie)
- Wprowadzenie fixed blocks (praca, wyjazdy) → system zna ograniczenia.
- Definiowanie recurring goals (fitness, hobby, relacje) → algorytm je planuje.
- Generowanie tygodniowego kalendarza → użytkownik widzi trade-offy i konflikty.
- Poprawianie planu i feedback (thumbs up/down) → AI się uczy.
- Znalezienie aktywności lub przepisów w oparciu o kontekst (czas, pogoda, składniki).

### Szczegółowe user stories

ID: US-001
Tytuł: Rejestracja konta
Opis: Jako nowy użytkownik chcę się zarejestrować, aby mieć dostęp do własnych danych (harmonogramy tygodni, itd) i móc korzystać z generowania danych przez AI.
Kryteria akceptacji:
- Formularz rejestracyjny zawiera pola na adres e-mail i hasło.
- Po poprawnym wypełnieniu formularza i weryfikacji danych konto jest aktywowane.
- Użytkownik otrzymuje potwierdzenie pomyślnej rejestracji i zostaje zalogowany.

ID: US-002
Tytuł: Logowanie do aplikacji
Opis: Jako zarejestrowany użytkownik chcę móc się zalogować, aby mieć dostęp do moich harmonogramów i historii generowania.
Kryteria akceptacji:
- Po podaniu prawidłowych danych logowania użytkownik zostaje przekierowany do widoku tygodni.
- Błędne dane logowania wyświetlają komunikat o nieprawidłowych danych.
- Dane dotyczące logowania przechowywane są w bezpieczny sposób.

ID: US-003
Tytuł: Generowanie nadchodzącego tygodnia przy użyciu AI
Opis: Jako zalogowany użytkownik chcę zobaczyć nadchodzący tydzień w kalendarzu i za pomocą przycisku wygenerować propozycje wypełnienia go dzień po dniu, aby zaoszczędzić czas na ręcznym tworzeniu okien na każdą pozycję. 
Kryteria akceptacji:
- W widoku generowania tygodnia znajdują się zajęcia każdego z rodzicóuze swoimi parametrami (ilość w tygodniu, długość, preferencje godzinowe, itp).
- AI generuje ich ustawienie na podstawie preferencji każdej z osób w rodzinie.
- Każdy użytkownik przypisuje sobie współmałżonka (i dzieci jeśli są). Dla każdej osoby dobiera listę jej zajęć wraz z opisem. Dane są zapisywane do bazy i wykorzystywane w zapytaniach LLharmonogramów.
- Po kliknięciu przycisku generowania aplikacja komunikuje się z API modelu LLM i wyświetla listę wygenerowanych propozycji tygodnia do akceptacji przez użytkownika.
- W przypadku problemów z API lub braku odpowiedzi modelu użytkownik zobaczy stosowny komunikat o błędzie.

ID: US-004
Tytuł: Przegląd i zatwierdzanie propozycji harmonogramów
Opis: Jako zalogowany użytkownik chcę móc przeglądać wygenerowane harmonogramy i decydować, które z nich chcę dodać do mojego zestawu, aby zachować tylko przydatne zestawy.
Kryteria akceptacji:
- Lista wygenerowanych harmonogramów jest wyświetlana pod formularzem generowania.
- Przy każdym harmonogramie znajduje się przycisk pozwalający na jego zatwierdzenie, edycję lub odrzucenie.
- Po zatwierdzeniu wybranego harmonogramu użytkownik może kliknąć przycisk zapisu i dodać je do bazy danych.

ID: US-005
Tytuł: Edycja harmonogramów utworzonych ręcznie i generowanych przez AI
Opis: Jako zalogowany użytkownik chcę edytować stworzone lub wygenerowane harmonogramy, aby poprawić ewentualne błędy lub dostosować podpowiedzi do własnych potrzeb.
Kryteria akceptacji:
- Istnieje lista zapisanych harmonogramów (zarówno ręcznie tworzonych, jak i zatwierdzonych wygenerowanych).
- Każdy harmonogram można kliknąć i wejść w tryb edycji.
- Zmiany są zapisywane w bazie danych po zatwierdzeniu.

ID: US-006
Tytuł: Bezpieczny dostęp i autoryzacja
Opis: Jako zalogowany użytkownik chcę mieć pewność, że moje harmonogramy nie są dostępne dla innych użytkowników, aby zachować prywatność i bezpieczeństwo danych.
Kryteria akceptacji:
- Tylko zalogowany użytkownik może wyświetlać, edytować i usuwać swoje harmonogramy.
- Harmonogramy współmałżonka będą wprowadzone w następnej fazie developmentu do współdzielenia.

ID: US-007
Tytuł: Przeglądanie tygodnia w formacie grid calendar
Opis: Jako zalogowany użytkownik chcę widzieć cały tydzień w formie siatki (dni × godziny), aby szybko porównywać te same przedziały czasowe w różnych dniach i łatwo znajdować wolne sloty.
Kryteria akceptacji:
- Widok przedstawia 7 kolumn (poniedziałek-niedziela) i wiersze dla slotów godzinowych.
- Każdy członek rodziny ma przypisany unikalny kolor i inicjał.
- Wspólne aktywności rodzinne mają specjalny wzór (ukośne pasy).
- Kliknięcie aktywności otwiera modal z pełnymi szczegółami.
- Filtrowanie pozwala na przyciemnienie (dim) niewybranych członków rodziny.
- Konflikty czasowe są wizualnie zaznaczone (czerwona ramka + ikona ostrzeżenia).
- Widok działa płynnie na desktopie z wydajnością <100ms pierwszego renderu.

ID: US-008
Tytuł: Filtrowanie aktywności członków rodziny
Opis: Jako zalogowany użytkownik chcę filtrować widok tygodnia według członków rodziny, aby skupić się na harmonogramie konkretnej osoby zachowując kontekst pozostałych.
Kryteria akceptacji:
- Dostępne przyciski filtrowania: "Wszyscy", każdy członek rodziny osobno, "Wspólne".
- Wybór filtra przyciemnia (opacity 30% + grayscale) aktywności innych osób.
- Animacja przejścia filtra trwa 200ms z płynnym fade.
- Filtr jest debounced (150ms) przy szybkich przełączeniach.
- Legenda na górze widoku pokazuje kolory wszystkich członków rodziny.

ID: US-009
Tytuł: Szybkie dodawanie aktywności
Opis: Jako zalogowany użytkownik chcę móc szybko dodać nową aktywność do kalendarza bez generowania całego tygodnia od nowa, aby elastycznie reagować na zmiany w planach.
Kryteria akceptacji:
- Modal "Quick Add Activity" dostępny z widoku kalendarza.
- Możliwość wyboru dnia, godziny rozpoczęcia i zakończenia, typu aktywności.
- Możliwość przypisania aktywności do członka rodziny lub oznaczenia jako wspólna.
- Nowa aktywność pojawia się natychmiast w kalendarzu po zapisaniu.
- System wykrywa konflikty z istniejącymi aktywnościami.

ID: US-010
Tytuł: Zarządzanie członkami rodziny
Opis: Jako zalogowany użytkownik chcę zarządzać listą członków rodziny (dodawać, edytować, usuwać), aby system mógł uwzględnić wszystkie osoby w generowaniu harmonogramu.
Kryteria akceptacji:
- Możliwość dodania członka rodziny z danymi: imię, rola (USER/SPOUSE/CHILD), wiek, kolor.
- Możliwość edycji danych członka rodziny.
- Możliwość usunięcia członka rodziny (soft delete).
- Każdy członek rodziny ma unikalny kolor używany w kalendarzu.

ID: US-011
Tytuł: Zarządzanie celami cyklicznymi
Opis: Jako zalogowany użytkownik chcę definiować cele cykliczne (np. fitness 3x w tygodniu, 45 min), aby AI mogło je uwzględnić w generowaniu harmonogramu.
Kryteria akceptacji:
- Możliwość utworzenia celu z parametrami: nazwa, opis, częstotliwość/tydzień, preferowany czas trwania, preferowana pora dnia.
- Możliwość przypisania celu do członka rodziny.
- Możliwość edycji i usunięcia celu.
- Cele są uwzględniane w procesie generowania AI.

ID: US-012
Tytuł: Regeneracja tygodnia z zachowaniem ręcznych aktywności
Opis: Jako zalogowany użytkownik chcę móc wygenerować tydzień ponownie, zachowując ręcznie dodane aktywności, aby AI zaproponowało nowy układ bez utraty moich zmian.
Kryteria akceptacji:
- Przycisk "Reschedule Week" w widoku kalendarza.
- AI usuwa tylko aktywności wygenerowane przez AI, zachowując ręcznie dodane.
- Ręczne aktywności są przekazywane do AI jako ograniczenia przy generowaniu.
- Użytkownik widzi potwierdzenie, które aktywności zostaną zachowane.

ID: US-013
Tytuł: Nawigacja między tygodniami
Opis: Jako zalogowany użytkownik chcę móc przeglądać różne tygodnie (poprzedni, następny, dzisiejszy), aby planować długoterminowo i przeglądać historię.
Kryteria akceptacji:
- Przyciski nawigacji: "Previous Week", "Next Week", "Today".
- Widoczna data początku i końca aktualnie wyświetlanego tygodnia.
- Płynne przejścia między tygodniami.
- Automatyczne ładowanie harmonogramu dla wybranego tygodnia (jeśli istnieje).



## 6. Moduły MVP (Phase 1)

### Module 1 – Weekly Schedule Generator
**Cel:** Generować realistyczny plan tygodniowy obejmujący wszystkie priorytety.
- **Wejścia:** fixed blocks (praca, wyjazdy), recurring goals (fitness, relacje), side projects, preferencje energii.
- **Wyjścia:** kalendarz (Mon–Sun), trade-offy, konflikty, przycisk „Regenerate".
- **Widok:** Grid layout (7 dni × dynamiczne sloty godzinowe) z:
  - Kolumnami dla dni tygodnia (poniedziałek-niedziela)
  - Wierszami dla slotów czasowych (1-godzinne sloty, dynamiczny zakres)
  - Kolorowym rozróżnieniem członków rodziny (kolor + inicjały)
  - Specjalnymi markerami dla wspólnych aktywności rodzinnych (ukośne pasy)
  - Tooltipami z pełnymi szczegółami przy hover
  - Filtrowaniem z opcją przyciemnienia niewybranych członków
  - Detekcją konfliktów z wizualnymi wskaźnikami
- **Kryteria sukcesu:** realistyczny plan ≥80% przypadków, cotygodniowe użycie, widok całego tygodnia bez scrollowania.



## 7. Moduły Non-MVP (Phase 2)
-  Module 2 – Family Activity Finder
    **Cel:** Znaleźć 3–5 dopasowanych aktywności.
    - **Wejścia:** lokalizacja, wiek dzieci, czas, pogoda, zainteresowania, okna drzemki.
    - **Wyjścia:** propozycje z logistyką, backup na zmiany pogody.
    - **Kryteria sukcesu:** korzystanie 2–3x tygodniowo, trafność.

- Module 3 – Meal Planner
    **Cel:** Zaproponować szybkie, kid-friendly przepisy.
    - **Wejścia:** typ posiłku, czas, ograniczenia dietetyczne, składniki, poziom trudności.
    - **Wyjścia:** 3–5 przepisów z hackami dla wybrednych, instrukcje krok po kroku, opcjonalnie restauracje.
    - **Kryteria sukcesu:** korzystanie 3–5x tygodniowo, czas <30 min.

- Multi-user collaboration / shared calendar.
- Habit tracking i zaawansowana analityka.
- Powiadomienia/powiększenia w czasie rzeczywistym.
- Aplikacja mobilna (tylko desktop-responsive).
- Integracja z Google Calendar i generowanie list zakupów.

## 8. Stos technologiczny
- **Frontend:** Angular 20+, standalone components, reactive forms, HttpClient, RxJS/Signals, SCSS, Angular Material.
  - **Layout:** CSS Grid dla week view, sticky positioning dla headers
  - **State Management:** Angular signals z computed i memoizacją
  - **Optymalizacja:** OnPush change detection, track functions, lazy rendering
  - **Animacje:** CSS transitions (200ms fade, 100ms hover)
  - **Icons:** Emoji (💼 💪 🍽️ 📌 👨‍👩‍👧‍👦) - zero dependencies
- **Backend:** NestJS 11, REST API, TypeORM, OpenAI Node SDK, Swagger/OpenAPI.
  - **Walidacja:** Class-validator, DTO patterns
  - **Bezpieczeństwo:** JWT guards, bcrypt password hashing, CORS
- **AI:** GPT-4o Turbo (≤15 s response time, structured JSON output).
- **Database:** PostgreSQL z Supabase (local dev + cloud-ready).
  - **Migracje:** Supabase CLI
  - **Bezpieczeństwo:** Row-Level Security (RLS), parameteryzowane zapytania
- **Auth:** JWT (bcrypt password hashing), email & hasło.
- **DevOps:** 
  - **Monorepo:** Nx workspace z wieloma projektami (apps + libs)
  - **CI/CD:** GitHub Actions (lint, unit tests, coverage)
  - **Testing:** Jest (unit tests), Playwright (E2E tests)
  - **Code Quality:** ESLint, Prettier
- **Deployment (Planned):** AWS Lambda / API Gateway lub ECS + Fargate.

## 9. Metryki sukcesu
- Cotygodniowe korzystanie z generatora (cel: cotygodniowa sesja).
- ≥80% AI-generated planów akceptowanych bez dużych poprawek.
- Wskaźnik feedbacku (thumbs up/down) rosnący.
- Zmniejszenie czasu planowania o ≥30 min tygodniowo.
- **Grid View - Wydajność:**
  - Pierwszy render <100ms (target)
  - Filtrowanie <50ms (target)
  - Animacje 60fps (smooth transitions)
  - Memory usage <50MB
- **Grid View - UX:**
  - Użytkownicy mogą zobaczyć cały tydzień bez scrollowania
  - Łatwa identyfikacja wolnych slotów czasowych
  - Porównywanie tego samego czasu w różnych dniach
  - Natychmiastowe wykrywanie konfliktów
(- Wykorzystanie modułów aktywności i posiłków 2–3 razy w tygodniu. - w następnej fazie projektu)


## 10. Otwarte pytania i odpowiedzi
1. **Czy integracja z Google Calendar wchodzi do Phase 1?**
    - ❌ Nie - odłożone do Phase 2 (post-MVP)

2. **W którą fazę planujemy multi-user / family sharing?**
    - 🔄 Phase 2 lub później - obecnie każdy użytkownik zarządza członkami rodziny w swoim koncie

3. **Jak AI powinno zachować się po edycji planu przez użytkownika?**
    - ✅ Zaimplementowane: AI zachowuje ręcznie dodane aktywności podczas regeneracji
    - System rozróżnia aktywności wygenerowane przez AI (`metadata.generatedBy = 'ai'`) i ręczne
    - Przy regeneracji tygodnia: usuwane są tylko aktywności AI, ręczne są zachowywane i przekazywane jako ograniczenia dla nowego generowania

4. **Jak wygląda fallback przy opóźnieniu/awarii OpenAI?**
    - ✅ Zaimplementowane:
      - Timeout 30s dla API OpenAI
      - Obsługa błędów z informatywnymi komunikatami dla użytkownika
      - Logowanie błędów w backendzie (NestJS Logger)
      - Możliwość ponownej próby generowania przez użytkownika
    - 🔄 Do rozważenia: cache wcześniejszych odpowiedzi, fallback do prostszego modelu

5. **Ile danych profilu (np. okna dostępności, poziomy energii) musimy zebrać już w MVP?**
    - ✅ MVP zbiera:
      - Członkowie rodziny: imię, rola, wiek, kolor
      - Cele cykliczne: nazwa, opis, częstotliwość/tydzień, preferowany czas trwania, preferowana pora dnia, priorytet
      - Zobowiązania cykliczne (fixed blocks): tytuł, typ, dzień tygodnia, godziny
      - Strategia generowania: balanced / family-focused / productivity-first
    - 🔄 Planowane w przyszłości: okna dostępności, poziomy energii, preferencje lokalizacji

## 11. Status implementacji i kolejne kroki

### ✅ Ukończone (Phase 1A + częściowo 1B):
- ✅ Podstawowa struktura aplikacji (Nx monorepo, Angular + NestJS)
- ✅ System uwierzytelniania (JWT, bcrypt, rejestracja, logowanie, logout)
- ✅ Baza danych (PostgreSQL + Supabase, migracje, RLS)
- ✅ Zarządzanie członkami rodziny (CRUD operations)
- ✅ Zarządzanie celami cyklicznymi (recurring goals)
- ✅ Zarządzanie zobowiązaniami cyklicznymi (fixed blocks)
- ✅ Generowanie harmonogramu z AI (OpenAI GPT-4o Turbo, 3 strategie)
- ✅ Grid calendar view (7 dni × sloty godzinowe, dual orientation)
- ✅ Kolorowanie członków rodziny z inicjałami
- ✅ Filtrowanie z przyciemnianiem (opacity + grayscale)
- ✅ Szybkie dodawanie aktywności (Quick Add modal)
- ✅ Szczegóły aktywności (tooltips + modal)
- ✅ Detekcja konfliktów czasowych z wizualnymi wskaźnikami
- ✅ Nawigacja między tygodniami (previous/next/today)
- ✅ Regeneracja tygodnia z zachowaniem ręcznych aktywności
- ✅ CI/CD (GitHub Actions: lint, unit tests, coverage)
- ✅ Dokumentacja (README, Architecture, Constraints, Testing guides)

### 🚧 W trakcie (Phase 1B - 85% complete):
- 🚧 System feedbacku dla sugestii AI (thumbs up/down) - planowane
- 🚧 Drag-and-drop edycja bloków czasowych - planowane
- 🚧 Ulepszenia accessibility (keyboard navigation, ARIA labels) - w trakcie

### 📋 Następne kroki (priorytety):
1. **Dokończyć Phase 1B:**
   - Implementacja systemu feedbacku (thumbs up/down)
   - Drag-and-drop dla edycji bloków
   - Kompletne wsparcie accessibility (WCAG 2.1 Level AA)
   - Rozszerzone testy E2E (Playwright)

2. **Przygotowanie do produkcji:**
   - Deployment na AWS (Lambda/API Gateway lub ECS)
   - Monitoring i logging (CloudWatch lub podobne)
   - Backup i disaster recovery
   - Performance testing i optymalizacja

3. **Phase 2 (post-MVP):**
   - Family Activity Finder (location + weather aware)
   - Meal Planner (quick recipes)
   - Google Calendar export
   - Shared family calendar
   - Responsive mobile/tablet UI

## 12. Status projektu (aktualizacja: styczeń 2026)

### Obecny stan: **MVP Phase 1A ✅ ukończona, Phase 1B 🚧 85% complete**

**Metryki projektu:**
- **Linie kodu:** ~15,000+ LOC (TypeScript)
- **Testy jednostkowe:** 15 plików spec (Jest)
- **Testy E2E:** 1 plik spec (Playwright) + infrastruktura gotowa
- **Coverage:** Monitorowane przez CI/CD z artefaktami
- **Projekty w monorepo:** 
  - Apps: `frontend`, `backend`, `frontend-e2e`, `backend-e2e`
  - Libs: `frontend/*`, `backend/*`, `shared/*` (struktura zgodna z Nx best practices)

**Kluczowe komponenty zaimplementowane:**
- 🔐 **Auth:** `libs/backend/feature-auth` (JWT, bcrypt, RLS)
- 📅 **Schedule:** `libs/backend/feature-schedule` (generator AI, persistence)
- 🎨 **Week View:** `libs/frontend/feature-week-view` (1546 LOC - główny komponent UI)
- 💾 **Data Access:** `libs/frontend/data-access-auth`, `libs/frontend/data-access-schedule`
- 🗄️ **Database:** Supabase migracje (5 plików SQL), TypeORM entities

**Infrastruktura:**
- ✅ CI/CD: GitHub Actions (lint, unit tests, coverage reports, PR comments)
- ✅ Dokumentacja: README, ARCHITECTURE, CONSTRAINTS, TESTING_GUIDE, CHANGELOG
- ✅ Quality gates: ESLint, Prettier, TypeScript strict mode
- ✅ Local dev environment: Supabase local, Webpack dev server, proxy config

**Następne milestones:**
1. Dokończyć feedback system (thumbs up/down)
2. Dodać drag-and-drop dla edycji
3. Ukończyć accessibility testing
4. Production deployment (AWS)

## 13. Roadmap

### ✅ Phase 1A - UKOŃCZONA (realizacja: 3 tygodnie)
Weekly Schedule Generator - podstawowa funkcjonalność + AI generowanie:
- ✅ Struktura Nx monorepo (Angular + NestJS)
- ✅ System uwierzytelniania (JWT + bcrypt)
- ✅ Baza danych (PostgreSQL + Supabase, migracje, RLS)
- ✅ Zarządzanie członkami rodziny, celami, zobowiązaniami
- ✅ Integracja OpenAI GPT-4o Turbo
- ✅ Generowanie harmonogramu z 3 strategiami
- ✅ CI/CD (GitHub Actions)

### 🚧 Phase 1B - W TRAKCIE (85% complete, cel: 6 tygodni)
Grid View Calendar Layout - implementacja widoku siatki tygodnia:
- ✅ Week 1: Core structure (CSS Grid, time column, day headers, sticky positioning)
- ✅ Week 2: Activity display (member colors, icons, stacking, multi-hour activities)
- ✅ Week 3: Interactions (tooltips, modal details, filtering with animations)
- ✅ Week 4: Advanced features (conflict detection, legend, performance optimization)
- 🚧 Week 5: Accessibility (ARIA labels, keyboard navigation, screen reader) - w trakcie
- 🚧 Week 6: Testing & refinement (unit/E2E tests, family feedback) - w trakcie

**Pozostałe zadania Phase 1B:**
- [ ] System feedbacku (thumbs up/down) dla sugestii AI
- [ ] Drag-and-drop edycja bloków czasowych
- [ ] Kompletne wsparcie accessibility (WCAG 2.1 Level AA)
- [ ] Rozszerzone testy E2E (Playwright)
- [ ] User acceptance testing z rodziną

### 📋 Phase 2 - PLANOWANA (4–6 tygodni)
Activity Finder + Meal Planner:
- [ ] Module 2: Family Activity Finder (location + weather aware)
- [ ] Module 3: Meal Planner (quick kid-friendly recipes)
- [ ] Kontekst między modułami (aktywności → posiłki)
- [ ] Google Calendar export
- [ ] Shared family calendar (multi-user collaboration)

### 📋 Phase 3 - PLANOWANA (2–4 tygodnie)
Responsive UI & Advanced Features:
- [ ] Mobile/tablet grid adaptations (responsive layout)
- [ ] Ulubione aktywności i przepisy (favorites)
- [ ] Historia planów (history view)
- [ ] Shopping list generation (z meal planner)
- [ ] Habit tracking (podstawowy)

### 📋 Phase 4 - PLANOWANA (2–4 tygodnie)
Production Deployment & Advanced Analytics:
- [ ] Produkcyjny deploy na AWS (Lambda/API Gateway lub ECS + Fargate)
- [ ] Monitoring i logging (CloudWatch)
- [ ] Backup & disaster recovery
- [ ] Performance monitoring i alerting
- [ ] Advanced habit tracking & analytics
- [ ] Cost optimization i caching strategies

## 14. Model danych (skrót)

### Kluczowe encje:
- **users** - użytkownicy aplikacji (email, hashed password, timestamps)
- **family_members** - członkowie rodziny (name, role, age, color, user_id FK)
- **recurring_goals** - cele cykliczne (name, description, frequency_per_week, preferred_duration, preferred_time_of_day, family_member_id FK)
- **recurring_commitments** - zobowiązania cykliczne (title, block_type, day_of_week, start_time, end_time, family_member_id FK)
- **weekly_schedules** - harmonogramy tygodniowe (week_start_date, is_ai_generated, user_id FK)
- **time_blocks** - bloki czasowe w harmonogramie (title, time_range TSTZRANGE, block_type, is_shared, metadata JSONB, schedule_id FK, family_member_id FK, recurring_goal_id FK)

### Bezpieczeństwo:
- Row-Level Security (RLS) dla izolacji danych użytkowników
- Soft delete (deleted_at) dla wszystkich encji
- Foreign keys z CASCADE dla spójności
- Parametryzowane zapytania (TypeORM) przeciw SQL injection

### Więcej szczegółów:
Zobacz `supabase/migrations/*.sql` oraz `docs/ARCHITECTURE.md`

## 15. Ograniczenia i założenia projektu

### Ograniczenia czasowe i zasobowe:
- **Główny developer:** 1 osoba (busy parent z fulltime job)
- **Dostępność:** ~10-15h/tydzień na development
- **Timeline MVP:** 2-4 miesiące (elastyczne)

### Ograniczenia techniczne:
- **Desktop-first:** Brak mobilnej wersji w MVP (tylko responsive web)
- **Single-user:** Brak współdzielenia kalendarza między użytkownikami w MVP
- **AI latency:** Max 15s dla generowania harmonogramu (constraint OpenAI)
- **Offline mode:** Brak - wymaga połączenia internetowego

### Założenia projektu:
- Użytkownicy mają stabilne połączenie internetowe
- Użytkownicy korzystają z nowoczesnych przeglądarek (Chrome/Edge/Firefox/Safari latest)
- Dane użytkowników mieszczą się w reasonable limits (do 100 celów, 50 członków rodziny)
- OpenAI API jest dostępne i stabilne (99%+ uptime)
- Użytkownicy są gotowi na iteracyjne ulepszenia (MVP to punkt startowy, nie końcowy)

### Scope OUT (nie w MVP):
- ❌ Integracja z Google Calendar
- ❌ Powiadomienia push/email
- ❌ Aplikacja mobilna (native iOS/Android)
- ❌ Multi-user real-time collaboration
- ❌ Habit tracking & advanced analytics
- ❌ Third-party integrations (Todoist, Notion, etc.)
- ❌ Social features (sharing plans publicly)
- ❌ Payment/subscription system

### Więcej szczegółów:
Zobacz `docs/CONSTRAINTS.md` dla pełnego opisu ograniczeń osobistych i projektowych.

## 16. Ryzyka i mitigacje

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitigacja | Status |
|--------|-------------------|-------|-----------|--------|
| AI tworzy nierealistyczne plany | Średnie | Wysokie | ✅ Warstwa walidacji + pełna edycja manualna zaimplementowana | Zmitigowane |
| Koszty OpenAI rosną ponad budżet | Średnie | Średnie | 🔄 Monitoring usage, cache promptów, możliwość przejścia na tańsze modele (gpt-4o-mini) | W monitoringu |
| Zbyt szerokie scope (feature creep) | Wysokie | Wysokie | ✅ Trzymanie się MVP, odkładanie Phase 2+, regularne review | Zmitigowane |
| Niska adopcja użytkowników | Średnie | Wysokie | 🔄 Priorytet na generator tygodnia, wsparcie feedbacku (w implementacji) | W trakcie |
| Problemy z wydajnością UI (duże tygodnie) | Niskie | Średnie | ✅ OnPush detection, signals, lazy rendering, memoizacja | Zmitigowane |
| Bezpieczeństwo danych (data breach) | Niskie | Krytyczne | ✅ JWT, bcrypt, RLS, parameterized queries, HTTPS | Zmitigowane |
| Awarie OpenAI API | Średnie | Średnie | ✅ Timeout 30s, error handling, retry logic, user messaging | Zmitigowane |
| Trudności z skalowaniem bazy | Niskie | Wysokie | ✅ PostgreSQL + Supabase (skalowalne), indeksy, connection pooling | Zmitigowane |
| Problemy z CI/CD | Niskie | Niskie | ✅ GitHub Actions stable, automated testing, artifacts | Zmitigowane |
| Developer burnout (1 osoba) | Średnie | Krytyczne | 🔄 Realistic timeline, MVP focus, breaks, family support | Monitorowane |

## 17. Glosariusz

**AI-generated blocks** - Bloki czasowe wygenerowane przez AI (OpenAI GPT-4o Turbo), oznaczone w metadata jako `generatedBy: 'ai'`

**Block Type** - Typ aktywności (WORK, EXERCISE, HOBBY, MEAL, COMMITMENT, FAMILY_TIME, PERSONAL_TIME, OTHER)

**Dual orientation** - Możliwość przełączania widoku kalendarza: dni jako kolumny (hours view) lub godziny jako kolumny (days view)

**Family Member** - Członek rodziny z rolą (USER, SPOUSE, CHILD), przypisanym kolorem i inicjałami

**Fixed blocks** - Zobowiązania cykliczne (recurring commitments) jak praca, które się powtarzają w stałych godzinach

**Grid Calendar** - Widok tygodnia w formie siatki (7 dni × sloty godzinowe) oparty na CSS Grid

**Manual blocks** - Bloki czasowe dodane ręcznie przez użytkownika (Quick Add), zachowywane podczas regeneracji

**Member filtering** - Funkcja filtrowania aktywności według członków rodziny z visual dimming (opacity + grayscale)

**MVP** - Minimum Viable Product - podstawowa wersja produktu z core features

**Nx monorepo** - Struktura projektu z wieloma aplikacjami i bibliotekami zarządzanymi przez Nx

**OnPush** - Strategia change detection w Angular optymalizująca wydajność

**Quick Add** - Modal pozwalający na szybkie dodanie aktywności bez generowania całego tygodnia

**Recurring Goals** - Cele cykliczne (np. fitness 3x/tydzień), uwzględniane przez AI podczas generowania

**Reschedule** - Regeneracja tygodnia przez AI z zachowaniem ręcznie dodanych aktywności

**RLS (Row-Level Security)** - Mechanizm bezpieczeństwa PostgreSQL izolujący dane użytkowników

**Shared activity** - Aktywność rodzinna (wszyscy członkowie), oznaczona specjalnym wzorem

**Soft delete** - Logiczne usuwanie rekordów (deleted_at) zamiast fizycznego usunięcia z bazy

**Strategy** - Strategia generowania harmonogramu (balanced, family-focused, productivity-first)

**Time Block** - Blok czasowy w harmonogramie z określonym zakresem godzin (TSTZRANGE)

**TSTZRANGE** - PostgreSQL data type dla zakresu czasu z timezone

**Week Start Date** - Data poniedziałku rozpoczynającego tydzień (harmonogram zawsze zaczyna się w poniedziałek)

---

**Dla pełnej dokumentacji technicznej zobacz:**
- `README.md` - Getting started, commands, tech stack
- `docs/ARCHITECTURE.md` - System architecture, data flow
- `docs/CONSTRAINTS.md` - Project constraints, personal limitations
- `TESTING_GUIDE.md` - Testing strategy, coverage
- `CHANGELOG.md` - Version history, changes

---

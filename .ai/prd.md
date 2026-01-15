# Dokument Wymagań Produktu (PRD) – Family Life Planner

## 1. Przegląd
Family Life Planner to desktopowa aplikacja webowa, która konsoliduje wszystkie zobowiązania rodziny (praca, cele, posiłki, aktywności) i umożliwia generowanie tygodniowego planu za pomocą AI (GPT-4o Turbo). Użytkownik wprowadza priorytety, a system podpowiada harmonogramy, pomysły na aktywności i posiłki, które można ręcznie dopracować.

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
   - dane użytkowników przechowywane bezpiecznie, z myślą o przyszłym skalowaniu (localStorage → baza).

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

## 5. Historyjki użytkowników
- Wprowadzenie fixed blocks (praca, wyjazdy) → system zna ograniczenia.
- Definiowanie recurring goals (fitness, hobby, relacje) → algorytm je planuje.
- Generowanie tygodniowego kalendarza → użytkownik widzi trade-offy i konflikty.
- Poprawianie planu i feedback (thumbs up/down) → AI się uczy.
- Znalezienie aktywności lub przepisów w oparciu o kontekst (czas, pogoda, składniki).

## 5. Historyjki użytkowników

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
- **Frontend:** Angular 20+, standalone components, reactive forms, HttpClient, RxJS/Signals, SCSS.
  - **Layout:** CSS Grid dla week view, sticky positioning dla headers
  - **State Management:** Angular signals z computed i memoizacją
  - **Optymalizacja:** OnPush change detection, track functions, lazy rendering
  - **Animacje:** CSS transitions (200ms fade, 100ms hover)
  - **Icons:** Emoji (💼 💪 🍽️ 📌 👨‍👩‍👧‍👦) - zero dependencies
- **Backend:** NestJS, REST, OpenAI SDK, (Zod validation).
- **AI:** GPT-4o Turbo (max 15 s, fallback plan).
- **Deployment:** AWS (Lambda/API Gateway).
- **Storage:** localStorage na start, potem Postgres.
- **Auth:** login/hasło, (później Cognito).

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


## 10. Otwarte pytania
1. Czy integracja z Google Calendar wchodzi do Phase 1? 
    - Nie
2. W którą fazę planujemy multi-user / family sharing? 
    - Później
3. Jak AI powinno zachować się po edycji planu przez użytkownika?
    - TBD
4. Jak wygląda fallback przy opóźnieniu/awarii Claude?
    - TBD
5. Ile danych profilu (np. okna dostępności, poziomy energii) musimy zebrać już w MVP?
    - TBD

## 11. Kolejne kroki
- Opisać osoby i rytmy tygodnia.
- Sporządzić user journey (onboarding → profil → plan → feedback).
- Zaprojektować UI: kalendarz tygodniowy, panel AI, feedback controls.
- Zdefiniować mapę promptów i strategię wersjonowania dla Claude.
- Określić strategię przechowywania feedbacku i historii planów.

## 12. Roadmap
- **Phase 1A (2–3 tygodnie):** Weekly Schedule Generator - podstawowa funkcjonalność + AI generowanie.
- **Phase 1B (4–6 tygodni):** Grid View Calendar Layout - implementacja widoku siatki tygodnia:
  - Week 1: Core structure (CSS Grid, time column, day headers, sticky positioning)
  - Week 2: Activity display (member colors, icons, stacking, multi-hour activities)
  - Week 3: Interactions (tooltips, modal details, filtering with animations)
  - Week 4: Advanced features (conflict detection, legend, performance optimization)
  - Week 5: Accessibility (ARIA labels, keyboard navigation, screen reader)
  - Week 6: Testing & refinement (unit/E2E tests, family feedback)
- **Phase 2 (4–6 tygodni):** Activity Finder + Meal Planner, kontekst między modułami, Google Calendar export.
- **Phase 3 (2–4 tygodni):** Responsive UI (mobile/tablet grid adaptations), ulubione, historia, shopping list.
- **Phase 4 (2–4 tygodni):** Produkcyjny deploy (AWS), Cognito, baza danych, CI/CD, habit tracking.

## 13. Ryzyka i mitigacje
| Ryzyko | Mitigacja |
|--------|-----------|
| AI tworzy nierealistyczne plany | warstwa walidacji + pełna edycja manualna |
| Koszty OpenAI rosną | przejście na tańsze modele, cache promptów |
| Zbyt szerokie scope | trzymać się MVP, odkładać Phase 2+ |
| Niska adopcja | priorytetowy moduł planera tygodnia + wsparcie feedbacku |

---

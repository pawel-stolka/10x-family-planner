# Dokument Wymagań Produktu (PRD) – Family Life Planner

## 1. Przegląd
Family Life Planner to desktopowa aplikacja webowa, która konsoliduje wszystkie zobowiązania rodziny (praca, cele, posiłki, aktywności) i umożliwia generowanie tygodniowego planu za pomocą AI (Claude 4.5 Sonnet). Użytkownik wprowadza priorytety, a system podpowiada harmonogramy, pomysły na aktywności i posiłki, które można ręcznie dopracować.

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
- Deklarowana dostępność na desktopie (web-first, responsywność w przyszłości).
- Obsługa AI z czasem odpowiedzi ≤15 sekund (Claude 4.5 Sonnet).
- Brak powiadomień, udostępniania i Google Calendar w MVP.

## 5. Historyjki użytkowników
- Wprowadzenie fixed blocks (praca, wyjazdy) → system zna ograniczenia.
- Definiowanie recurring goals (fitness, hobby, relacje) → algorytm je planuje.
- Generowanie tygodniowego kalendarza → użytkownik widzi trade-offy i konflikty.
- Poprawianie planu i feedback (thumbs up/down) → AI się uczy.
- Znalezienie aktywności lub przepisów w oparciu o kontekst (czas, pogoda, składniki).

## 6. Moduły MVP (Phase 1)

### Module 1 – Weekly Schedule Generator
**Cel:** Generować realistyczny plan tygodniowy obejmujący wszystkie priorytety.
- **Wejścia:** fixed blocks (praca, wyjazdy), recurring goals (fitness, relacje), side projects, preferencje energii.
- **Wyjścia:** kalendarz (Mon–Sun), trade-offy, konflikty, przycisk „Regenerate”.
- **Kryteria sukcesu:** realistyczny plan ≥80% przypadków, cotygodniowe użycie.

### Module 2 – Family Activity Finder
**Cel:** Znaleźć 3–5 dopasowanych aktywności.
- **Wejścia:** lokalizacja, wiek dzieci, czas, pogoda, zainteresowania, okna drzemki.
- **Wyjścia:** propozycje z logistyką, backup na zmiany pogody.
- **Kryteria sukcesu:** korzystanie 2–3x tygodniowo, trafność.

### Module 3 – Meal Planner
**Cel:** Zaproponować szybkie, kid-friendly przepisy.
- **Wejścia:** typ posiłku, czas, ograniczenia dietetyczne, składniki, poziom trudności.
- **Wyjścia:** 3–5 przepisów z hackami dla wybrednych, instrukcje krok po kroku, opcjonalnie restauracje.
- **Kryteria sukcesu:** korzystanie 3–5x tygodniowo, czas <30 min.

## 7. Non-goals (Phase 1)
- Multi-user collaboration / shared calendar.
- Habit tracking i zaawansowana analityka.
- Powiadomienia/powiększenia w czasie rzeczywistym.
- Aplikacja mobilna (tylko desktop-responsive).
- Integracja z Google Calendar i generowanie list zakupów.

## 8. Stos technologiczny
- **Frontend:** Angular 20+, standalone components, reactive forms, HttpClient, RxJS/Signals, SCSS.
- **Backend:** NestJS, REST, OpenAI SDK, (Zod validation).
- **AI:** Claude 4.5 Sonnet (max 15 s, fallback plan).
- **Deployment:** AWS (Lambda/API Gateway).
- **Storage:** localStorage na start, potem Postgres.
- **Auth:** login/hasło, (później Cognito).

## 9. Metryki sukcesu
- Cotygodniowe korzystanie z generatora (cel: cotygodniowa sesja).
- ≥80% AI-generated planów akceptowanych bez dużych poprawek.
- Wskaźnik feedbacku (thumbs up/down) rosnący.
- Zmniejszenie czasu planowania o ≥30 min tygodniowo.
- Wykorzystanie modułów aktywności i posiłków 2–3 razy w tygodniu.

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
- **Phase 1 (2–4 tygodnie):** Weekly Schedule Generator + Activity Finder + Meal Planner.
- **Phase 2 (4–6 tygodni):** Ujednolicona tablica, kontekst między modułami, Google Calendar export, „What if?” mode.
- **Phase 3 (2–4 tygodni):** Responsive UI, ulubione, historia, shopping list, habit tracking.
- **Phase 4 (2–4 tygodni):** Produkcyjny deploy (AWS), Cognito, baza danych, CI/CD.

## 13. Ryzyka i mitigacje
| Ryzyko | Mitigacja |
|--------|-----------|
| AI tworzy nierealistyczne plany | warstwa walidacji + pełna edycja manualna |
| Koszty OpenAI rosną | przejście na tańsze modele, cache promptów |
| Zbyt szerokie scope | trzymać się MVP, odkładać Phase 2+ |
| Niska adopcja | priorytetowy moduł planera tygodnia + wsparcie feedbacku |

---

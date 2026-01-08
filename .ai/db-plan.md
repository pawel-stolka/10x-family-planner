<conversation_summary>
<decisions>
1. Na tym etapie użytkownik nie podjął jeszcze żadnych wiążących decyzji dotyczących projektu bazy danych; wszystkie kwestie pozostają do potwierdzenia w kolejnej iteracji.
</decisions>

<matched_recommendations>
1. Użycie klucza głównego `schedule_id (UUID)` + unikatowego ograniczenia `(user_id, week_start_date)` dla tabeli `weekly_schedules`.
2. Jedna tabela `time_blocks` z kolumną `block_type ENUM` zamiast rozdzielania posiłków i aktywności.
3. Reprezentacja reguł cyklicznych w `recurring_goals` jako `JSONB` (np. RRULE) z indeksami GIN.
4. Tabela `feedback` z opcjonalnym `block_id` dla ocen planu lub pojedynczych bloków.
5. Cache sugestii AI w tabeli `suggestions_cache` (JSONB + TTL) zamiast pełnych encji `activities` i `recipes` w MVP.
6. Brak partycjonowania w MVP, ale przygotowanie do RANGE PARTITION po `week_start_date`.
7. Włączenie RLS ze wzorcem `USING (user_id = current_setting('app.user_id')::uuid)` oraz szkielet roli „admin”.
8. Soft-delete (`deleted_at`) z częściowym indeksem `WHERE deleted_at IS NULL` dla zgodności z RODO.
9. Indeks złożony `(user_id, start_time, end_time)` i `EXCLUDE USING GIST` na `tstzrange` w `time_blocks` dla detekcji kolizji.
10. Dzienna tabela agregatów `usage_stats` + materializowany widok tygodniowy odświeżany cronem.
</matched_recommendations>

<database_planning_summary>
Główne wymagania:
• Przechowywanie tygodniowych planów, bloków czasowych (praca, aktywności, posiłki), celów cyklicznych, sugestii AI, feedbacku i statystyk użycia.  
• Obsługa wielu użytkowników z pełną izolacją danych (RLS).  
• Możliwość szybkiej walidacji nakładających się bloków i edycji planu.  
• Minimalne koszty AI dzięki keszowaniu sugestii.  
• Zgodność z RODO poprzez soft-delete.

Kluczowe encje i relacje:  
• `users (1) ──< weekly_schedules (N)`  
• `weekly_schedules (1) ──< time_blocks (N)`  
• `users (1) ──< recurring_goals (N)`  
• `weekly_schedules (1) ──< feedback (N)`  ( `block_id` opcjonalne )  
• `users (1) ──< suggestions_cache (N)`  
• `users (1) ──< usage_stats (N)`  

Istotne kwestie bezpieczeństwa i skalowalności:  
• Globalne włączenie RLS z politykami per-tabela na `user_id`; rola „admin” może by-pass.  
• Soft-delete + częściowe indeksy zapewniają szybkie zapytania na aktywnych rekordach i opcję odzysku.  
• Przygotowanie do partycjonowania `time_blocks`/`weekly_schedules` po `week_start_date` ułatwi archiwizację i analizy big-data.  
• Indeksy GIN na kolumnach JSONB (`recurring_goals.rules`, `suggestions_cache.payload`) przyspieszą query, a `EXCLUDE USING GIST` przeciwdziała konfliktom czasowym.  
• Materializowane widoki zmniejszą koszt raportów, a TTL w `suggestions_cache` ograniczy rozrost danych.

</database_planning_summary>

<unresolved_issues>
1. Potwierdzenie struktury klucza głównego i unikalności w `weekly_schedules`.
2. Wybór jednego vs. wielu typów bloków (enum vs. osobne tabele) – obecnie rekomendacja to enum.
3. Format przechowywania reguł cyklicznych (JSONB vs. kolumny znormalizowane).
4. Zakres danych, które mają podlegać soft-delete i okres ich przechowywania.
5. Szczegóły TTL oraz strategia czyszczenia `suggestions_cache`.
6. Zakres i treść pól w `usage_stats` oraz częstotliwość odświeżania widoków.
7. Dokładne zasady RLS dla przyszłego udostępniania kalendarza wielo-użytkownikowego.
8. Czy w MVP wymagane są historyczne wersje planu tygodniowego (audyt)?
9. Kiedy wprowadzić partycjonowanie i czy zastosować HASH po `user_id` w dodatku do RANGE.
10. Wymagana granularność feedbacku (plan vs. blok) oraz ewentualne metadane (np. przyczyna odrzucenia).
</unresolved_issues>
</conversation_summary>
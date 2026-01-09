# Family Life Planner – Schemat bazy danych (PostgreSQL)

> Wszystkie tabele używają kolumny `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` oraz `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` (aktualizowane triggerem) oraz miękkiego usuwania `deleted_at TIMESTAMPTZ`.  
> Dla czytelności pominięto ich wielokrotne powtarzanie w sekcji kolumn.

## 1. Tabele, kolumny i ograniczenia

### 1.1 users

This table is managed by Supabase Auth

| Kolumna                 | Typ         | Ograniczenia      |
| ----------------------- | ----------- | ----------------- |
| id                      | UUID        | PRIMARY KEY       |
| email                   | TEXT        | NOT NULL, UNIQUE  |
| password_hash           | TEXT        | NOT NULL          |
| display_name            | TEXT        |                   |
| created_at / updated_at | TIMESTAMPTZ | patrz uwaga wyżej |
| deleted_at              | TIMESTAMPTZ |                   |

### 1.2 family_member_role enum

```sql
CREATE TYPE family_member_role AS ENUM ('USER', 'SPOUSE', 'CHILD');
```

### 1.3 family_members

| Kolumna                 | Typ                | Ograniczenia                                     |
| ----------------------- | ------------------ | ------------------------------------------------ |
| family_member_id        | UUID               | PRIMARY KEY                                      |
| user_id                 | UUID               | NOT NULL, REFERENCES users(id) ON DELETE CASCADE |
| name                    | TEXT               | NOT NULL                                         |
| role                    | family_member_role | NOT NULL                                         |
| age                     | SMALLINT           | -- dla dzieci                                    |
| preferences             | JSONB              | DEFAULT '{}'::jsonb -- zainteresowania, energia  |
| created_at / updated_at | TIMESTAMPTZ        | NOT NULL DEFAULT now()                           |
| deleted_at              | TIMESTAMPTZ        |                                                  |

Uwaga: Każdy `user` (właściciel konta) automatycznie otrzymuje własny wpis w `family_members` z `role='USER'`.

### 1.5 weekly_schedules

| Kolumna                 | Typ         | Ograniczenia                                     |
| ----------------------- | ----------- | ------------------------------------------------ |
| schedule_id             | UUID        | PRIMARY KEY                                      |
| user_id                 | UUID        | NOT NULL, REFERENCES users(id) ON DELETE CASCADE |
| week_start_date         | DATE        | NOT NULL                                         |
| is_ai_generated         | BOOLEAN     | DEFAULT FALSE                                    |
| metadata                | JSONB       | DEFAULT '{}'::jsonb                              |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now()                           |
| deleted_at              | TIMESTAMPTZ |                                                  |

Unikalność: `(user_id, week_start_date)`

### 1.6 block_type enum

```sql
CREATE TYPE block_type AS ENUM ('WORK', 'ACTIVITY', 'MEAL', 'OTHER');
```

### 1.7 time_blocks

| Kolumna                 | Typ         | Ograniczenia                                                         |
| ----------------------- | ----------- | -------------------------------------------------------------------- |
| block_id                | UUID        | PRIMARY KEY                                                          |
| schedule_id             | UUID        | NOT NULL, REFERENCES weekly_schedules(schedule_id) ON DELETE CASCADE |
| recurring_goal_id       | UUID        | REFERENCES recurring_goals(goal_id) ON DELETE SET NULL               |
| family_member_id        | UUID        | REFERENCES family_members(family_member_id) ON DELETE SET NULL       |
| title                   | TEXT        | NOT NULL                                                             |
| block_type              | block_type  | NOT NULL                                                             |
| time_range              | TSTZRANGE   | NOT NULL                                                             |
| is_shared               | BOOLEAN     | DEFAULT FALSE -- aktywność z wieloma członkami rodziny               |
| metadata                | JSONB       | DEFAULT '{}'::jsonb                                                  |
| created_at / updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now()                                               |
| deleted_at              | TIMESTAMPTZ |                                                                      |

Ograniczenie kolizji: `EXCLUDE USING GIST (schedule_id WITH =, family_member_id WITH =, time_range WITH &&) WHERE (deleted_at IS NULL AND is_shared = FALSE)`

Uwaga: Kolizje sprawdzane są tylko dla bloków NIE-współdzielonych tego samego członka rodziny.

### 1.8 recurring_goals

| Kolumna                     | Typ         | Ograniczenia                                                         |
| --------------------------- | ----------- | -------------------------------------------------------------------- |
| goal_id                     | UUID        | PRIMARY KEY                                                          |
| user_id                     | UUID        | NOT NULL, REFERENCES users(id) ON DELETE CASCADE                     |
| family_member_id            | UUID        | NOT NULL, REFERENCES family_members(family_member_id) ON DELETE CASCADE |
| name                        | TEXT        | NOT NULL                                                             |
| description                 | TEXT        |                                                                      |
| frequency_per_week          | SMALLINT    | DEFAULT 1 CHECK (frequency_per_week > 0)                             |
| preferred_duration_minutes  | INTEGER     | CHECK (preferred_duration_minutes > 0)                               |
| preferred_time_of_day       | TEXT[]      | -- np. ['morning', 'afternoon', 'evening']                           |
| priority                    | SMALLINT    | DEFAULT 0                                                            |
| rules                       | JSONB       | DEFAULT '{}'::jsonb -- dodatkowe reguły (np. RRULE)                  |
| created_at / updated_at     | TIMESTAMPTZ | NOT NULL DEFAULT now()                                               |
| deleted_at                  | TIMESTAMPTZ |                                                                      |

GIN index na `rules`.

### 1.9 feedback

| Kolumna     | Typ         | Ograniczenia                                                         |
| ----------- | ----------- | -------------------------------------------------------------------- |
| feedback_id | UUID        | PRIMARY KEY                                                          |
| user_id     | UUID        | NOT NULL, REFERENCES users(id) ON DELETE CASCADE                     |
| schedule_id | UUID        | NOT NULL, REFERENCES weekly_schedules(schedule_id) ON DELETE CASCADE |
| block_id    | UUID        | REFERENCES time_blocks(block_id) ON DELETE CASCADE                   |
| rating      | SMALLINT    | NOT NULL CHECK (rating IN (-1, 1))                                   |
| comments    | TEXT        |                                                                      |
| created_at  | TIMESTAMPTZ | DEFAULT now()                                                        |

### 1.10 suggestion_type enum

```sql
CREATE TYPE suggestion_type AS ENUM ('ACTIVITY', 'MEAL');
```

### 1.11 suggestions_cache

| Kolumna         | Typ             | Ograniczenia                                     |
| --------------- | --------------- | ------------------------------------------------ |
| cache_id        | UUID            | PRIMARY KEY                                      |
| user_id         | UUID            | NOT NULL, REFERENCES users(id) ON DELETE CASCADE |
| suggestion_type | suggestion_type | NOT NULL                                         |
| payload         | JSONB           | NOT NULL                                         |
| expires_at      | TIMESTAMPTZ     | NOT NULL                                         |
| created_at      | TIMESTAMPTZ     | DEFAULT now()                                    |

Indeks częściowy na `expires_at WHERE expires_at > now()`.

### 1.12 usage_stats (tabela dzienna)

| Kolumna         | Typ                   | Ograniczenia                                     |
| --------------- | --------------------- | ------------------------------------------------ |
| user_id         | UUID                  | NOT NULL, REFERENCES users(id) ON DELETE CASCADE |
| stats_date      | DATE                  | NOT NULL                                         |
| generated_count | INTEGER               | DEFAULT 0                                        |
| accepted_count  | INTEGER               | DEFAULT 0                                        |
| PRIMARY KEY     | (user_id, stats_date) |

Materializowany widok `weekly_usage_stats` (user_id, iso_week, generated_sum, accepted_sum) odświeżany cronem.

---

## 2. Relacje między tabelami

```
users (1) ──< family_members (N)
users (1) ──< weekly_schedules (N)
users (1) ──< recurring_goals (N)
family_members (1) ──< recurring_goals (N)
family_members (1) ──< time_blocks (N)  [opcjonalnie]
weekly_schedules (1) ──< time_blocks (N)
recurring_goals (1) ──< time_blocks (N)  [opcjonalnie]
users (1) ──< feedback (N)  ──> weekly_schedules (1)  ──> time_blocks (0..1)
users (1) ──< suggestions_cache (N)
users (1) ──< usage_stats (N)
```

## 3. Indeksy

1. `users_email_idx` UNIQUE ON users(email)
2. `family_members_user_idx` BTREE ON family_members(user_id) WHERE deleted_at IS NULL
3. `weekly_schedules_unique_idx` UNIQUE ON weekly_schedules(user_id, week_start_date) WHERE deleted_at IS NULL
4. `time_blocks_time_excl` EXCLUDE GIST (schedule_id WITH =, family_member_id WITH =, time_range WITH &&) WHERE deleted_at IS NULL AND is_shared = FALSE
5. `time_blocks_type_idx` BTREE ON time_blocks(block_type) WHERE deleted_at IS NULL
6. `time_blocks_family_member_idx` BTREE ON time_blocks(family_member_id) WHERE deleted_at IS NULL
7. `recurring_goals_family_member_idx` BTREE ON recurring_goals(family_member_id) WHERE deleted_at IS NULL
8. `recurring_goals_rules_gin` GIN ON recurring_goals(rules)
9. `suggestions_cache_payload_gin` GIN ON suggestions_cache(payload)
10. `suggestions_cache_valid_idx` BTREE ON suggestions_cache(expires_at) WHERE expires_at > now()
11. `usage_stats_date_idx` BTREE ON usage_stats(stats_date)

## 4. Zasady PostgreSQL (Row-Level Security)

Przykład dla tabeli powiązanej z `user_id` (analogicznie dla pozostałych):

```sql
ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_isolation ON weekly_schedules
USING (user_id = current_setting('app.user_id')::uuid);

-- Rola administracyjna
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
ALTER ROLE admin SET app.bypass_rls = true; -- w funkcjach SECURITY DEFINER
```

• W aplikacji, po uwierzytelnieniu, wykonywać `SET app.user_id = '<uuid>'` w sesji.  
• Polityki kopiować do: `family_members`, `time_blocks`, `recurring_goals`, `feedback`, `suggestions_cache`, `usage_stats`.

## 5. Dodatkowe uwagi projektowe

- **Struktura rodziny (US-003):** Tabela `family_members` umożliwia przypisanie współmałżonka i dzieci. Każdy `recurring_goal` i `time_block` jest powiązany z konkretnym członkiem rodziny.
- **Parametry aktywności (US-003):** `recurring_goals` zawiera pola `frequency_per_week`, `preferred_duration_minutes`, `preferred_time_of_day` dla precyzyjnego planowania przez AI.
- **Bloki współdzielone:** Pole `is_shared` w `time_blocks` oznacza aktywności rodzinne (np. wspólny obiad, wyjazd), gdzie constraint kolizji nie obowiązuje.
- Soft-delete (`deleted_at`) + częściowe indeksy zapewniają zgodność z RODO i szybkie zapytania na aktywnych rekordach.
- Przygotowanie do partycjonowania RANGE po `week_start_date` dla `weekly_schedules` i `time_blocks` ułatwi archiwizację.
- `tstzrange` + constraint EXCLUDE zabezpiecza przed nakładającymi się blokami w obrębie jednego planu (osobno dla każdego członka rodziny).
- `rules` w `recurring_goals` przechowuje dodatkowe reguły cykliczności (np. RFC-5545 RRULE); GIN umożliwia wyszukiwanie.
- `suggestions_cache` ogranicza koszty OpenAI; TTL egzekwowany jobem `pg_cron` lub lambda cleanup.
- `usage_stats` i widoki materializowane wspierają metryki produktu bez obciążania tabel transakcyjnych.
- Enums `block_type`, `suggestion_type`, `family_member_role` ułatwiają walidację na poziomie SQL i implementację w TypeScripcie (generatory typów).

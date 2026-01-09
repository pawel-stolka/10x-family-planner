# API Endpoint Implementation Plan: Get Weekly Schedule

## Scope / Zakres implementacji

**Ten plan obejmuje:**

- ✅ **Backend (NestJS)**: Controllers, Services, Guards, Filters, Entities (TypeORM), DTOs
- ✅ **Shared Types**: Interfaces i enums w `libs/shared/models-schedule/` używane przez frontend i backend
- ❌ **Frontend (Angular)**: NIE jest częścią tego planu - komponenty Angular będą w osobnym planie

**Technologie:**

- NestJS (backend framework)
- TypeORM (ORM dla PostgreSQL)
- Supabase Auth (JWT validation)
- PostgreSQL + RLS (Row Level Security)

---

## 1. Przegląd punktu końcowego

Endpoint `GET /v1/weekly-schedules/{scheduleId}` służy do pobierania szczegółów pojedynczego harmonogramu tygodniowego wraz ze wszystkimi powiązanymi blokami czasowymi. Jest to kluczowy endpoint dla wyświetlania kompletnego widoku tygodnia użytkownika, zawierającego wszystkie zaplanowane aktywności, posiłki, pracę i inne bloki czasowe.

**Główne cele:**

- Zwrócić pełne dane harmonogramu tygodniowego
- Uwzględnić wszystkie bloki czasowe (time_blocks) z metadanymi
- Zapewnić szybki odczyt dzięki eager loading
- Egzekwować izolację danych między użytkownikami (RLS + application-level)
- Obsłużyć miękkie usuwanie (soft-delete) na wszystkich poziomach

## 2. Szczegóły żądania

### Metoda HTTP

`GET`

### Struktura URL

```
/v1/weekly-schedules/{scheduleId}
```

### Parametry

#### Wymagane (Path Parameters)

- **scheduleId** (UUID, path parameter)
  - Format: UUID v4
  - Opis: Unikalny identyfikator harmonogramu tygodniowego
  - Walidacja: Musi być poprawnym UUID
  - Przykład: `550e8400-e29b-41d4-a716-446655440000`

#### Opcjonalne

Brak - endpoint zwraca pełne dane bez dodatkowych filtrów

### Headers

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body

Brak (GET request)

### Przykład wywołania

```bash
curl -X GET "https://api.family-planner.com/v1/weekly-schedules/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

#### WeeklyScheduleDto

```typescript
export class WeeklyScheduleDto {
  scheduleId: string; // UUID
  userId: string; // UUID
  weekStartDate: string; // ISO 8601 date (YYYY-MM-DD)
  isAiGenerated: boolean;
  metadata: Record<string, any>;
  timeBlocks: TimeBlockDto[];
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}
```

#### TimeBlockDto

```typescript
export class TimeBlockDto {
  blockId: string; // UUID
  scheduleId: string; // UUID
  recurringGoalId?: string; // UUID, optional
  familyMemberId?: string; // UUID, optional
  title: string;
  blockType: BlockType; // WORK | ACTIVITY | MEAL | OTHER
  timeRange: TimeRangeDto;
  isShared: boolean;
  metadata: Record<string, any>;
  familyMember?: FamilyMemberDto; // Populated if familyMemberId exists
  recurringGoal?: RecurringGoalDto; // Populated if recurringGoalId exists
  createdAt: string;
  updatedAt: string;
}
```

#### TimeRangeDto

```typescript
export class TimeRangeDto {
  start: string; // ISO 8601 timestamp with timezone
  end: string; // ISO 8601 timestamp with timezone
}
```

#### FamilyMemberDto (nested)

```typescript
export class FamilyMemberDto {
  familyMemberId: string; // UUID
  name: string;
  role: FamilyMemberRole; // USER | SPOUSE | CHILD
  age?: number;
}
```

#### RecurringGoalDto (nested, minimal)

```typescript
export class RecurringGoalDto {
  goalId: string; // UUID
  name: string;
  frequencyPerWeek: number;
}
```

### Validation DTOs

#### GetScheduleParamsDto

```typescript
export class GetScheduleParamsDto {
  @IsUUID('4')
  scheduleId: string;
}
```

### Enums

```typescript
export enum BlockType {
  WORK = 'WORK',
  ACTIVITY = 'ACTIVITY',
  MEAL = 'MEAL',
  OTHER = 'OTHER',
}

export enum FamilyMemberRole {
  USER = 'USER',
  SPOUSE = 'SPOUSE',
  CHILD = 'CHILD',
}
```

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)

```json
{
  "scheduleId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "weekStartDate": "2026-01-13",
  "isAiGenerated": true,
  "metadata": {
    "generationStrategy": "balanced",
    "aiModel": "gpt-4o"
  },
  "timeBlocks": [
    {
      "blockId": "123e4567-e89b-12d3-a456-426614174000",
      "scheduleId": "550e8400-e29b-41d4-a716-446655440000",
      "recurringGoalId": "abc12345-e89b-12d3-a456-426614174111",
      "familyMemberId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "title": "Morning Workout",
      "blockType": "ACTIVITY",
      "timeRange": {
        "start": "2026-01-13T06:00:00Z",
        "end": "2026-01-13T07:00:00Z"
      },
      "isShared": false,
      "metadata": {
        "location": "Home gym",
        "intensity": "high"
      },
      "familyMember": {
        "familyMemberId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "name": "John",
        "role": "USER",
        "age": null
      },
      "recurringGoal": {
        "goalId": "abc12345-e89b-12d3-a456-426614174111",
        "name": "Fitness routine",
        "frequencyPerWeek": 3
      },
      "createdAt": "2026-01-09T12:00:00Z",
      "updatedAt": "2026-01-09T12:00:00Z"
    },
    {
      "blockId": "223e4567-e89b-12d3-a456-426614174001",
      "scheduleId": "550e8400-e29b-41d4-a716-446655440000",
      "recurringGoalId": null,
      "familyMemberId": null,
      "title": "Family Dinner",
      "blockType": "MEAL",
      "timeRange": {
        "start": "2026-01-13T18:00:00Z",
        "end": "2026-01-13T19:00:00Z"
      },
      "isShared": true,
      "metadata": {
        "recipe": "Pasta Carbonara",
        "participants": ["John", "Anna", "Kids"]
      },
      "familyMember": null,
      "recurringGoal": null,
      "createdAt": "2026-01-09T12:00:00Z",
      "updatedAt": "2026-01-09T12:00:00Z"
    }
  ],
  "createdAt": "2026-01-09T12:00:00Z",
  "updatedAt": "2026-01-09T12:00:00Z"
}
```

### Error Responses

#### 400 Bad Request - Invalid UUID

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "scheduleId must be a valid UUID",
  "timestamp": "2026-01-09T12:34:56Z",
  "path": "/v1/weekly-schedules/invalid-uuid"
}
```

#### 401 Unauthorized - Missing/Invalid Token

```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token",
  "timestamp": "2026-01-09T12:34:56Z",
  "path": "/v1/weekly-schedules/550e8400-e29b-41d4-a716-446655440000"
}
```

#### 404 Not Found - Schedule Not Exists

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Weekly schedule not found",
  "timestamp": "2026-01-09T12:34:56Z",
  "path": "/v1/weekly-schedules/550e8400-e29b-41d4-a716-446655440000"
}
```

#### 500 Internal Server Error

```json
{
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2026-01-09T12:34:56Z",
  "path": "/v1/weekly-schedules/550e8400-e29b-41d4-a716-446655440000"
}
```

## 5. Przepływ danych

### Architektura warstw

```
Client Request
      ↓
API Gateway (AWS) - Rate Limiting (60 req/min/user)
      ↓
NestJS Controller (schedule.controller.ts)
      ↓
JwtAuthGuard - Walidacja JWT & ekstakcja userId
      ↓
ValidationPipe - Walidacja scheduleId (UUID)
      ↓
ScheduleService (schedule.service.ts)
      ↓
┌─────────────────────────────────────────┐
│ Database Session Setup:                 │
│ SET app.user_id = '<userId>'            │
└─────────────────────────────────────────┘
      ↓
PostgreSQL Query (with RLS enabled)
      ↓
┌─────────────────────────────────────────┐
│ SELECT ws.*, tb.*, fm.*, rg.*           │
│ FROM weekly_schedules ws                │
│ LEFT JOIN time_blocks tb                │
│   ON ws.schedule_id = tb.schedule_id    │
│   AND tb.deleted_at IS NULL             │
│ LEFT JOIN family_members fm             │
│   ON tb.family_member_id = fm.family_member_id │
│   AND fm.deleted_at IS NULL             │
│ LEFT JOIN recurring_goals rg            │
│   ON tb.recurring_goal_id = rg.goal_id  │
│   AND rg.deleted_at IS NULL             │
│ WHERE ws.schedule_id = $1               │
│   AND ws.deleted_at IS NULL             │
│   AND ws.user_id = current_setting('app.user_id')::uuid │
└─────────────────────────────────────────┘
      ↓
Entity to DTO Transformation
      ↓
JSON Response (200 OK)
      ↓
Client
```

### Szczegółowy przepływ

1. **Request Reception**

   - API Gateway otrzymuje request z JWT w nagłówku Authorization
   - Rate limiter sprawdza limit 60 req/min/user
   - Request przekazywany do NestJS

2. **Authentication & Authorization**

   - `JwtAuthGuard` weryfikuje token JWT z Supabase
   - Ekstraktuje `userId` z tokenu (claim `sub`)
   - Dodaje `userId` do request context

3. **Input Validation**

   - `ValidationPipe` waliduje `scheduleId` jako UUID v4
   - Zwraca 400 Bad Request przy błędnej walidacji

4. **Controller Layer**

   - `ScheduleController.getScheduleById()` odbiera request
   - Przekazuje `scheduleId` i `userId` do serwisu

5. **Service Layer**

   - `ScheduleService.findScheduleById()` wykonuje:
     - Ustawia sesję DB: `SET app.user_id = '<userId>'`
     - Query z eager loading relacji (time_blocks, family_members, recurring_goals)
     - Sprawdza czy znaleziono rekord (404 jeśli nie)
     - Weryfikuje ownership (403 jeśli user_id nie pasuje)

6. **Database Layer**

   - RLS policy automatycznie filtruje po `user_id`
   - Partial indices na `deleted_at IS NULL` przyspieszają query
   - BTREE indeksy na foreign keys optymalizują JOINs

7. **Transformation**

   - Konwersja entity → DTO
   - Transformacja TSTZRANGE → TimeRangeDto (start/end)
   - Serializacja JSONB metadata

8. **Response**
   - Zwrócenie WeeklyScheduleDto jako JSON
   - Status 200 OK

## 6. Względy bezpieczeństwa

### Authentication

**JWT Validation**

- Token musi być podpisany przez Supabase Auth
- Sprawdzanie `exp` (expiration time) - automatyczne w NestJS JwtModule
- Weryfikacja issuer (`iss`) i audience (`aud`)

**Implementation:**

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
```

### Authorization

**Row-Level Security (RLS)**

- Postgres RLS policy: `user_id = current_setting('app.user_id')::uuid`
- Ustawienie `app.user_id` na początku każdej transakcji
- Automatyczna izolacja danych między użytkownikami

**Application-Level Check**

- Dodatkowo weryfikacja ownership w serwisie
- Zwrócenie 404 zamiast 403 dla nieistniejących zasobów (security through obscurity)

### Input Validation

**UUID Validation**

- class-validator: `@IsUUID('4')`
- Zapobiega SQL injection (używamy parametrized queries)
- Zapobiega path traversal attacks

**Sanitization**

- Wszystkie dane wejściowe sanityzowane przez ValidationPipe
- Transformacja typów (string → UUID)

### Rate Limiting

- 60 requests/min/user (ogólne endpointy)
- Implementacja na poziomie AWS API Gateway
- Key: `userId` z JWT
- Throttle response: 429 Too Many Requests

### HTTPS & Transport Security

- Wymuszenie HTTPS na wszystkich endpointach
- HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- TLS 1.2+ only

### Data Privacy

**Soft Delete**

- Zapytania filtrują `deleted_at IS NULL`
- Użytkownik nie ma dostępu do usuniętych danych
- Hard delete job (GDPR compliance) po 30 dniach

**Error Messages**

- Nie ujawniają struktury bazy danych
- Generic messages dla użytkownika
- Szczegółowe logi tylko po stronie serwera

## 7. Obsługa błędów

### Scenariusze błędów

#### 1. Invalid UUID Format (400)

**Przyczyna:** `scheduleId` nie jest poprawnym UUID  
**Validation:** class-validator `@IsUUID('4')`  
**Response:**

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "scheduleId must be a valid UUID",
  "timestamp": "2026-01-09T12:34:56Z",
  "path": "/v1/weekly-schedules/invalid-id"
}
```

**Logging:** WARN level, bez PII

#### 2. Missing Authentication Token (401)

**Przyczyna:** Brak nagłówka `Authorization` lub pusty token  
**Guard:** `JwtAuthGuard`  
**Response:**

```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token",
  "timestamp": "2026-01-09T12:34:56Z",
  "path": "/v1/weekly-schedules/550e8400-e29b-41d4-a716-446655440000"
}
```

**Logging:** INFO level, IP address logged

#### 3. Invalid/Expired JWT Token (401)

**Przyczyna:** Token wygasły lub niepoprawnie podpisany  
**Guard:** `JwtAuthGuard`  
**Response:** Jak wyżej  
**Logging:** WARN level, token hash logged (nie pełny token)

#### 4. Schedule Not Found (404)

**Przyczyna:**

- Schedule nie istnieje
- Schedule jest soft-deleted
- Schedule należy do innego użytkownika (RLS)

**Service Logic:**

```typescript
const schedule = await this.scheduleRepository.findOne({
  where: {
    scheduleId,
    userId,
    deletedAt: IsNull(),
  },
  relations: ['timeBlocks', 'timeBlocks.familyMember', 'timeBlocks.recurringGoal'],
});

if (!schedule) {
  throw new NotFoundException('Weekly schedule not found');
}
```

**Response:**

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Weekly schedule not found",
  "timestamp": "2026-01-09T12:34:56Z",
  "path": "/v1/weekly-schedules/550e8400-e29b-41d4-a716-446655440000"
}
```

**Logging:** INFO level, scheduleId + userId logged

#### 5. Database Connection Error (500)

**Przyczyna:**

- Postgres niedostępny
- Connection pool exhausted
- Query timeout

**Handling:**

```typescript
try {
  return await this.scheduleRepository.findOne(...);
} catch (error) {
  this.logger.error(`Database error fetching schedule ${scheduleId}`, error.stack);
  throw new InternalServerErrorException('An unexpected error occurred');
}
```

**Response:**

```json
{
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2026-01-09T12:34:56Z",
  "path": "/v1/weekly-schedules/550e8400-e29b-41d4-a716-446655440000"
}
```

**Logging:** ERROR level, full stack trace, alert DevOps

#### 6. Rate Limit Exceeded (429)

**Przyczyna:** Użytkownik przekroczył 60 req/min  
**Handled by:** AWS API Gateway  
**Response:**

```json
{
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again later.",
  "retryAfter": 30,
  "timestamp": "2026-01-09T12:34:56Z"
}
```

**Logging:** WARN level, userId logged

### Error Handling Strategy

**Global Exception Filter:**

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    const errorResponse = {
      status,
      error: this.getErrorName(status),
      message: this.getSafeMessage(exception),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Structured logging
    this.logger.error({
      ...errorResponse,
      userId: request.user?.userId,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json(errorResponse);
  }
}
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

#### 1. N+1 Query Problem

**Problem:**

- Schedule → Time Blocks (1 query)
- Dla każdego Time Block → Family Member (N queries)
- Dla każdego Time Block → Recurring Goal (N queries)

**Optymalizacja:**

- Eager loading z TypeORM relations
- Pojedynczy query z LEFT JOINs

```typescript
relations: ['timeBlocks', 'timeBlocks.familyMember', 'timeBlocks.recurringGoal'];
```

#### 2. Large Payload Size

**Problem:** Schedule z wieloma time blocks (50+) może generować duży JSON

**Optymalizacja:**

- DTO projection - zwracaj tylko potrzebne pola
- Kompresja gzip na poziomie API Gateway
- Rozważenie paginacji time_blocks (jeśli > 100)

#### 3. JSONB metadata parsing

**Problem:** Postgres musi deserializować JSONB dla każdego rekordu

**Optymalizacja:**

- Indeks GIN na często query'owanych polach JSONB
- Unikanie SELECT \* - wybieraj tylko potrzebne kolumny JSONB

#### 4. Timezone conversions

**Problem:** TSTZRANGE → ISO 8601 string conversion dla każdego time_range

**Optymalizacja:**

- TypeORM transformer dla automatycznej konwersji
- Caching format'ów dat w memory

### Strategie optymalizacji

#### Database Indexing

**Istniejące indeksy (z db-plan.md):**

- `weekly_schedules_unique_idx` - BTREE (user_id, week_start_date) WHERE deleted_at IS NULL
- `time_blocks_type_idx` - BTREE (block_type) WHERE deleted_at IS NULL
- `time_blocks_family_member_idx` - BTREE (family_member_id) WHERE deleted_at IS NULL

**Dodatkowy indeks (rekomendowany):**

```sql
CREATE INDEX time_blocks_schedule_idx
ON time_blocks(schedule_id)
WHERE deleted_at IS NULL;
```

#### Query Optimization

**Explain Analyze:**

```sql
EXPLAIN ANALYZE
SELECT ws.*, tb.*, fm.*, rg.*
FROM weekly_schedules ws
LEFT JOIN time_blocks tb ON ws.schedule_id = tb.schedule_id AND tb.deleted_at IS NULL
LEFT JOIN family_members fm ON tb.family_member_id = fm.family_member_id AND fm.deleted_at IS NULL
LEFT JOIN recurring_goals rg ON tb.recurring_goal_id = rg.goal_id AND rg.deleted_at IS NULL
WHERE ws.schedule_id = '550e8400-e29b-41d4-a716-446655440000'
  AND ws.deleted_at IS NULL
  AND ws.user_id = current_setting('app.user_id')::uuid;
```

**Expected plan:**

- Index Scan on weekly_schedules (using PK)
- Nested Loop with time_blocks (using time_blocks_schedule_idx)
- Nested Loop with family_members (using PK)
- Nested Loop with recurring_goals (using PK)
- Total cost: < 50 ms for typical schedule

#### Connection Pooling

**TypeORM Configuration:**

```typescript
{
  type: 'postgres',
  host: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  extra: {
    max: 20,              // Max connections in pool
    min: 5,               // Min idle connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
}
```

#### Monitoring & Metrics

**CloudWatch Metrics:**

- Request latency (p50, p95, p99)
- Database query time
- Error rate per status code
- Concurrent requests

**Alerts:**

- p99 latency > 500ms
- Error rate > 1%
- Database connection pool exhaustion

### Performance Targets

- **Response time:**
  - p50: < 100ms
  - p95: < 200ms
  - p99: < 500ms
- **Throughput:** 60 req/min/user (rate limit)
- **Database queries:** 1 query per request (with eager loading)
- **Payload size:** < 50KB for typical schedule (20-30 blocks)

## 9. Etapy wdrożenia

### Faza 1: Fundamenty - Entities & DTOs

**Lokalizacja:** `libs/shared/models-schedule/src/lib/`

1. **Definicja enums** (`enums/`)

   ```typescript
   // block-type.enum.ts
   export enum BlockType {
     WORK = 'WORK',
     ACTIVITY = 'ACTIVITY',
     MEAL = 'MEAL',
     OTHER = 'OTHER',
   }

   // family-member-role.enum.ts
   export enum FamilyMemberRole {
     USER = 'USER',
     SPOUSE = 'SPOUSE',
     CHILD = 'CHILD',
   }
   ```

2. **Definicja interfaces** (`interfaces/`)

   ```typescript
   // time-range.interface.ts
   export interface TimeRange {
     start: Date;
     end: Date;
   }

   // schedule.interface.ts
   export interface WeeklySchedule {
     scheduleId: string;
     userId: string;
     weekStartDate: Date;
     isAiGenerated: boolean;
     metadata: Record<string, any>;
     timeBlocks?: TimeBlock[];
     createdAt: Date;
     updatedAt: Date;
     deletedAt?: Date;
   }

   // block.interface.ts
   export interface TimeBlock {
     blockId: string;
     scheduleId: string;
     recurringGoalId?: string;
     familyMemberId?: string;
     title: string;
     blockType: BlockType;
     timeRange: TimeRange;
     isShared: boolean;
     metadata: Record<string, any>;
     createdAt: Date;
     updatedAt: Date;
     deletedAt?: Date;
   }
   ```

3. **Export w index.ts**
   ```typescript
   export * from './lib/enums/block-type.enum';
   export * from './lib/enums/family-member-role.enum';
   export * from './lib/interfaces/schedule.interface';
   export * from './lib/interfaces/block.interface';
   export * from './lib/interfaces/time-range.interface';
   ```

### Faza 2: Backend Library - Entities

**Lokalizacja:** `libs/backend/feature-schedule/src/lib/entities/`

4. **TypeORM Entity dla WeeklySchedule**

   ```typescript
   // weekly-schedule.entity.ts
   @Entity('weekly_schedules')
   export class WeeklyScheduleEntity {
     @PrimaryGeneratedColumn('uuid')
     scheduleId: string;

     @Column('uuid')
     userId: string;

     @Column('date')
     weekStartDate: Date;

     @Column('boolean', { default: false })
     isAiGenerated: boolean;

     @Column('jsonb', { default: {} })
     metadata: Record<string, any>;

     @OneToMany(() => TimeBlockEntity, (block) => block.schedule)
     timeBlocks: TimeBlockEntity[];

     @CreateDateColumn({ type: 'timestamptz' })
     createdAt: Date;

     @UpdateDateColumn({ type: 'timestamptz' })
     updatedAt: Date;

     @Column('timestamptz', { nullable: true })
     deletedAt?: Date;
   }
   ```

5. **TypeORM Entity dla TimeBlock**

   ```typescript
   // time-block.entity.ts
   @Entity('time_blocks')
   export class TimeBlockEntity {
     @PrimaryGeneratedColumn('uuid')
     blockId: string;

     @Column('uuid')
     scheduleId: string;

     @Column('uuid', { nullable: true })
     recurringGoalId?: string;

     @Column('uuid', { nullable: true })
     familyMemberId?: string;

     @Column('text')
     title: string;

     @Column({
       type: 'enum',
       enum: BlockType,
     })
     blockType: BlockType;

     // Custom transformer for TSTZRANGE
     @Column('tstzrange', {
       transformer: new TimeRangeTransformer(),
     })
     timeRange: TimeRange;

     @Column('boolean', { default: false })
     isShared: boolean;

     @Column('jsonb', { default: {} })
     metadata: Record<string, any>;

     @ManyToOne(() => WeeklyScheduleEntity, (schedule) => schedule.timeBlocks)
     @JoinColumn({ name: 'schedule_id' })
     schedule: WeeklyScheduleEntity;

     @ManyToOne(() => FamilyMemberEntity, { nullable: true })
     @JoinColumn({ name: 'family_member_id' })
     familyMember?: FamilyMemberEntity;

     @ManyToOne(() => RecurringGoalEntity, { nullable: true })
     @JoinColumn({ name: 'recurring_goal_id' })
     recurringGoal?: RecurringGoalEntity;

     @CreateDateColumn({ type: 'timestamptz' })
     createdAt: Date;

     @UpdateDateColumn({ type: 'timestamptz' })
     updatedAt: Date;

     @Column('timestamptz', { nullable: true })
     deletedAt?: Date;
   }
   ```

6. **Custom Transformer dla TSTZRANGE**

   ```typescript
   // transformers/time-range.transformer.ts
   export class TimeRangeTransformer implements ValueTransformer {
     to(value: TimeRange): string {
       if (!value) return null;
       return `[${value.start.toISOString()},${value.end.toISOString()})`;
     }

     from(value: string): TimeRange {
       if (!value) return null;
       const matches = value.match(/\[(.+),(.+)\)/);
       if (!matches) return null;
       return {
         start: new Date(matches[1]),
         end: new Date(matches[2]),
       };
     }
   }
   ```

### Faza 3: DTOs dla API

**Lokalizacja:** `libs/backend/feature-schedule/src/lib/dto/`

7. **Response DTOs**

   ```typescript
   // weekly-schedule.dto.ts
   export class WeeklyScheduleDto {
     @ApiProperty()
     scheduleId: string;

     @ApiProperty()
     userId: string;

     @ApiProperty()
     weekStartDate: string; // ISO 8601 date

     @ApiProperty()
     isAiGenerated: boolean;

     @ApiProperty()
     metadata: Record<string, any>;

     @ApiProperty({ type: [TimeBlockDto] })
     timeBlocks: TimeBlockDto[];

     @ApiProperty()
     createdAt: string;

     @ApiProperty()
     updatedAt: string;
   }

   // time-block.dto.ts
   export class TimeBlockDto {
     @ApiProperty()
     blockId: string;

     @ApiProperty()
     scheduleId: string;

     @ApiProperty({ required: false })
     recurringGoalId?: string;

     @ApiProperty({ required: false })
     familyMemberId?: string;

     @ApiProperty()
     title: string;

     @ApiProperty({ enum: BlockType })
     blockType: BlockType;

     @ApiProperty()
     timeRange: TimeRangeDto;

     @ApiProperty()
     isShared: boolean;

     @ApiProperty()
     metadata: Record<string, any>;

     @ApiProperty({ required: false })
     familyMember?: FamilyMemberDto;

     @ApiProperty({ required: false })
     recurringGoal?: RecurringGoalDto;

     @ApiProperty()
     createdAt: string;

     @ApiProperty()
     updatedAt: string;
   }

   // time-range.dto.ts
   export class TimeRangeDto {
     @ApiProperty()
     start: string; // ISO 8601 timestamp

     @ApiProperty()
     end: string; // ISO 8601 timestamp
   }
   ```

8. **Validation DTOs**
   ```typescript
   // get-schedule-params.dto.ts
   export class GetScheduleParamsDto {
     @ApiProperty({ format: 'uuid' })
     @IsUUID('4', { message: 'scheduleId must be a valid UUID' })
     scheduleId: string;
   }
   ```

### Faza 4: Service Layer

**Lokalizacja:** `libs/backend/feature-schedule/src/lib/`

9. **Schedule Service - podstawowa implementacja**

   ```typescript
   // schedule.service.ts
   @Injectable()
   export class ScheduleService {
     private readonly logger = new Logger(ScheduleService.name);

     constructor(
       @InjectRepository(WeeklyScheduleEntity)
       private readonly scheduleRepository: Repository<WeeklyScheduleEntity>,
       @InjectDataSource()
       private readonly dataSource: DataSource
     ) {}

     async findScheduleById(scheduleId: string, userId: string): Promise<WeeklyScheduleEntity> {
       // Set RLS context
       await this.dataSource.query(`SET LOCAL app.user_id = $1`, [userId]);

       const schedule = await this.scheduleRepository.findOne({
         where: {
           scheduleId,
           deletedAt: IsNull(),
         },
         relations: ['timeBlocks', 'timeBlocks.familyMember', 'timeBlocks.recurringGoal'],
         order: {
           timeBlocks: {
             timeRange: 'ASC', // Sort blocks by start time
           },
         },
       });

       if (!schedule) {
         throw new NotFoundException('Weekly schedule not found');
       }

       // Additional ownership check (redundant with RLS, but defense in depth)
       if (schedule.userId !== userId) {
         this.logger.warn(`User ${userId} attempted to access schedule ${scheduleId} owned by ${schedule.userId}`);
         throw new NotFoundException('Weekly schedule not found');
       }

       // Filter out soft-deleted time blocks
       schedule.timeBlocks = schedule.timeBlocks.filter((block) => !block.deletedAt);

       return schedule;
     }
   }
   ```

### Faza 5: Mappers - Entity do DTO

**Lokalizacja:** `libs/backend/feature-schedule/src/lib/mappers/`

10. **Schedule Mapper**

    ```typescript
    // schedule.mapper.ts
    @Injectable()
    export class ScheduleMapper {
      toDto(entity: WeeklyScheduleEntity): WeeklyScheduleDto {
        return {
          scheduleId: entity.scheduleId,
          userId: entity.userId,
          weekStartDate: entity.weekStartDate.toISOString().split('T')[0],
          isAiGenerated: entity.isAiGenerated,
          metadata: entity.metadata,
          timeBlocks: entity.timeBlocks ? entity.timeBlocks.map((block) => this.timeBlockToDto(block)) : [],
          createdAt: entity.createdAt.toISOString(),
          updatedAt: entity.updatedAt.toISOString(),
        };
      }

      private timeBlockToDto(entity: TimeBlockEntity): TimeBlockDto {
        return {
          blockId: entity.blockId,
          scheduleId: entity.scheduleId,
          recurringGoalId: entity.recurringGoalId,
          familyMemberId: entity.familyMemberId,
          title: entity.title,
          blockType: entity.blockType,
          timeRange: {
            start: entity.timeRange.start.toISOString(),
            end: entity.timeRange.end.toISOString(),
          },
          isShared: entity.isShared,
          metadata: entity.metadata,
          familyMember: entity.familyMember ? this.familyMemberToDto(entity.familyMember) : undefined,
          recurringGoal: entity.recurringGoal ? this.recurringGoalToDto(entity.recurringGoal) : undefined,
          createdAt: entity.createdAt.toISOString(),
          updatedAt: entity.updatedAt.toISOString(),
        };
      }

      private familyMemberToDto(entity: FamilyMemberEntity): FamilyMemberDto {
        return {
          familyMemberId: entity.familyMemberId,
          name: entity.name,
          role: entity.role,
          age: entity.age,
        };
      }

      private recurringGoalToDto(entity: RecurringGoalEntity): RecurringGoalDto {
        return {
          goalId: entity.goalId,
          name: entity.name,
          frequencyPerWeek: entity.frequencyPerWeek,
        };
      }
    }
    ```

### Faza 6: Controller Layer

**Lokalizacja:** `libs/backend/feature-schedule/src/lib/`

11. **Schedule Controller**

    ```typescript
    // schedule.controller.ts
    @Controller('v1/weekly-schedules')
    @ApiTags('Weekly Schedules')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    export class ScheduleController {
      private readonly logger = new Logger(ScheduleController.name);

      constructor(private readonly scheduleService: ScheduleService, private readonly scheduleMapper: ScheduleMapper) {}

      @Get(':scheduleId')
      @ApiOperation({ summary: 'Get weekly schedule by ID' })
      @ApiParam({
        name: 'scheduleId',
        type: 'string',
        format: 'uuid',
        description: 'Schedule UUID',
      })
      @ApiResponse({
        status: 200,
        description: 'Schedule found',
        type: WeeklyScheduleDto,
      })
      @ApiResponse({
        status: 400,
        description: 'Invalid UUID format',
      })
      @ApiResponse({
        status: 401,
        description: 'Unauthorized - invalid or missing JWT',
      })
      @ApiResponse({
        status: 404,
        description: 'Schedule not found',
      })
      @ApiBearerAuth()
      async getScheduleById(@Param() params: GetScheduleParamsDto, @CurrentUser() user: JwtPayload): Promise<WeeklyScheduleDto> {
        this.logger.log(`User ${user.userId} fetching schedule ${params.scheduleId}`);

        const schedule = await this.scheduleService.findScheduleById(params.scheduleId, user.userId);

        return this.scheduleMapper.toDto(schedule);
      }
    }
    ```

### Faza 7: Guards & Decorators

**Lokalizacja:** `libs/backend/feature-schedule/src/lib/guards/` i `decorators/`

12. **JWT Auth Guard**

    ```typescript
    // guards/jwt-auth.guard.ts
    @Injectable()
    export class JwtAuthGuard extends AuthGuard('jwt') {
      private readonly logger = new Logger(JwtAuthGuard.name);

      canActivate(context: ExecutionContext) {
        return super.canActivate(context);
      }

      handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();

        if (err || !user) {
          this.logger.warn(`Authentication failed for ${request.ip}: ${info?.message || err?.message}`);
          throw new UnauthorizedException('Invalid or expired token');
        }

        return user;
      }
    }
    ```

13. **CurrentUser Decorator**

    ```typescript
    // decorators/current-user.decorator.ts
    export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): JwtPayload => {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    });

    // JWT Payload interface
    export interface JwtPayload {
      userId: string; // sub claim from Supabase
      email: string; // email claim
      iat: number; // issued at
      exp: number; // expiration
    }
    ```

### Faza 8: Exception Filters

**Lokalizacja:** `libs/backend/feature-schedule/src/lib/filters/`

14. **Global Exception Filter**

    ```typescript
    // filters/global-exception.filter.ts
    @Catch()
    export class GlobalExceptionFilter implements ExceptionFilter {
      private readonly logger = new Logger(GlobalExceptionFilter.name);

      catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status = this.getStatus(exception);
        const message = this.getSafeMessage(exception);

        const errorResponse = {
          status,
          error: this.getErrorName(status),
          message,
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        // Structured logging
        this.logger.error({
          ...errorResponse,
          userId: request['user']?.userId,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          stack: exception instanceof Error ? exception.stack : undefined,
        });

        // Alert on 5xx errors
        if (status >= 500) {
          // TODO: Send to monitoring service (CloudWatch, Sentry, etc.)
        }

        response.status(status).json(errorResponse);
      }

      private getStatus(exception: unknown): number {
        if (exception instanceof HttpException) {
          return exception.getStatus();
        }
        return 500;
      }

      private getSafeMessage(exception: unknown): string {
        if (exception instanceof HttpException) {
          const response = exception.getResponse();
          if (typeof response === 'string') return response;
          if (typeof response === 'object' && 'message' in response) {
            return Array.isArray(response.message) ? response.message.join(', ') : response.message;
          }
        }
        // Don't expose internal errors to client
        return 'An unexpected error occurred';
      }

      private getErrorName(status: number): string {
        const names: Record<number, string> = {
          400: 'Bad Request',
          401: 'Unauthorized',
          403: 'Forbidden',
          404: 'Not Found',
          429: 'Too Many Requests',
          500: 'Internal Server Error',
        };
        return names[status] || 'Error';
      }
    }
    ```

### Faza 9: Module Configuration

**Lokalizacja:** `libs/backend/feature-schedule/src/lib/`

15. **Schedule Module**

    ```typescript
    // schedule.module.ts
    @Module({
      imports: [
        TypeOrmModule.forFeature([WeeklyScheduleEntity, TimeBlockEntity, FamilyMemberEntity, RecurringGoalEntity]),
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [ScheduleController],
      providers: [
        ScheduleService,
        ScheduleMapper,
        JwtAuthGuard,
        {
          provide: APP_FILTER,
          useClass: GlobalExceptionFilter,
        },
      ],
      exports: [ScheduleService],
    })
    export class ScheduleModule {}
    ```

16. **JWT Strategy**

    ```typescript
    // strategies/jwt.strategy.ts
    @Injectable()
    export class JwtStrategy extends PassportStrategy(Strategy) {
      constructor() {
        super({
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          ignoreExpiration: false,
          secretOrKey: process.env.JWT_SECRET,
          issuer: 'https://supabase.io/auth',
          audience: process.env.SUPABASE_PROJECT_ID,
        });
      }

      async validate(payload: any): Promise<JwtPayload> {
        return {
          userId: payload.sub,
          email: payload.email,
          iat: payload.iat,
          exp: payload.exp,
        };
      }
    }
    ```

### Faza 10: Testing

**Lokalizacja:** `libs/backend/feature-schedule/src/lib/__tests__/`

17. **Unit Tests - Service**

    ```typescript
    // schedule.service.spec.ts
    describe('ScheduleService', () => {
      let service: ScheduleService;
      let repository: jest.Mocked<Repository<WeeklyScheduleEntity>>;
      let dataSource: jest.Mocked<DataSource>;

      beforeEach(() => {
        repository = {
          findOne: jest.fn(),
        } as any;

        dataSource = {
          query: jest.fn(),
        } as any;

        service = new ScheduleService(repository, dataSource);
      });

      describe('findScheduleById', () => {
        it('should set RLS context and return schedule', async () => {
          const userId = 'user-123';
          const scheduleId = 'schedule-456';
          const mockSchedule = {
            scheduleId,
            userId,
            timeBlocks: [],
            deletedAt: null,
          } as WeeklyScheduleEntity;

          repository.findOne.mockResolvedValue(mockSchedule);

          const result = await service.findScheduleById(scheduleId, userId);

          expect(dataSource.query).toHaveBeenCalledWith('SET LOCAL app.user_id = $1', [userId]);
          expect(repository.findOne).toHaveBeenCalledWith({
            where: { scheduleId, deletedAt: IsNull() },
            relations: expect.arrayContaining(['timeBlocks', 'timeBlocks.familyMember', 'timeBlocks.recurringGoal']),
            order: expect.any(Object),
          });
          expect(result).toEqual(mockSchedule);
        });

        it('should throw NotFoundException when schedule not found', async () => {
          repository.findOne.mockResolvedValue(null);

          await expect(service.findScheduleById('schedule-456', 'user-123')).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when userId mismatch', async () => {
          const mockSchedule = {
            scheduleId: 'schedule-456',
            userId: 'other-user',
            timeBlocks: [],
            deletedAt: null,
          } as WeeklyScheduleEntity;

          repository.findOne.mockResolvedValue(mockSchedule);

          await expect(service.findScheduleById('schedule-456', 'user-123')).rejects.toThrow(NotFoundException);
        });

        it('should filter soft-deleted time blocks', async () => {
          const mockSchedule = {
            scheduleId: 'schedule-456',
            userId: 'user-123',
            timeBlocks: [{ blockId: 'block-1', deletedAt: null } as TimeBlockEntity, { blockId: 'block-2', deletedAt: new Date() } as TimeBlockEntity],
            deletedAt: null,
          } as WeeklyScheduleEntity;

          repository.findOne.mockResolvedValue(mockSchedule);

          const result = await service.findScheduleById('schedule-456', 'user-123');

          expect(result.timeBlocks).toHaveLength(1);
          expect(result.timeBlocks[0].blockId).toBe('block-1');
        });
      });
    });
    ```

18. **Unit Tests - Controller**

    ```typescript
    // schedule.controller.spec.ts
    describe('ScheduleController', () => {
      let controller: ScheduleController;
      let service: jest.Mocked<ScheduleService>;
      let mapper: jest.Mocked<ScheduleMapper>;

      beforeEach(() => {
        service = {
          findScheduleById: jest.fn(),
        } as any;

        mapper = {
          toDto: jest.fn(),
        } as any;

        controller = new ScheduleController(service, mapper);
      });

      describe('getScheduleById', () => {
        it('should return mapped DTO', async () => {
          const params = { scheduleId: 'schedule-123' };
          const user = { userId: 'user-456', email: 'test@example.com' } as JwtPayload;
          const mockEntity = {} as WeeklyScheduleEntity;
          const mockDto = { scheduleId: 'schedule-123' } as WeeklyScheduleDto;

          service.findScheduleById.mockResolvedValue(mockEntity);
          mapper.toDto.mockReturnValue(mockDto);

          const result = await controller.getScheduleById(params, user);

          expect(service.findScheduleById).toHaveBeenCalledWith('schedule-123', 'user-456');
          expect(mapper.toDto).toHaveBeenCalledWith(mockEntity);
          expect(result).toEqual(mockDto);
        });

        it('should propagate NotFoundException from service', async () => {
          const params = { scheduleId: 'schedule-123' };
          const user = { userId: 'user-456' } as JwtPayload;

          service.findScheduleById.mockRejectedValue(new NotFoundException('Weekly schedule not found'));

          await expect(controller.getScheduleById(params, user)).rejects.toThrow(NotFoundException);
        });
      });
    });
    ```

19. **Unit Tests - Mapper**

    ```typescript
    // schedule.mapper.spec.ts
    describe('ScheduleMapper', () => {
      let mapper: ScheduleMapper;

      beforeEach(() => {
        mapper = new ScheduleMapper();
      });

      it('should map entity to DTO correctly', () => {
        const entity: WeeklyScheduleEntity = {
          scheduleId: 'schedule-123',
          userId: 'user-456',
          weekStartDate: new Date('2026-01-13'),
          isAiGenerated: true,
          metadata: { strategy: 'balanced' },
          timeBlocks: [
            {
              blockId: 'block-1',
              title: 'Morning Workout',
              blockType: BlockType.ACTIVITY,
              timeRange: {
                start: new Date('2026-01-13T06:00:00Z'),
                end: new Date('2026-01-13T07:00:00Z'),
              },
              isShared: false,
              metadata: {},
              familyMember: null,
              recurringGoal: null,
            } as TimeBlockEntity,
          ],
          createdAt: new Date('2026-01-09T12:00:00Z'),
          updatedAt: new Date('2026-01-09T12:00:00Z'),
        } as WeeklyScheduleEntity;

        const dto = mapper.toDto(entity);

        expect(dto.scheduleId).toBe('schedule-123');
        expect(dto.weekStartDate).toBe('2026-01-13');
        expect(dto.isAiGenerated).toBe(true);
        expect(dto.timeBlocks).toHaveLength(1);
        expect(dto.timeBlocks[0].title).toBe('Morning Workout');
        expect(dto.timeBlocks[0].timeRange.start).toBe('2026-01-13T06:00:00.000Z');
      });
    });
    ```

### Faza 11: E2E Tests

**Lokalizacja:** `apps/backend/test/`

20. **E2E Test - Happy Path**

    ```typescript
    // schedule.e2e-spec.ts
    describe('GET /v1/weekly-schedules/:scheduleId (e2e)', () => {
      let app: INestApplication;
      let authToken: string;
      let userId: string;
      let scheduleId: string;

      beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
          imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true }));
        await app.init();

        // Setup: Create user and get auth token
        const authResponse = await request(app.getHttpServer()).post('/v1/auth/register').send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          displayName: 'Test User',
        });

        authToken = authResponse.body.token;
        userId = authResponse.body.user.id;

        // Setup: Create a schedule
        const scheduleResponse = await request(app.getHttpServer()).post('/v1/weekly-schedules').set('Authorization', `Bearer ${authToken}`).send({
          weekStartDate: '2026-01-13',
        });

        scheduleId = scheduleResponse.body.scheduleId;
      });

      afterAll(async () => {
        await app.close();
      });

      it('should return 200 with schedule data', () => {
        return request(app.getHttpServer())
          .get(`/v1/weekly-schedules/${scheduleId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toMatchObject({
              scheduleId,
              userId,
              weekStartDate: '2026-01-13',
              timeBlocks: expect.any(Array),
            });
          });
      });

      it('should return 401 without auth token', () => {
        return request(app.getHttpServer()).get(`/v1/weekly-schedules/${scheduleId}`).expect(401);
      });

      it('should return 400 for invalid UUID', () => {
        return request(app.getHttpServer())
          .get('/v1/weekly-schedules/invalid-uuid')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('must be a valid UUID');
          });
      });

      it('should return 404 for non-existent schedule', () => {
        return request(app.getHttpServer()).get('/v1/weekly-schedules/00000000-0000-0000-0000-000000000000').set('Authorization', `Bearer ${authToken}`).expect(404);
      });

      it('should return 404 when accessing another user schedule', async () => {
        // Create second user
        const otherAuthResponse = await request(app.getHttpServer()).post('/v1/auth/register').send({
          email: 'other@example.com',
          password: 'SecurePass123!',
        });

        const otherToken = otherAuthResponse.body.token;

        // Try to access first user's schedule
        return request(app.getHttpServer()).get(`/v1/weekly-schedules/${scheduleId}`).set('Authorization', `Bearer ${otherToken}`).expect(404);
      });
    });
    ```

### Faza 12: Documentation & Deployment

21. **Swagger/OpenAPI dokumentacja**

    - Wszystkie dekoratory `@ApiOperation`, `@ApiResponse`, etc. już dodane w kontrolerze
    - Dostęp do dokumentacji: `http://localhost:3000/api/docs`

22. **Environment Variables**

    ```bash
    # .env.example
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=postgres
    DB_PASSWORD=password
    DB_NAME=family_planner

    JWT_SECRET=your-supabase-jwt-secret
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_PROJECT_ID=your-project-id

    NODE_ENV=development
    PORT=3000
    ```

23. **Deployment checklist**

    - [ ] Migracje bazy danych uruchomione (Supabase migrations)
    - [ ] RLS policies włączone na tabelach
    - [ ] Indeksy utworzone zgodnie z db-plan.md
    - [ ] Environment variables ustawione w AWS Lambda
    - [ ] API Gateway skonfigurowane (rate limiting)
    - [ ] CloudWatch logging włączony
    - [ ] Monitoring & alerty skonfigurowane
    - [ ] E2E testy przechodzą w środowisku staging
    - [ ] Load testing wykonany (60 req/min/user)

24. **Monitoring setup**

    ```typescript
    // CloudWatch custom metrics
    const logMetric = (name: string, value: number, unit: string) => {
      console.log(
        JSON.stringify({
          _aws: {
            Timestamp: Date.now(),
            CloudWatchMetrics: [
              {
                Namespace: 'FamilyPlanner/API',
                Dimensions: [['Endpoint']],
                Metrics: [{ Name: name, Unit: unit }],
              },
            ],
          },
          Endpoint: 'GetScheduleById',
          [name]: value,
        })
      );
    };

    // Usage in service
    const startTime = Date.now();
    const schedule = await this.findScheduleById(...);
    const duration = Date.now() - startTime;
    logMetric('ResponseTime', duration, 'Milliseconds');
    ```

---

## 10. Podsumowanie

### Kluczowe decyzje architektoniczne

1. **Eager loading** zamiast lazy loading dla optymalnej wydajności (1 query zamiast N+1)
2. **Defense in depth** - RLS + application-level authorization
3. **Soft delete** na wszystkich poziomach dla zgodności z GDPR
4. **DTO projection** dla czytelności API i separacji warstw
5. **Structured logging** dla łatwego debugowania w CloudWatch

### Potencjalne rozszerzenia (Phase 2)

- Webhook notifications przy zmianach w schedule
- Audit log dla wszystkich operacji
- Rate limiting per-endpoint (bardziej granularne)

### Metryki sukcesu

- [ ] Response time p99 < 500ms
- [ ] Uptime > 99.9%
- [ ] Zero security incidents
- [ ] Code coverage > 80%
- [ ] Zero data leaks between users (RLS działa)

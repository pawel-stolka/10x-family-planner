# Backend Feature: Schedule

Feature module for weekly schedule management in the Family Planner application.

## Overview

This module provides REST API endpoints for managing weekly schedules with time blocks. It includes:

- **TypeORM entities** for database access (PostgreSQL/Supabase)
- **JWT authentication** via Supabase Auth
- **Row-Level Security (RLS)** for data isolation
- **DTOs** with Swagger documentation
- **Global exception handling**

## Implemented Endpoints

### GET /v1/weekly-schedules/:scheduleId

Retrieves a single weekly schedule by ID with all time blocks and related data.

**Features:**
- JWT authentication required
- RLS + application-level authorization
- Eager loading (single query, no N+1 problem)
- Soft-delete filtering
- Comprehensive Swagger documentation

**Response includes:**
- Schedule metadata (week_start_date, is_ai_generated, etc.)
- All time blocks with:
  - Family member assignments
  - Recurring goal links
  - Time ranges (TSTZRANGE → ISO 8601)
  - Custom metadata (JSONB)

## Architecture

```
apps/backend/
  └── app.module.ts (imports ScheduleModule)

libs/backend/feature-schedule/
  ├── entities/          # TypeORM entities
  ├── dto/               # Request/Response DTOs
  ├── services/          # Business logic
  ├── mappers/           # Entity → DTO transformation
  ├── controllers/       # REST API endpoints
  ├── guards/            # JWT authentication
  ├── strategies/        # Passport JWT strategy
  ├── decorators/        # Custom decorators (@CurrentUser)
  ├── filters/           # Global exception handling
  ├── transformers/      # Custom type transformers (TSTZRANGE)
  └── schedule.module.ts # Feature module
```

## Configuration

### Environment Variables

Create a `.env` file in the project root with:

```bash
# Database (Supabase PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=family_planner

# JWT (Supabase Auth)
JWT_SECRET=your-supabase-jwt-secret
JWT_EXPIRES_IN=1h
JWT_ISSUER=https://supabase.io/auth
JWT_AUDIENCE=your-supabase-project-id

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PROJECT_ID=your-project-id

# Application
NODE_ENV=development
PORT=3000
```

### Database Setup

1. **Run Supabase migrations:**
   ```bash
   npm run supabase:reset
   ```

2. **Verify RLS policies are enabled:**
   - Check `supabase/migrations/20260109120000_initial_schema.sql`
   - Policies should filter by `user_id = current_setting('app.user_id')::uuid`

3. **Create indexes (if not in migration):**
   ```sql
   CREATE INDEX time_blocks_schedule_idx 
   ON time_blocks(schedule_id) 
   WHERE deleted_at IS NULL;
   ```

## Usage

### Starting the Backend

```bash
# Development
npx nx serve backend

# Production build
npx nx build backend
```

The API will be available at `http://localhost:3000`

### API Documentation (Swagger)

Once the server is running, access interactive API docs at:

```
http://localhost:3000/api/docs
```

## Testing

### Unit Tests

```bash
# Run all tests for this feature
npx nx test feature-schedule

# Watch mode
npx nx test feature-schedule --watch

# Coverage
npx nx test feature-schedule --coverage
```

### E2E Tests

```bash
# Run backend E2E tests
npx nx e2e backend-e2e
```

## Example Request

```bash
curl -X GET "http://localhost:3000/v1/weekly-schedules/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Security

### Authentication
- All endpoints require valid JWT token from Supabase Auth
- Token validated via Passport JWT strategy
- User ID extracted from `sub` claim

### Authorization
- **Row-Level Security (RLS)** at PostgreSQL level
- **Application-level checks** in service layer (defense in depth)
- Only returns schedules owned by authenticated user

### Data Isolation
- RLS context set at transaction start: `SET LOCAL app.user_id = $1`
- Automatic filtering by PostgreSQL policies
- Soft-delete filtering (`deleted_at IS NULL`)

## Performance

### Optimizations
- **Single query** with eager loading (no N+1 problem)
- **Partial indexes** on soft-deleted records
- **Connection pooling** (min: 5, max: 20 connections)
- **GZIP compression** at API Gateway level

### Targets
- p50 response time: < 100ms
- p95 response time: < 200ms
- p99 response time: < 500ms
- Throughput: 60 req/min/user (rate limited)

## Next Steps

### Phase 2 Endpoints (To Implement)

1. **POST /v1/weekly-schedules** - Create new schedule
2. **PUT /v1/weekly-schedules/:scheduleId** - Update schedule
3. **DELETE /v1/weekly-schedules/:scheduleId** - Soft delete schedule
4. **GET /v1/weekly-schedules** - List user's schedules (paginated)
5. **POST /v1/weekly-schedules/:scheduleId/generate** - AI schedule generation

### Testing Strategy

1. **Unit tests** for:
   - Service (database queries, RLS setup)
   - Mapper (entity → DTO transformation)
   - Controller (request handling)

2. **E2E tests** for:
   - Happy path (200 OK)
   - Invalid UUID (400)
   - Missing auth (401)
   - Not found (404)
   - Cross-user access (404, not 403)

3. **Integration tests** for:
   - Database migrations
   - RLS policy enforcement
   - TypeORM transformers

## Troubleshooting

### Common Issues

**"Cannot find module '@family-planner/shared-models-schedule'"**
- Run: `npx nx build shared-models-schedule`
- Check `tsconfig.base.json` paths configuration

**"SET LOCAL app.user_id" not working**
- Verify RLS policies are enabled on all tables
- Check that policies reference `current_setting('app.user_id')::uuid`

**Connection pool exhausted**
- Increase `extra.max` in TypeORM config
- Check for connection leaks (missing `await`)

**TypeORM sync issues**
- Never use `synchronize: true` in production
- Always use migrations for schema changes

## Contributing

1. Follow NestJS best practices
2. Use dependency injection
3. Write comprehensive tests (>80% coverage)
4. Document all public APIs with Swagger
5. Log important operations (INFO level)
6. Handle errors gracefully with proper status codes

## License

MIT

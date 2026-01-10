# Family Planner Backend API

NestJS backend application for the Family Planner project.

## Features

- ✅ **REST API** with Swagger/OpenAPI documentation
- ✅ **JWT Authentication** via Supabase Auth
- ✅ **PostgreSQL Database** with TypeORM and Row-Level Security (RLS)
- ✅ **Weekly Schedule Management** - Create, read, update, delete schedules
- ✅ **Global Validation** with class-validator
- ✅ **CORS** enabled for frontend communication
- ✅ **Health Check** endpoints
- ✅ **Graceful Shutdown** handling

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for PostgreSQL
- **Supabase** - PostgreSQL database with Auth
- **Passport JWT** - Authentication strategy
- **Swagger** - API documentation
- **class-validator** - DTO validation

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Supabase CLI installed
- PostgreSQL (via Supabase local dev)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Supabase locally:**
   ```bash
   npm run supabase:start
   ```

3. **Run database migrations:**
   ```bash
   npm run supabase:reset
   ```

4. **Create `.env` file in project root:**
   ```bash
   # Copy from template
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   # Application
   NODE_ENV=development
   PORT=3000
   FRONTEND_URL=http://localhost:4200

   # Database (Supabase local)
   DB_HOST=localhost
   DB_PORT=54322
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=postgres

   # JWT (Get from: supabase status)
   JWT_SECRET=your-supabase-jwt-secret
   JWT_EXPIRES_IN=1h
   JWT_ISSUER=https://supabase.io/auth
   JWT_AUDIENCE=your-project-id

   # Supabase
   SUPABASE_URL=http://localhost:54321
   SUPABASE_PROJECT_ID=your-project-id
   SUPABASE_ANON_KEY=your-anon-key
   ```

### Running the Application

#### Development Mode

```bash
# Start backend with hot-reload
npx nx serve backend

# Or with npm script
npm run start:backend
```

The API will be available at:
- **Base URL:** http://localhost:3000/api
- **Swagger Docs:** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/api/health

#### Production Build

```bash
# Build backend
npx nx build backend

# Run production build
node dist/apps/backend/main.js
```

## API Documentation

### Swagger UI

Interactive API documentation is available at:
```
http://localhost:3000/api/docs
```

Features:
- Try out endpoints directly in the browser
- See request/response schemas
- JWT authentication support
- Example values for all DTOs

### Available Endpoints

#### Health & Info

- `GET /api` - API information
- `GET /api/health` - Health check

#### Weekly Schedules (v1)

- `GET /api/v1/weekly-schedules/:scheduleId` - Get schedule by ID

**Authentication Required:** All schedule endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Example Request

```bash
# Get schedule by ID
curl -X GET "http://localhost:3000/api/v1/weekly-schedules/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Example Response

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
      "title": "Morning Workout",
      "blockType": "ACTIVITY",
      "timeRange": {
        "start": "2026-01-13T06:00:00Z",
        "end": "2026-01-13T07:00:00Z"
      },
      "isShared": false,
      "metadata": {},
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

## Project Structure

```
apps/backend/
├── src/
│   ├── app/
│   │   ├── app.module.ts      # Root module with TypeORM & ScheduleModule
│   │   ├── app.controller.ts  # Health & info endpoints
│   │   └── app.service.ts     # App-level services
│   └── main.ts                # Application bootstrap with Swagger
├── test/                      # E2E tests
├── project.json               # Nx project configuration
└── README.md                  # This file

libs/backend/feature-schedule/ # Schedule feature library (imported)
├── entities/                  # TypeORM entities
├── dto/                       # Request/Response DTOs
├── services/                  # Business logic
├── controllers/               # REST endpoints
├── guards/                    # JWT authentication
└── schedule.module.ts         # Feature module
```

## Testing

### Unit Tests

```bash
# Run all backend unit tests
npx nx test backend

# Watch mode
npx nx test backend --watch

# Coverage
npx nx test backend --coverage
```

### E2E Tests

```bash
# Run E2E tests
npx nx e2e backend-e2e

# With UI
npx nx e2e backend-e2e --ui
```

## Database

### Supabase Local Development

```bash
# Start Supabase (PostgreSQL + Auth)
npm run supabase:start

# Stop Supabase
npm run supabase:stop

# Reset database (drop all data & re-run migrations)
npm run supabase:reset

# Check status
npm run supabase:status
```

### Migrations

```bash
# Create new migration
npm run supabase:migration:new my_migration_name

# Apply migrations
npm run supabase:migration:up

# Generate TypeScript types from database schema
npm run supabase:gen:types
```

### Database Schema

The database includes these main tables:
- `weekly_schedules` - Weekly schedule metadata
- `time_blocks` - Individual time blocks within schedules
- `family_members` - Family member profiles
- `recurring_goals` - Recurring goals to schedule

All tables have:
- Row-Level Security (RLS) policies
- Soft-delete support (`deleted_at` column)
- JSONB metadata columns
- Proper indexes for performance

## Security

### Authentication

- JWT tokens from Supabase Auth
- Token validation via Passport JWT strategy
- Bearer token in Authorization header

### Authorization

- **Row-Level Security (RLS)** at PostgreSQL level
- **Application-level checks** in service layer
- Users can only access their own data
- `SET LOCAL app.user_id` for RLS context

### Validation

- Global ValidationPipe for all DTOs
- class-validator decorators
- Whitelist mode (unknown properties rejected)
- Transform mode (automatic type conversion)

## Performance

### Optimizations

- **Eager loading** to prevent N+1 queries
- **Connection pooling** (5-20 connections)
- **Partial indexes** on non-deleted records
- **JSONB indexes** for metadata queries

### Monitoring

Health check endpoint provides:
- Uptime
- Memory usage
- Database connection status
- Response time metrics

## Development

### Code Quality

```bash
# Lint
npx nx lint backend

# Format
npx nx format:write

# Type check
npx nx typecheck backend
```

### Debugging

```bash
# Run with debug logging
NODE_ENV=development npx nx serve backend
```

Add breakpoints in VSCode and use the Debug panel.

## Deployment

### Environment Variables

Required for production:

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-supabase-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-production-secret
SUPABASE_URL=https://your-project.supabase.co
```

### Build for Production

```bash
# Build
npx nx build backend --configuration=production

# Output in dist/apps/backend/
```

### Docker (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY dist/apps/backend ./
COPY node_modules ./node_modules
CMD ["node", "main.js"]
```

## Troubleshooting

### Common Issues

**"Cannot connect to database"**
- Check if Supabase is running: `npm run supabase:status`
- Verify DB credentials in `.env`
- Check port 54322 is not in use

**"JWT validation failed"**
- Verify JWT_SECRET matches Supabase
- Check token expiration
- Ensure Authorization header format: `Bearer <token>`

**"Module not found: @family-planner/..."**
- Build libraries first: `npx nx build shared-models-schedule`
- Check tsconfig.base.json paths

**"TypeORM synchronize error"**
- Never use `synchronize: true` in production
- Use migrations instead: `npm run supabase:migration:up`

## Contributing

1. Create feature branch
2. Make changes
3. Add tests
4. Run linting: `npx nx lint backend`
5. Commit changes
6. Push and create PR

## License

MIT

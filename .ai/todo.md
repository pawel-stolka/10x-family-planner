# TODO: Complete GET Weekly Schedule Endpoint Implementation

Based on `.ai/endpoints-implementation-plan.md`, the following items are missing from the backend implementation:

## 🧪 Testing (Phase 10 & 11)

### ❌ Unit Tests - Schedule Service
**File:** `libs/backend/feature-schedule/src/lib/services/schedule.service.spec.ts`

**What to implement:**
- Test `findScheduleById()` success scenario
- Test schedule not found (404)
- Test userId mismatch (404)
- Test soft-deleted time blocks filtering
- Test RLS context setup (`SET LOCAL app.user_id`)
- Mock `Repository<WeeklyScheduleEntity>` and `DataSource`

**Reference:** Lines 1430-1510 in endpoints-implementation-plan.md

---

### ❌ Unit Tests - Schedule Controller
**File:** `libs/backend/feature-schedule/src/lib/controllers/schedule.controller.spec.ts`

**What to implement:**
- Test successful DTO mapping
- Test NotFoundException propagation from service
- Mock `ScheduleService` and `ScheduleMapper`
- Verify logging calls

**Reference:** Lines 1513-1560 in endpoints-implementation-plan.md

---

### ❌ Unit Tests - Schedule Mapper
**File:** `libs/backend/feature-schedule/src/lib/mappers/schedule.mapper.spec.ts`

**What to implement:**
- Test entity to DTO transformation
- Test date formatting (weekStartDate → YYYY-MM-DD)
- Test nested entity mapping (familyMember, recurringGoal)
- Test timeRange Date → ISO string conversion

**Reference:** Lines 1563-1610 in endpoints-implementation-plan.md

---

### ❌ E2E Tests - GET Weekly Schedule
**File:** `apps/backend-e2e/src/backend/schedule-get.e2e-spec.ts`

**What to implement:**
- Setup: Create test user with auth token
- Setup: Create test schedule with time blocks
- Test 200 OK - return schedule data
- Test 401 Unauthorized - missing token
- Test 400 Bad Request - invalid UUID
- Test 404 Not Found - non-existent schedule
- Test 404 Not Found - cross-user access attempt

**How to implement:**
1. Use `@nestjs/testing` with `Test.createTestingModule()`
2. Use `supertest` for HTTP requests
3. Create helper functions for auth setup
4. Clean up test data in `afterAll()`

**Reference:** Lines 1615-1703 in endpoints-implementation-plan.md

---

## 📄 Documentation (Phase 12)

### ❌ Environment Variables Documentation
**File:** `.env.example`

**What to implement:**
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=family_planner

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-supabase-jwt-secret
JWT_ISSUER=https://supabase.io/auth
JWT_AUDIENCE=your-project-id
JWT_EXPIRES_IN=1h

# Application Configuration
NODE_ENV=development
PORT=3000
```

**Reference:** Lines 1712-1728 in endpoints-implementation-plan.md

---

### ❌ Monitoring Setup (Optional)
**File:** `libs/backend/feature-schedule/src/lib/services/schedule.service.ts`

**What to add:**
- CloudWatch custom metrics helper function
- Response time logging
- Error rate tracking

**How to implement:**
1. Create `logMetric()` helper (lines 1743-1763)
2. Track request duration in `findScheduleById()`
3. Log to CloudWatch Logs format (JSON structured)

**Reference:** Lines 1741-1769 in endpoints-implementation-plan.md

---

## 🚀 Deployment Checklist

### ❌ Pre-deployment Verification

**Before deploying to production:**
- [ ] All unit tests passing (`npm test`)
- [ ] All E2E tests passing (`npm run test:e2e`)
- [ ] Database migrations applied in Supabase
- [ ] RLS policies enabled on all tables
- [ ] Indexes created (check `supabase/migrations/`)
- [ ] Environment variables set in deployment environment
- [ ] SSL enabled for database connections
- [ ] CORS configured properly
- [ ] Rate limiting tested (60 req/min/user)
- [ ] Load testing performed

**Reference:** Lines 1730-1740 in endpoints-implementation-plan.md

---

## 📊 Priority Order

1. **HIGH**: Unit tests (ensures code quality)
2. **HIGH**: E2E tests (ensures API works end-to-end)
3. **MEDIUM**: `.env.example` (developer onboarding)
4. **LOW**: Monitoring setup (can be added incrementally)
5. **LOW**: Deployment checklist validation (before production)

---

## 🛠️ How to Run Tests (Once Implemented)

```bash
# Run all unit tests
npm test

# Run unit tests for schedule feature
npm test libs/backend/feature-schedule

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm test -- --coverage
```

---

## 📝 Notes

- Use **Jest** for unit tests (already configured)
- Use **Supertest** for E2E tests (already configured)
- Follow existing test patterns from `libs/backend/feature-auth/src/lib/services/auth.service.spec.ts`
- **Do NOT use TestBed** for Angular tests (per workspace rules)
- **Do NOT use `.subscribe()`** in tests (per workspace rules)

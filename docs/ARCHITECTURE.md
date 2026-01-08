# Family Planner - Architecture Documentation

## Overview

This document outlines the technical architecture decisions for the Family Planner application, including tech stack evaluation, pros/cons analysis, and the chosen implementation path.

## Tech Stack

### Frontend

- **Framework**: Angular 19+ (latest)
- **Architecture**: Standalone Components
- **Styling**: SCSS
- **Testing**: Jest (no TestBed)
- **Language**: TypeScript

### Backend (Chosen Architecture)

- **Framework**: NestJS
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: Prisma or TypeORM
- **Authentication**: Passport.js + JWT
- **Language**: TypeScript

### Monorepo

- **Tool**: NX
- **Structure**:
  ```
  family-planner/
  ├── apps/
  │   ├── frontend/          # Angular application
  │   └── backend/           # NestJS application
  ├── libs/
  │   └── shared/            # Shared TypeScript types/interfaces
  └── nx.json
  ```

## Backend Architecture Decision

### Evaluated Options

#### Option 1: NestJS + PostgreSQL ✅ CHOSEN

**Stack**: NestJS → PostgreSQL (Supabase)

**Pros**:

- Strong TypeScript ecosystem with seamless Angular integration
- Structured architecture following SOLID principles
- Built-in features (auth, validation, ORM integration)
- Monorepo friendly with NX workspace
- High job market value
- Easy local development
- Official certification path available
- Free PostgreSQL hosting via Supabase

**Cons**:

- Traditional server deployment needed (mitigated by Railway/Render free tiers)
- Scaling costs at high traffic (not immediate concern)

**Use Cases**:

- Course completion and learning
- Building strong full-stack TypeScript skills
- Portfolio projects
- Enterprise-ready patterns

---

#### Option 2: AWS Lambda + PostgreSQL/DynamoDB

**Stack**: Angular → AWS Lambda (Node.js) → RDS/DynamoDB

**Pros**:

- Pay-per-use pricing model
- Auto-scaling capabilities
- Aligns with AWS certifications
- Modern serverless architecture
- No server management
- Portfolio differentiator

**Cons**:

- Cold start latency (500ms-2s)
- Complex setup (API Gateway, IAM, CloudFormation)
- Harder local development
- Debugging challenges with CloudWatch
- Vendor lock-in
- Steeper learning curve
- Cost unpredictability

**Use Cases**:

- Post-certification career advancement
- AWS certification path
- Production scalability
- Cloud-native architecture

---

#### Option 3: Hybrid - NestJS on AWS Lambda

**Stack**: NestJS Framework → AWS Lambda → PostgreSQL/DynamoDB

**Pros**:

- Combines NestJS structure with serverless benefits
- Framework familiarity while learning AWS
- Flexible deployment options (Lambda or traditional)

**Cons**:

- Cold starts with added NestJS overhead
- Configuration complexity
- Not fully optimized for either approach

**Use Cases**:

- Migration from traditional to serverless
- Maintaining NestJS patterns in serverless environment

---

#### Option 4: Supabase-First (Direct from Frontend)

**Stack**: Angular → Supabase (auto-generated APIs)

**Pros**:

- Fastest development (no backend coding for CRUD)
- Realtime capabilities out-of-box
- Row Level Security (RLS) for authorization
- All-in-one solution (auth, database, storage)

**Cons**:

- Less control over business logic
- Limited learning of backend development
- Complex SQL-based security policies
- NestJS skills not utilized

**Use Cases**:

- Rapid MVPs
- Prototyping
- Simple CRUD applications

## Chosen Architecture: NestJS + Supabase PostgreSQL

### Implementation Strategy

**Phase 1: Course Completion (2-3 months)**

- Use Supabase as PostgreSQL database only
- Build full NestJS backend with custom authentication
- Implement business logic in NestJS
- Share TypeScript types between frontend/backend
- Deploy NestJS to Railway/Render (free tier)

**Phase 2: Post-Certification (Ongoing)**

- Pursue AWS certifications
- Experiment with Lambda for specific features
- Optionally migrate to Supabase auth/storage
- Document migration process for portfolio

### Why This Approach?

1. **Faster Development**: Focus on features, not infrastructure
2. **Better Debugging**: Easier local troubleshooting
3. **TypeScript Mastery**: Full-stack TypeScript skills
4. **NX Monorepo Benefits**: Shared libraries between apps
5. **Certification Synergy**: NestJS + Angular certifications
6. **Portfolio Value**: Demonstrates enterprise patterns
7. **Free Hosting**: Supabase PostgreSQL + Railway/Render

## Supabase Integration

### Using Supabase as Database Only

Supabase provides a managed PostgreSQL instance with:

- 500MB database storage (free tier)
- Automatic backups
- Web-based database UI
- Connection string for any PostgreSQL client

**Connection in NestJS**:

```typescript
// .env
DATABASE_URL =
  'postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

// NestJS treats it as regular PostgreSQL
// Works with Prisma, TypeORM, or any PostgreSQL client
```

### Future Enhancement Options

**Hybrid Approach (Phase 2)**:

- Keep NestJS for complex business logic
- Add Supabase Auth (replace custom JWT)
- Add Supabase Storage for file uploads
- Use Supabase Realtime for live updates
- Maintain database operations through NestJS

**Benefits of Hybrid**:

- Leverage Supabase features without losing backend control
- Faster auth implementation
- Built-in file storage (1GB free)
- Realtime subscriptions included

## Database Comparison

| Database                  | Best For                          | Complexity | Free Tier |
| ------------------------- | --------------------------------- | ---------- | --------- |
| **PostgreSQL (Supabase)** | Relational data, complex queries  | Medium     | 500MB     |
| **MongoDB Atlas**         | Flexible schemas, rapid iteration | Low        | 512MB     |
| **DynamoDB**              | AWS-native, serverless            | Medium     | 25GB      |

**Choice**: PostgreSQL via Supabase

- Family planner has relational data (users, events, tasks, families)
- Complex queries needed (shared calendars, permissions)
- Free tier sufficient for development
- Production-ready from start

## Deployment Strategy

### Development

- **Frontend**: Local dev server (`nx serve frontend`)
- **Backend**: Local dev server (`nx serve backend`)
- **Database**: Remote Supabase PostgreSQL

### Production (Initial)

- **Frontend**: Vercel or Netlify (free tier)
- **Backend**: Railway or Render (free tier)
- **Database**: Supabase (free tier)

### Production (Future - Post AWS Certification)

- **Frontend**: AWS S3 + CloudFront
- **Backend**: AWS Lambda + API Gateway
- **Database**: Aurora Serverless or RDS PostgreSQL
- **Auth**: AWS Cognito or Supabase Auth

## Cost Estimation

### Year 1 (Learning Phase)

- **Railway/Render (NestJS)**: $0-5/month
- **Supabase**: $0/month (free tier)
- **Vercel/Netlify (Angular)**: $0/month (free tier)
- **Total**: $0-60/year

### Supabase Free Tier Limits

| Feature      | Limit     | Sufficient? |
| ------------ | --------- | ----------- |
| Database     | 500MB     | ✅ Yes      |
| Auth Users   | Unlimited | ✅ Yes      |
| Storage      | 1GB       | ✅ Yes      |
| Bandwidth    | 2GB/month | ✅ Yes      |
| API Requests | Unlimited | ✅ Yes      |

## Shared Libraries Strategy

### libs/shared Structure

```
libs/
└── shared/
    ├── interfaces/        # Shared TypeScript interfaces
    │   ├── user.interface.ts
    │   ├── event.interface.ts
    │   └── task.interface.ts
    ├── dtos/             # Data Transfer Objects
    │   └── create-event.dto.ts
    ├── enums/            # Shared enumerations
    │   └── event-type.enum.ts
    └── utils/            # Shared utility functions
        └── date.utils.ts
```

**Benefits**:

- Type safety between frontend and backend
- Single source of truth for data models
- Easier refactoring
- Better developer experience

## Authentication Strategy

### Phase 1: Custom JWT Authentication

```
Login Flow:
1. User submits credentials to NestJS
2. NestJS validates against PostgreSQL
3. Issues JWT token
4. Angular stores token (httpOnly cookie or localStorage)
5. Angular sends token in Authorization header
6. NestJS validates token with Passport.js
```

**Implementation**:

- NestJS Passport.js with JWT strategy
- bcrypt for password hashing
- Guards for route protection
- Refresh token mechanism

### Phase 2 (Optional): Supabase Auth

```
Login Flow:
1. User authenticates with Supabase Auth
2. Supabase returns JWT
3. Angular sends JWT to NestJS
4. NestJS validates Supabase JWT
5. NestJS performs business logic
```

## Testing Strategy

### Frontend (Angular + Jest)

- No TestBed (as per requirements)
- No `.subscribe()` in tests
- Focus on component logic and integration

### Backend (NestJS + Jest)

- Unit tests for services
- E2E tests for API endpoints
- Integration tests for database operations

## API Design

### RESTful Endpoints

```
GET    /api/events              # List events
GET    /api/events/:id          # Get event details
POST   /api/events              # Create event
PUT    /api/events/:id          # Update event
DELETE /api/events/:id          # Delete event

GET    /api/tasks               # List tasks
POST   /api/tasks               # Create task
...

POST   /api/auth/login          # Login
POST   /api/auth/register       # Register
POST   /api/auth/refresh        # Refresh token
```

### Future: GraphQL (Optional)

- Consider GraphQL if frontend needs complex data fetching
- NestJS has excellent GraphQL support

## Security Considerations

1. **Authentication**: JWT with refresh tokens
2. **Authorization**: Role-based access control (RBAC)
3. **Validation**: Class-validator in NestJS DTOs
4. **SQL Injection**: Protected by ORM (Prisma/TypeORM)
5. **CORS**: Configured in NestJS for Angular origin
6. **Rate Limiting**: Implement throttling in NestJS
7. **HTTPS**: Enforced in production

## Migration Path to Serverless (Future)

When ready to migrate to AWS Lambda:

1. **Keep NestJS code**: Use Serverless Framework or AWS SAM
2. **Convert endpoints**: Each NestJS module → Lambda function or monolithic Lambda
3. **Update database**: Keep Supabase or migrate to RDS/Aurora
4. **Add API Gateway**: Map Lambda functions to HTTP endpoints
5. **Update auth**: Integrate with AWS Cognito or keep JWT
6. **Document process**: Great portfolio/blog content

**Tools**:

- Serverless Framework (easier)
- AWS SAM (AWS-native)
- AWS CDK (infrastructure as code)

## Certification Path Alignment

### Completed/In Progress

- **Angular Certification**: Current focus
- **Full-stack TypeScript**: This project

### Recommended Next Steps

1. **NestJS Certification** (if available)
2. **AWS Solutions Architect Associate**
3. **AWS Developer Associate**
4. **MongoDB Associate** (if going NoSQL)

## Success Metrics

### Technical

- Sub-second API response times
- 100% type safety across frontend/backend
- 80%+ test coverage
- Zero TypeScript errors

### Learning

- Complete understanding of NestJS patterns
- Ability to explain architectural decisions
- Portfolio-ready project
- Deployable production application

## Development Setup & Prerequisites

### Required Tools

- **Node.js**: v18+ or v20+ (LTS recommended)
- **npm**: v9+ (comes with Node.js)
- **NX CLI**: Installed locally in project
- **Git**: For version control
- **VS Code**: Recommended IDE with extensions:
  - Angular Language Service
  - Prettier
  - ESLint
  - Jest Runner

### Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd family-planner

# Install dependencies
npm install

# Copy environment template (when created)
cp .env.example .env

# Start development servers
npm run start:all  # If configured, or use separate terminals
```

## Environment Variables Reference

### Backend (.env)

```bash
# Database
DATABASE_URL="postgresql://postgres.[ref]:[password]@db.supabase.co:5432/postgres"

# JWT Authentication
JWT_SECRET="your-secret-key-here"
JWT_EXPIRATION="1h"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRATION="7d"

# Application
NODE_ENV="development"
PORT=3000

# CORS
ALLOWED_ORIGINS="http://localhost:4200"
```

### Frontend (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  appName: 'Family Planner',
};
```

## Common NX Commands

### Development

```bash
# Serve frontend (Angular)
nx serve frontend
# or
npm run start:frontend

# Serve backend (NestJS)
nx serve backend
# or
npm run start:backend

# Serve both (if configured)
nx run-many --target=serve --projects=frontend,backend --parallel
```

### Building

```bash
# Build frontend
nx build frontend --configuration=production

# Build backend
nx build backend --configuration=production

# Build all
nx run-many --target=build --all
```

### Testing

```bash
# Test frontend
nx test frontend

# Test backend
nx test backend

# Test all
nx run-many --target=test --all

# E2E tests (when configured)
nx e2e frontend-e2e
```

### Code Quality

```bash
# Lint frontend
nx lint frontend

# Lint backend
nx lint backend

# Lint all
nx run-many --target=lint --all

# Format with Prettier
npx prettier --write .
```

### Generate Code

```bash
# Generate Angular component
nx generate @nx/angular:component my-component --project=frontend

# Generate NestJS resource (CRUD)
nx generate @nx/nest:resource my-resource --project=backend

# Generate shared library
nx generate @nx/js:library my-lib --directory=libs/my-lib

# Generate Angular service
nx generate @nx/angular:service my-service --project=frontend
```

### NX Graph & Analysis

```bash
# View dependency graph
nx graph

# Check affected projects
nx affected:graph

# Run tests only for affected
nx affected:test

# Build only affected
nx affected:build
```

## Development Workflow

### Feature Development Process

1. **Create feature branch**

   ```bash
   git checkout -b feature/feature-name
   ```

2. **Generate necessary code**

   - Backend: NestJS module, service, controller
   - Frontend: Angular components, services
   - Shared: TypeScript interfaces in libs/shared

3. **Implement feature**

   - Write tests first (TDD) or alongside code
   - Keep commits small and focused
   - Run linter frequently

4. **Test locally**

   ```bash
   nx test frontend
   nx test backend
   nx lint frontend
   nx lint backend
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   git push origin feature/feature-name
   ```

### Shared Types Workflow

When adding/modifying data models:

1. **Define interface in libs/shared**

   ```typescript
   // libs/shared/src/lib/interfaces/user.interface.ts
   export interface User {
     id: string;
     email: string;
     name: string;
   }
   ```

2. **Import in backend**

   ```typescript
   import { User } from '@family-planner/shared';
   ```

3. **Import in frontend**

   ```typescript
   import { User } from '@family-planner/shared';
   ```

4. **Benefits**: Single source of truth, type safety across apps

## Troubleshooting Common Issues

### NX Issues

**Problem**: `nx: command not found`

```bash
# Solution: Use npx or install globally
npx nx <command>
# or
npm install -g nx
```

**Problem**: Module not found after generating library

```bash
# Solution: Restart TypeScript server in VS Code
# Command Palette > TypeScript: Restart TS Server
```

**Problem**: Cache issues

```bash
# Solution: Clear NX cache
nx reset
```

### Backend (NestJS) Issues

**Problem**: Database connection fails

```bash
# Check:
# 1. DATABASE_URL is correct in .env
# 2. Supabase project is active
# 3. Database pooling connection string is used
# 4. Check Supabase dashboard for connection limits
```

**Problem**: Module import errors

```bash
# Solution: Check module is properly imported in AppModule
# Verify @Module decorators and imports array
```

### Frontend (Angular) Issues

**Problem**: CORS errors when calling backend

```bash
# Solution: Ensure CORS is configured in NestJS main.ts
app.enableCors({
  origin: 'http://localhost:4200',
  credentials: true
});
```

**Problem**: Standalone component errors

```bash
# Solution: Ensure all dependencies are imported in component
# imports: [CommonModule, RouterModule, etc.]
```

### Database Issues

**Problem**: Prisma/TypeORM migrations fail

```bash
# Solution: Check DATABASE_URL format
# Ensure database is accessible
# Check migration files for syntax errors
```

## Project Status & Next Steps

### Current Status

- [x] NX workspace created
- [x] Architecture documented
- [x] Frontend Angular app generated (Angular 20.3.0, standalone components)
- [x] Backend NestJS app generated (NestJS 11.0.0)
- [x] E2E tests configured (Playwright for frontend, Jest for backend)
- [x] Linting and testing infrastructure set up
- [ ] Shared library created
- [ ] Environment configuration files (.env, environment.ts)
- [ ] Database connection configured (Supabase)
- [ ] Authentication implemented
- [ ] Basic CRUD operations

### Immediate Next Steps

1. **Create shared library** - For TypeScript interfaces, DTOs, and utilities

   ```bash
   nx generate @nx/js:library shared --directory=libs/shared --importPath=@family-planner/shared
   ```

2. **Set up environment files** - Create .env for backend, environment.ts for frontend

3. **Create Supabase project** - Set up PostgreSQL database

4. **Install additional dependencies**:

   - Backend: `@nestjs/config`, `@nestjs/passport`, `@nestjs/jwt`, `bcrypt`, `class-validator`, `class-transformer`
   - Database ORM: Choose Prisma or TypeORM

5. **Configure database connection** - Add connection in NestJS

6. **Implement authentication module** - JWT-based auth with Passport.js

7. **Create first feature module** - Example: User management or Events

### Future Enhancements

- [ ] Add Supabase Auth integration
- [ ] Implement file upload with Supabase Storage
- [ ] Add real-time features
- [ ] Implement comprehensive testing
- [ ] Set up CI/CD pipeline
- [ ] Deploy to Railway/Render
- [ ] Add monitoring and logging
- [ ] Optimize performance

## Decision Log

### 2025-11-14: Initial Architecture

**Decision**: Use NestJS + Supabase PostgreSQL
**Rationale**: Focus on learning full-stack TypeScript while keeping costs low. Supabase provides free PostgreSQL hosting without sacrificing NestJS learning opportunities.
**Alternatives Considered**: AWS Lambda (too complex for initial learning), Supabase-first (doesn't teach backend patterns)

### 2025-11-14: Monorepo Setup

**Decision**: Use NX for monorepo management
**Rationale**: Excellent Angular/NestJS support, shared libraries, build optimization, and strong TypeScript integration.
**Alternatives Considered**: npm workspaces (less features), Turborepo (less Angular-specific)

### 2025-11-14: Apps Generated

**Status**: Frontend and Backend apps successfully created
**Details**:

- Frontend: Angular 20.3.0 with standalone components, SCSS styling, routing enabled
- Backend: NestJS 11.0.0 with module/controller/service structure
- E2E Tests: Playwright for frontend, Jest for backend
- Next: Create shared library and set up database connection

## Quick Reference

### Project Structure

```
family-planner/
├── apps/
│   ├── frontend/              # Angular 19+ app
│   │   ├── src/
│   │   │   ├── app/          # Application code
│   │   │   └── assets/       # Static assets
│   │   └── project.json      # NX project config
│   └── backend/              # NestJS app
│       ├── src/
│       │   ├── app/          # Application modules
│       │   └── main.ts       # Entry point
│       └── project.json      # NX project config
├── libs/
│   └── shared/               # Shared TypeScript code
│       ├── src/
│       │   └── lib/
│       │       ├── interfaces/
│       │       ├── dtos/
│       │       ├── enums/
│       │       └── utils/
│       └── project.json
├── node_modules/
├── .env                      # Environment variables (not in git)
├── .gitignore
├── nx.json                   # NX configuration
├── package.json
├── tsconfig.base.json        # TypeScript base config
└── ARCHITECTURE.MD           # This file
```

### Port Assignments

- **Frontend**: `http://localhost:4200`
- **Backend**: `http://localhost:3000`
- **Database**: Remote (Supabase)

### Key Technologies Version (Installed)

- **Angular**: 20.3.0 (standalone components)
- **NestJS**: 11.0.0
- **NX**: 22.0.3
- **TypeScript**: 5.9.2
- **Node.js**: 18+ or 20+ (required)

## Resources

### Documentation

- [NestJS Docs](https://docs.nestjs.com/)
- [Angular Docs](https://angular.dev/)
- [NX Docs](https://nx.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [TypeORM Docs](https://typeorm.io/)

### Learning

- [NestJS Courses](https://courses.nestjs.com/)
- [Angular University](https://angular-university.io/)
- [NX Workspace Tutorial](https://nx.dev/getting-started/tutorials)

### Tools

- [NX Console](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console) - VS Code extension
- [Postman](https://www.postman.com/) - API testing
- [DBeaver](https://dbeaver.io/) - Database client

---

**Last Updated**: November 14, 2025
**Status**: Architecture Defined - Ready for Implementation
**Purpose**: Internal reference for development and AI assistance

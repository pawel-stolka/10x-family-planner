# shared-models-schedule

Shared TypeScript models and types for the Family Planner schedule system.

## Contents

- `supabase.types.ts` - Auto-generated TypeScript types from Supabase database schema

## Usage

```typescript
import { Database } from '@family-planner/shared-models-schedule';

// Use the generated types
type WeeklySchedule = Database['public']['Tables']['weekly_schedules']['Row'];
```

## Regenerating Types

To regenerate types from the Supabase database schema:

```bash
npm run supabase:gen:types
```

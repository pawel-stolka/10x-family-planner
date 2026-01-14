# Family Planner - Testing Guide

## Application is Running! 🎉

Your app is running at: **http://localhost:6400/**

## Features Implemented & How to Test

### 1. Authentication System ✅

#### Registration

1. Navigate to http://localhost:6400/register
2. Fill in the registration form:
   - Email (e.g., `test@example.com`)
   - Password (min 6 characters)
   - Display Name (e.g., `John Doe`)
3. Click "Register"
4. Upon success, you'll be redirected to the dashboard

#### Login

1. Navigate to http://localhost:6400/login
2. Use your registered credentials
3. Click "Login"
4. You'll be redirected to the dashboard

#### Auth Features:

- ✅ JWT token-based authentication
- ✅ Protected routes (dashboard, family, goals)
- ✅ Public-only routes (login/register redirect if already authenticated)
- ✅ Auto-redirect to dashboard after login
- ✅ Logout functionality
- ✅ Auth interceptor adds token to API requests
- ✅ Persistent auth state (survives page refresh)

### 2. Navigation ✅

The app now has a beautiful navigation bar with:

- **Brand/Logo**: Links to home
- **Navigation Links** (when authenticated):
  - Dashboard
  - Family
  - Goals
- **User Menu**: Shows email and Logout button
- **Auth Actions** (when not authenticated):
  - Login button
  - Register button

### 3. Family Management ✅

Navigate to http://localhost:6400/family

#### Features:

- ✅ View all family members
- ✅ Add new family member
- ✅ Edit existing family member
- ✅ Delete family member
- ✅ Family member roles: USER, SPOUSE, CHILD
- ✅ Member preferences (interests, dietary restrictions, etc.)
- ✅ Beautiful card-based UI
- ✅ Age and interests display

#### How to Test:

1. Click "Add Family Member" button
2. Fill in the form:
   - Name (required)
   - Role (required): Select USER, SPOUSE, or CHILD
   - Age (optional)
   - Interests (optional): comma-separated list
3. Click "Save"
4. The member will appear in the list
5. Use Edit (✏️) and Delete (🗑️) buttons on each card

### 4. Goals Management ✅

Navigate to http://localhost:6400/goals

#### Features:

- ✅ View all recurring goals
- ✅ Add new goal
- ✅ Edit existing goal
- ✅ Delete goal
- ✅ Goal types: HEALTH, WORK, PERSONAL, FAMILY, LEARNING, OTHER
- ✅ Recurrence patterns: DAILY, WEEKLY, MONTHLY
- ✅ Duration and preferred time of day
- ✅ Priority levels: HIGH, MEDIUM, LOW
- ✅ Status tracking: ACTIVE, PAUSED, COMPLETED
- ✅ Beautiful card-based UI

#### How to Test:

1. Click "Add New Goal" button
2. Fill in the form:
   - Title (required)
   - Description (optional)
   - Goal Type (required)
   - Recurrence (required)
   - Days of Week (for WEEKLY recurrence)
   - Duration (required, in minutes)
   - Preferred Time (optional): MORNING, AFTERNOON, EVENING
   - Priority (required)
   - Owner (optional): Select family member
3. Click "Save Goal"
4. The goal will appear in the list
5. Use Edit and Delete buttons on each card

### 5. Fixed Commitments (Work/School/Sleep) ✅

Navigate to http://localhost:6400/commitments

#### Features:

- ✅ View all recurring fixed commitments
- ✅ Add new commitment
- ✅ Edit existing commitment
- ✅ Delete commitment
- ✅ Weekly schedule (specify day of week + time range)
- ✅ Block types: WORK, ACTIVITY, MEAL, OTHER
- ✅ Can be assigned to individual family members or marked as shared
- ✅ Used as hard constraints during AI schedule generation
- ✅ Displayed with "Fixed" badge in weekly calendar

#### How to Test:

1. Click "Add New Commitment" button
2. Fill in the form:
   - Title (required): e.g., "Work Hours", "School", "Sleep"
   - Owner (optional): Select family member or leave empty for shared
   - Is Shared (checkbox): Check if this commitment applies to multiple people
   - Day of Week (required): Select Monday-Sunday
   - Start Time (required): e.g., "09:00"
   - End Time (required): e.g., "17:00"
   - Block Type (required): WORK, ACTIVITY, MEAL, or OTHER
3. Click "Save Commitment"
4. The commitment will appear in the list
5. Use Edit and Delete buttons on each card

#### Purpose:

Fixed commitments are "non-negotiable" blocks that:

- **Must appear every week** (e.g., work hours, school pickup, sleep)
- **Cannot be moved** by the AI schedule generator
- **Block out time** so the AI won't schedule goals during those times
- **Are displayed in the calendar** with a "Fixed" badge

Example commitments:

- Work: Monday-Friday 9am-5pm (per parent)
- School: Monday-Friday 8am-3pm (per child)
- Sleep: Every day 10pm-6am (per person)
- Family Dinner: Every day 6pm-7pm (shared)

### 6. Dashboard & Weekly Calendar ✅

Navigate to http://localhost:6400/dashboard

#### Features:

- ✅ Welcome message with user name
- ✅ Account information display
- ✅ Schedule generation button (connects to backend AI)
- ✅ **Enhanced family-wide weekly calendar view**:
  - Groups blocks by day and family member
  - Shows shared blocks separately
  - Displays badges: "Shared", "Goal" (for recurring goals), "Fixed" (for commitments)
  - Filter buttons: All, Shared, or by individual family member
  - Color-coded by block type (WORK, ACTIVITY, MEAL, OTHER)
- ✅ Next steps guide

#### How the AI Schedule Generator Works:

1. Loads all family members
2. Loads all recurring goals
3. **Loads all fixed commitments as hard constraints**
4. Calls OpenAI GPT-4 to generate schedule
5. **AI respects fixed commitments and never schedules over them**
6. AI schedules each goal the specified number of times per week
7. Creates shared blocks when `maximizeFamilyTime=true`
8. Saves schedule with links to recurring goals
9. Displays complete week in calendar with all badges

## Testing Workflow

### Complete Test Flow:

1. **Start Fresh**

   ```bash
   # Backend should be running on port 3000
   # Frontend should be running on port 6400
   ```

2. **Register a New User**

   - Go to http://localhost:6400/register
   - Create account: `test@example.com` / `password123`
   - Verify redirect to dashboard

3. **Add Family Members**

   - Navigate to `/family`
   - Add yourself as USER
   - Add spouse as SPOUSE
   - Add children as CHILD
   - Add interests for each member

4. **Create Goals**

   - Navigate to `/goals`
   - Create goals with desired frequency (e.g., "Morning Run" 3x/week, "Guitar Practice" 2x/week)
   - Assign owners to goals
   - Set preferred times of day and priorities

5. **Add Fixed Commitments**

   - Navigate to `/commitments`
   - Add work hours for parents (Monday-Friday 9am-5pm)
   - Add school time for children (Monday-Friday 8am-3pm)
   - Add sleep blocks for everyone (daily 10pm-6am)
   - Add shared family dinner (daily 6pm-7pm)
   - These will act as hard constraints the AI cannot violate

6. **Test Schedule Generation** (Dashboard)

   - Click "Generate Week Schedule"
   - View AI-generated schedule in calendar
   - **Verify fixed commitments appear with "Fixed" badge**
   - **Verify goal-linked blocks appear with "Goal" badge**
   - **Verify shared blocks appear with "Shared" badge**
   - **Use filter buttons to view specific family members**
   - Check that schedule respects goals, preferences, and commitments
   - Confirm AI did not schedule goals during fixed commitment times

7. **Test Navigation**

   - Use navigation bar to switch between sections
   - Verify active state highlighting
   - Check responsive design (resize browser)

8. **Test Auth Flow**
   - Logout from user menu
   - Try accessing `/dashboard` directly (should redirect to login)
   - Login again
   - Verify data persists

## API Integration

The frontend is configured to work with the backend API:

- **Proxy Configuration**: `/api/*` → `http://localhost:3000/api/*`
- **Auth Interceptor**: Automatically adds JWT token to requests
- **Error Handling**: Displays user-friendly error messages

### API Endpoints Used:

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/family-members` - List family members
- `POST /api/v1/family-members` - Create family member
- `PATCH /api/v1/family-members/:id` - Update family member
- `DELETE /api/v1/family-members/:id` - Delete family member
- `GET /api/v1/recurring-goals` - List goals
- `POST /api/v1/recurring-goals` - Create goal
- `PATCH /api/v1/recurring-goals/:id` - Update goal
- `DELETE /api/v1/recurring-goals/:id` - Delete goal
- `GET /api/v1/recurring-commitments` - List fixed commitments
- `POST /api/v1/recurring-commitments` - Create commitment
- `PATCH /api/v1/recurring-commitments/:id` - Update commitment
- `DELETE /api/v1/recurring-commitments/:id` - Delete commitment
- `POST /api/v1/schedule-generator/generate` - Generate schedule (includes goals + commitments)

## Known Issues & Limitations

1. **Schedule Generation**: Requires backend AI service to be properly configured with OpenAI API key
2. **Mobile Responsiveness**: Tested on desktop, mobile styling is present but may need refinement
3. **Error Messages**: Basic error handling implemented, could be enhanced with more specific messages
4. **Loading States**: Basic spinners implemented, could add skeleton loaders

## Architecture Highlights

### Monorepo Structure:

```
family-planner/
├── apps/
│   ├── frontend/          # Angular app
│   └── backend/           # NestJS app
└── libs/
    ├── frontend/
    │   ├── feature-auth/              # Login/Register components
    │   ├── feature-family/            # Family management
    │   ├── feature-goals/             # Goals management
    │   ├── feature-commitments/       # Fixed commitments management
    │   ├── data-access-auth/          # Auth store & services
    │   ├── data-access-family/        # Family store & services
    │   ├── data-access-goals/         # Goals store & services
    │   ├── data-access-commitments/   # Commitments store & services
    │   └── data-access-schedule/      # Schedule store & services
    ├── backend/
    │   ├── feature-auth/         # Auth module
    │   └── feature-schedule/     # Schedule module
    └── shared/
        └── models-schedule/      # Shared types
```

### Key Technologies:

- **Frontend**: Angular 18+ (standalone components, signals)
- **Backend**: NestJS
- **State Management**: Angular Signals
- **Routing**: Angular Router with guards
- **Styling**: SCSS with modern design
- **HTTP**: HttpClient with interceptors
- **Build Tool**: Nx

## Next Steps

After testing the basic features:

1. Test schedule generation with different goals
2. Test with multiple family members
3. Verify calendar displays schedules correctly
4. Check all CRUD operations work properly
5. Test logout/login flow multiple times
6. Try different screen sizes

## Troubleshooting

### Backend Not Running:

```bash
cd family-planner
npx nx serve backend
```

### Frontend Not Running:

```bash
cd family-planner
npx nx serve frontend
```

### Clear Auth State:

- Open browser DevTools → Application → Local Storage
- Clear `auth_token` and `auth_user` keys

### API Not Responding:

- Check backend is running on http://localhost:3000
- Check proxy.conf.json is configured correctly
- Check CORS settings in backend

## Success Criteria ✅

- [x] User can register and login
- [x] User can add/edit/delete family members
- [x] User can add/edit/delete recurring goals
- [x] Navigation works seamlessly
- [x] Auth guards protect routes
- [x] UI is modern and responsive
- [x] API integration works
- [x] State management with signals works
- [x] Error handling is user-friendly

Enjoy testing your Family Life Planner! 🎉👨‍👩‍👧‍👦

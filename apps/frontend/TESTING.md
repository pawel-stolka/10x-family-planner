# Testing Guide - Family Life Planner Frontend

## Quick Start

### 1. Start the Development Server

```bash
npx nx serve frontend
```

The app will be available at: **http://localhost:4200**

### 2. Backend Proxy Configuration

The frontend is configured to proxy API requests to the backend:
- **Proxy**: `/api` → `http://localhost:3000`
- **Config**: `apps/frontend/proxy.conf.json`

**To use with backend:**
1. Start backend: `npx nx serve backend` (runs on port 3000)
2. Start frontend: `npx nx serve frontend` (runs on port 4200)
3. API calls to `/api/*` will be proxied to `http://localhost:3000`

## Testing Scenarios

### Scenario 1: Registration Flow ✅

1. Navigate to **http://localhost:4200** → Auto-redirects to `/login`
2. Click **"Sign up"** link → Navigate to `/register`
3. Fill in registration form:
   - Email: `test@example.com`
   - Display Name: `John Doe` (optional)
   - Password: minimum 8 characters
   - Confirm Password: must match
   - Accept Terms: required checkbox
4. Observe **password strength indicator** (weak/medium/strong)
5. Click **"Create Account"**

**Expected behavior:**
- ✅ Form validation works (inline errors)
- ✅ Password visibility toggle works
- ✅ Submit button disabled until form valid
- ✅ Loading state shows spinner
- ⚠️ API call fails (if backend not running) → Error banner displays
- ✅ On success: Navigate to `/dashboard`

### Scenario 2: Login Flow ✅

1. Navigate to **http://localhost:4200/login**
2. Fill in login form:
   - Email: `test@example.com`
   - Password: your password
   - Remember me: optional
3. Click **"Sign In"**

**Expected behavior:**
- ✅ Form validation works
- ✅ Password visibility toggle works
- ✅ Loading state shows spinner
- ⚠️ API call fails (if backend not running) → Error banner displays "Invalid email or password"
- ✅ On success: Navigate to `/dashboard`

### Scenario 3: Route Guards ✅

**PublicOnlyGuard** (prevents authenticated users from accessing login/register):
1. Login successfully
2. Try to navigate to `/login` or `/register`
3. **Expected**: Auto-redirect to `/dashboard`

**AuthGuard** (protects dashboard from unauthenticated users):
1. Logout (or open incognito window)
2. Try to navigate to `/dashboard`
3. **Expected**: Auto-redirect to `/login`

### Scenario 4: Dashboard (Placeholder) ✅

1. Login successfully → Auto-navigate to `/dashboard`
2. View dashboard placeholder:
   - Welcome message with user name
   - User account information
   - Authentication status badge
   - Next steps list
3. Click **"Logout"** button
4. **Expected**: Redirect to `/login`

## Testing Without Backend

You can test the following features **without a running backend**:

✅ **Form Validation:**
- Required fields
- Email format validation
- Password strength indicator
- Password match validation
- Terms checkbox requirement

✅ **UI/UX:**
- Password visibility toggles
- Loading states
- Error banner (close button)
- Responsive design
- Keyboard navigation (Tab, Enter)
- Focus states

✅ **Routing:**
- Navigation between pages
- Lazy loading (check Network tab)
- Default redirects

✅ **Error Handling:**
- Displays error banner when API fails
- User-friendly error messages

## Testing With Backend

To test **full authentication flow**, you need:

1. **Start Supabase** (if using Supabase for auth):
   ```bash
   npm run supabase:start
   ```

2. **Start Backend**:
   ```bash
   npx nx serve backend
   ```
   Backend runs on: `http://localhost:3000`

3. **Start Frontend**:
   ```bash
   npx nx serve frontend
   ```
   Frontend runs on: `http://localhost:4200`

### Full Flow Test:

1. **Register**: `/register` → Create new account → API call → Redirect to `/dashboard`
2. **View Dashboard**: User data displayed from API
3. **Logout**: Clear auth state → Redirect to `/login`
4. **Login**: `/login` → Login with credentials → API call → Redirect to `/dashboard`

## Troubleshooting

### Issue: "Network error" or "Invalid credentials" after submit

**Cause**: Backend not running or API endpoint mismatch

**Solution:**
1. Check backend is running on port 3000
2. Check console for error details
3. Verify proxy config in `apps/frontend/proxy.conf.json`
4. Check API endpoint in `libs/frontend/data-access-auth/src/lib/services/auth.service.ts`

### Issue: Redirects not working

**Cause**: Guards or routing misconfigured

**Solution:**
1. Check console for guard logs
2. Verify guards are applied in `apps/frontend/src/app/app.routes.ts`
3. Check AuthStore state (use Angular DevTools)

### Issue: Form validation not working

**Cause**: Reactive Forms not set up correctly

**Solution:**
1. Check console for errors
2. Verify FormGroup setup in component
3. Check validators are applied

## Browser DevTools Tips

### Check Authentication State:
1. Open **Console**
2. Type: `ng.probe($0).componentInstance.authStore.isAuthenticated()`
3. Check if user is authenticated

### Check Signals:
1. Install **Angular DevTools** extension
2. Select component in Elements tab
3. View Signals in DevTools panel

### Check Network Requests:
1. Open **Network** tab
2. Filter by `Fetch/XHR`
3. Check API calls to `/api/auth/login` or `/api/auth/register`

## Next Steps

After testing these features, the following will be implemented:

- [ ] Onboarding Wizard (multi-step form)
- [ ] Family Members management
- [ ] Recurring Goals setup
- [ ] Schedule Generator with AI
- [ ] Weekly Calendar View
- [ ] HTTP Interceptors (Auth, Error, Cache)

---

**Last Updated**: 2026-01-12
**Version**: MVP Phase 1

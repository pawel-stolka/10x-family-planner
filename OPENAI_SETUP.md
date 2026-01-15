# OpenAI API Setup Guide

## Problem: "Invalid OpenAI API key" Error

If you're seeing the error **"Invalid OpenAI API key. Please check your configuration."**, follow these steps to diagnose and fix the issue.

## Quick Fix Checklist

### 1. ✅ Verify `.env` File Location

The `.env` file **MUST** be in the **project root**, not in any subdirectory:

```
family-planner/
├── .env                    ← HERE (same level as package.json)
├── package.json
├── apps/
├── libs/
└── ...
```

**❌ Wrong locations:**
- `apps/backend/.env` 
- `apps/frontend/.env`
- Any other subdirectory

### 2. ✅ Check `.env` File Content

Your `.env` file should contain:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
```

**Important:**
- Replace `sk-proj-xxxxxxxxxxxxxxxxxxxxx` with your **actual** OpenAI API key
- The key should start with `sk-` or `sk-proj-`
- No spaces around the `=` sign
- No quotes around the value (unless you want them included)

### 3. ✅ Verify Your OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Check if your API key is:
   - ✅ **Active** (not expired or deleted)
   - ✅ **Correctly copied** (no extra spaces or characters)
   - ✅ Has **credits/quota** available

3. If unsure, **create a new API key**:
   - Click "Create new secret key"
   - Copy it immediately (you won't see it again!)
   - Replace the old key in `.env`

### 4. ✅ Restart Backend Server

After updating `.env`, **you MUST restart** the backend:

```bash
# Stop the current backend (Ctrl+C)
# Then restart:
nx serve backend
```

**Note:** Environment variables are loaded only on server startup!

### 5. ✅ Check Backend Logs

When the backend starts, you should see:

```
🔍 OpenAI Service Configuration:
   - API Key present: true
   - API Key length: 56
   - API Key prefix: sk-proj...
   - API Key format valid: true
✅ OpenAI Service initialized
   - Model: gpt-4-turbo-preview
   - Max Tokens: 2000
   - Temperature: 0.7
```

**If you see:**
- `API Key present: false` → Key not in `.env` or server not restarted
- `API Key format valid: false` → Key doesn't start with `sk-`
- `⚠️ OPENAI_API_KEY not found` → File location issue or typo in variable name

## Common Issues

### Issue 1: `.env` File Not Found

**Symptoms:**
```
⚠️  OPENAI_API_KEY not found in environment variables
API Key present: false
```

**Solution:**
1. Verify `.env` is in project root (next to `package.json`)
2. Check file name is exactly `.env` (not `.env.txt` or `env`)
3. Restart backend server

### Issue 2: Wrong API Key Format

**Symptoms:**
```
Error code: invalid_api_key
Error status: 401
⚠️  OpenAI API keys should start with "sk-"
```

**Solution:**
1. Check your key starts with `sk-` or `sk-proj-`
2. No extra spaces or line breaks
3. Copy key directly from OpenAI dashboard
4. Create a new key if uncertain

### Issue 3: Expired or Deleted Key

**Symptoms:**
```
Error code: invalid_api_key
Error status: 401
```

**Solution:**
1. Go to https://platform.openai.com/api-keys
2. Check if key is marked as "Expired" or doesn't exist
3. Create new key and update `.env`

### Issue 4: No Credits/Quota

**Symptoms:**
```
Error code: insufficient_quota
OpenAI API quota exceeded
```

**Solution:**
1. Go to https://platform.openai.com/account/billing
2. Check your usage and billing
3. Add credits if needed
4. Free trial has limits - may need to upgrade

### Issue 5: Rate Limiting

**Symptoms:**
```
Error status: 429
OpenAI API rate limit exceeded
```

**Solution:**
- Wait a few minutes and try again
- Free tier has lower rate limits
- Consider upgrading plan for higher limits

## Testing Your Setup

### 1. Start Backend with Logs

```bash
nx serve backend
```

Look for the OpenAI configuration logs at startup.

### 2. Try Generating a Schedule

1. Open frontend: http://localhost:6400
2. Login/Register
3. Add family members and goals
4. Click "Generate Schedule"
5. Check backend terminal for detailed logs

### 3. Expected Log Output (Success)

```
🤖 Generating schedule for week starting 2026-01-15T00:00:00.000Z
📊 Context: 5 members, 3 goals
📝 Sending prompt to OpenAI...
✅ Received response from OpenAI
📊 Tokens used: 1234
✅ Successfully generated 42 time blocks
```

### 4. Expected Log Output (Error)

```
❌ Error generating schedule with OpenAI
   - Error type: Error
   - Error code: invalid_api_key
   - Error message: Incorrect API key provided
   - Error status: 401
   ⚠️  OPENAI_API_KEY is not set or is using dummy key!
```

## Step-by-Step Verification

Run these checks in order:

```bash
# 1. Check if .env exists in root
ls -la .env

# 2. Check .env content (be careful not to expose key!)
grep OPENAI_API_KEY .env
# Should show: OPENAI_API_KEY=sk-proj-...

# 3. Verify file is not ignored by git
git check-ignore .env
# Should return: .env (means it's ignored - good!)

# 4. Restart backend
nx serve backend

# 5. Watch logs during startup
# Look for "🔍 OpenAI Service Configuration:" section
```

## Example Valid `.env` File

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:6400

# Database (Supabase PostgreSQL)
DB_HOST=localhost
DB_PORT=54322
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=postgres

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_ISSUER=family-planner-api
JWT_AUDIENCE=family-planner-users
JWT_EXPIRATION=1h

# OpenAI Configuration ← IMPORTANT!
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE_NO_QUOTES
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
```

## Still Not Working?

If you've followed all steps and it's still not working:

1. **Check Backend Terminal Output**
   - Look for the detailed error logs we added
   - Copy the full error message

2. **Verify OpenAI Account Status**
   - Check if you have an active subscription
   - Verify your organization has access to GPT-4

3. **Test API Key Directly**
   - Use curl to test the key:
   
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY_HERE"
   ```
   
   - Should return list of models
   - If error, the key itself is invalid

4. **Check for Typos**
   - Variable name: `OPENAI_API_KEY` (exact spelling, all caps)
   - No extra spaces
   - No quotes (unless intentional)

5. **Try a Fresh Key**
   - Delete old key from OpenAI dashboard
   - Create completely new key
   - Update `.env` and restart

## Need Help?

If you're still stuck, provide these details:

1. Backend startup logs (OpenAI configuration section)
2. Full error message from backend terminal
3. Confirmation that `.env` is in project root
4. OpenAI account status (free trial vs paid)
5. Operating system (Windows/Mac/Linux)

---

**Remember:** Changes to `.env` require a **backend restart** to take effect! 🔄

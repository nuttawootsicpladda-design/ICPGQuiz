# 🐛 Troubleshooting Guide - SupaQuiz

## Error: 400 Bad Request when joining game

### Symptoms
- Players cannot join the game
- Error in console: `POST .../participants 400 (Bad Request)`
- Alert: "Failed to create participant"

### Causes & Solutions

#### 1. Anonymous Authentication Not Enabled ⭐ (Most Common)

**Check:**
1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Look for **Anonymous Sign-ins**

**Solution:**
1. In Supabase Dashboard: **Authentication** → **Providers**
2. Scroll down to **Anonymous Sign-ins**
3. Toggle **Enable anonymous sign-ins** to **ON**
4. Click **Save**

**Verification:**
```javascript
// Test in browser console
const { data, error } = await supabase.auth.signInAnonymously()
console.log('Anonymous auth:', data, error)
// Should show user object, not error
```

---

#### 2. RLS Policy Issue

**Check:**
Run this in SQL Editor:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'participants';

-- Check policies
SELECT * FROM pg_policies
WHERE tablename = 'participants';
```

**Solution:**
Re-run the RLS setup:
```sql
-- Drop and recreate policies
drop policy if exists "Participants can insert themselves" on public.participants;

create policy "Participants can insert themselves"
  on public.participants for insert
  with check (auth.uid() = user_id);
```

---

#### 3. Missing user_id Column

**Check:**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'participants'
ORDER BY ordinal_position;
```

**Should see:**
- `user_id` (uuid) with default `auth.uid()`

**Solution:**
Already fixed in `supabase/safe_setup.sql`

---

## Error: Cannot create quiz (Not authenticated)

### Solution
1. Make sure you're logged in (not anonymous)
2. Sign up or log in via `/auth/login`
3. Anonymous users can only join games, not create quizzes

---

## Error: Sound not playing

### Solutions

**1. Browser Autoplay Policy**
- Most browsers block autoplay until user interaction
- Click anywhere on the page first
- Sound will work after first interaction

**2. Muted**
- Check floating mute button (bottom-right corner)
- Click to unmute

**3. Browser Compatibility**
- Use Chrome, Firefox, or Edge (latest versions)
- Safari may have issues with some sound formats

---

## Error: Image upload fails

### Solutions

**1. Create Storage Bucket**
```bash
# In Supabase Dashboard:
1. Go to Storage
2. Create new bucket: "quiz-images"
3. Make it Public
4. Save
```

**2. Check Bucket Policies**
```sql
-- Allow public access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'quiz-images' );

create policy "Authenticated users can upload"
on storage.objects for insert
with check (
  bucket_id = 'quiz-images'
  AND auth.role() = 'authenticated'
);
```

---

## Error: Quiz not showing on dashboard

### Causes
1. Not logged in
2. Quiz belongs to another user
3. Quiz not saved properly

### Solution
```sql
-- Check your quizzes
SELECT id, name, user_id, created_at
FROM quiz_sets
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

If empty:
- Create a new quiz via "Create Quiz" button
- Check that you're logged in (not anonymous)

---

## Error: Failed to fetch quiz sets

### Solutions

**1. Check Supabase Connection**
```javascript
// Test in browser console
const { data, error } = await supabase.from('quiz_sets').select('*').limit(1)
console.log('Connection test:', data, error)
```

**2. Check .env.local**
```env
# Should have these values
NEXT_PUBLIC_SUPABASE_URL=https://qkqkgswwkpklftnajsug.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**3. Restart Dev Server**
```bash
# Ctrl+C to stop
npm run dev
```

---

## Error: Realtime not working

### Symptoms
- Players don't see each other join
- Host doesn't see answers in real-time
- Leaderboard doesn't update

### Solution

**1. Enable Realtime in Supabase**
```sql
alter publication supabase_realtime add table games;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table answers;
```

**2. Check Subscription**
```javascript
// In browser console (on game page)
// Should see active subscriptions
console.log('Supabase channels:', supabase.getChannels())
```

---

## Performance Issues

### Slow Database Queries

**Solution: Check Indexes**
```sql
-- List indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Should have indexes on:
- `quiz_sets(user_id)`
- `questions(quiz_set_id)`
- `participants(game_id)`
- `participants(user_id)`
- `answers(participant_id)`
- `answers(question_id)`

**Create missing indexes:**
```sql
-- Already in safe_setup.sql
create index if not exists idx_quiz_sets_user_id on quiz_sets(user_id);
-- etc...
```

---

## Build Errors

### Error: Module not found

**Solution:**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

### TypeScript Errors

**Solution: Regenerate Types**
```bash
npx supabase gen types typescript --project-id qkqkgswwkpklftnajsug --schema public > src/types/supabase.ts
```

---

## Common Setup Issues

### Issue: "Cannot find module '@/...'

**Solution:**
Check `tsconfig.json` has path mapping:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: Tailwind CSS not working

**Solution:**
Check `tailwind.config.ts`:
```typescript
content: [
  './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  './src/app/**/*.{js,ts,jsx,tsx,mdx}',
]
```

---

## Database Reset (Nuclear Option)

⚠️ **WARNING: This deletes ALL data**

```sql
-- Delete all game data (keeps quizzes)
DELETE FROM games;

-- Delete all quizzes
DELETE FROM quiz_sets;

-- Then re-run seed.sql to restore samples
```

---

## Getting Help

1. **Check Browser Console** - Most errors show here
2. **Check Supabase Logs** - Dashboard → Logs
3. **Check Network Tab** - See failed requests
4. **Enable Verbose Logging**:
   ```javascript
   // Add to src/types/types.ts
   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
     { auth: { debug: true } }
   )
   ```

---

## Quick Diagnostic Checklist

Run this SQL to check everything:

```sql
-- 1. Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check sample data exists
SELECT 'quiz_sets' as table_name, count(*) as rows FROM quiz_sets
UNION ALL
SELECT 'questions', count(*) FROM questions
UNION ALL
SELECT 'games', count(*) FROM games
UNION ALL
SELECT 'participants', count(*) FROM participants;

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Check your user
SELECT auth.uid() as my_user_id;

-- 5. Check your quizzes
SELECT id, name, user_id FROM quiz_sets
WHERE user_id = auth.uid();
```

---

## Still Having Issues?

1. **Screenshot the error**
2. **Copy error message from console**
3. **Note what you were trying to do**
4. **Check FINAL_SETUP_GUIDE.md** for setup steps

Most issues are:
- ✅ Anonymous auth not enabled
- ✅ RLS policies not set
- ✅ Missing environment variables
- ✅ Database not set up

Run `supabase/safe_setup.sql` again - it's safe!

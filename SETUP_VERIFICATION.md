# 🔍 Setup Verification Guide

This guide helps you verify that SupaQuiz is properly configured and ready to use.

## ✅ Pre-Flight Checklist

Run through this checklist to ensure everything is set up correctly:

### 1. Environment Variables

Check that `.env.local` exists and has the correct values:

```bash
# View your .env.local file
cat .env.local
```

**Should contain:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://qkqkgswwkpklftnajsug.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 2. Supabase Dashboard Configuration

#### ✅ Anonymous Authentication (CRITICAL)

**This is the most common cause of the 400 Bad Request error!**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qkqkgswwkpklftnajsug)
2. Click **Authentication** in left sidebar
3. Click **Providers** tab
4. Scroll down to **Anonymous Sign-ins**
5. Toggle **Enable anonymous sign-ins** to **ON**
6. Click **Save**

**Verification:**
Open browser console on your site and run:
```javascript
const { data, error } = await supabase.auth.signInAnonymously()
console.log('Anonymous auth test:', data, error)
// ✅ Should show user object, NOT error
```

#### ✅ Storage Bucket (For Image Upload)

1. Go to **Storage** in Supabase Dashboard
2. Check if **quiz-images** bucket exists
3. If not, create it:
   - Click **New Bucket**
   - Name: `quiz-images`
   - Public bucket: **ON**
   - Click **Save**

#### ✅ Realtime (For Live Updates)

1. Go to **Database** → **Replication** in Supabase Dashboard
2. Verify these tables are enabled:
   - ✅ `games`
   - ✅ `participants`
   - ✅ `answers`

### 3. Database Setup

Run the diagnostic SQL script below in **SQL Editor**:

```sql
-- ============================================
-- DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to verify setup
-- ============================================

-- Check 1: Verify all tables exist
SELECT 'Tables Check' as test_name,
       CASE WHEN COUNT(*) = 8 THEN '✅ PASS' ELSE '❌ FAIL' END as result,
       COUNT(*) as tables_found
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('quiz_sets', 'questions', 'choices', 'games', 'participants', 'answers', 'profiles');

-- Check 2: Verify RLS is enabled
SELECT 'RLS Check' as test_name,
       CASE WHEN COUNT(*) = 7 THEN '✅ PASS' ELSE '❌ FAIL' END as result,
       COUNT(*) as tables_with_rls
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Check 3: Verify participants table has user_id column
SELECT 'Participants user_id column' as test_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'participants' AND column_name = 'user_id'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Check 4: Verify participants RLS policy exists
SELECT 'Participants RLS Policy' as test_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM pg_policies
           WHERE tablename = 'participants'
           AND policyname = 'Participants can insert themselves'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Check 5: Verify quiz_sets has required columns
SELECT 'Quiz Sets Enhanced Columns' as test_name,
       CASE WHEN COUNT(*) = 4 THEN '✅ PASS' ELSE '❌ FAIL' END as result,
       COUNT(*) as columns_found
FROM information_schema.columns
WHERE table_name = 'quiz_sets'
AND column_name IN ('is_public', 'default_time_limit', 'default_points', 'plays_count');

-- Check 6: Verify indexes exist
SELECT 'Indexes Check' as test_name,
       CASE WHEN COUNT(*) >= 10 THEN '✅ PASS' ELSE '❌ FAIL' END as result,
       COUNT(*) as indexes_found
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';

-- Check 7: Verify functions exist
SELECT 'Functions Check' as test_name,
       CASE WHEN COUNT(*) >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END as result,
       COUNT(*) as functions_found
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('add_question', 'duplicate_quiz', 'increment_plays_count');

-- Check 8: Verify realtime is enabled
SELECT 'Realtime Check' as test_name,
       CASE WHEN COUNT(*) = 3 THEN '✅ PASS' ELSE '❌ FAIL' END as result,
       COUNT(*) as tables_in_realtime
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('games', 'participants', 'answers');

-- Summary: Count total checks passed
SELECT '====== SUMMARY ======' as summary,
       (SELECT COUNT(*) FROM (
           SELECT CASE WHEN COUNT(*) = 8 THEN 1 ELSE 0 END FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('quiz_sets', 'questions', 'choices', 'games', 'participants', 'answers', 'profiles')
           UNION ALL SELECT CASE WHEN COUNT(*) = 7 THEN 1 ELSE 0 END FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true
           UNION ALL SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'user_id') THEN 1 ELSE 0 END
           UNION ALL SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'participants' AND policyname = 'Participants can insert themselves') THEN 1 ELSE 0 END
           UNION ALL SELECT CASE WHEN COUNT(*) = 4 THEN 1 ELSE 0 END FROM information_schema.columns WHERE table_name = 'quiz_sets' AND column_name IN ('is_public', 'default_time_limit', 'default_points', 'plays_count')
           UNION ALL SELECT CASE WHEN COUNT(*) >= 10 THEN 1 ELSE 0 END FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
           UNION ALL SELECT CASE WHEN COUNT(*) >= 3 THEN 1 ELSE 0 END FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname IN ('add_question', 'duplicate_quiz', 'increment_plays_count')
           UNION ALL SELECT CASE WHEN COUNT(*) = 3 THEN 1 ELSE 0 END FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename IN ('games', 'participants', 'answers')
       ) t) || ' / 8 checks passed' as result;
```

**Expected Result:**
All checks should show **✅ PASS**. If any show **❌ FAIL**, run `supabase/safe_setup.sql` again.

---

## 🧪 Functional Testing

After configuration, test the complete flow:

### Test 1: Authentication Test

```javascript
// In browser console on http://localhost:3000
// Test 1a: Anonymous auth
const { data, error } = await supabase.auth.signInAnonymously()
console.log('Anonymous test:', error ? '❌ FAIL' : '✅ PASS', data?.user?.id)

// Test 1b: Get session
const { data: session } = await supabase.auth.getSession()
console.log('Session test:', session.session?.user ? '✅ PASS' : '❌ FAIL')
```

### Test 2: Database Connection Test

```javascript
// Test 2a: Query quiz_sets
const { data, error } = await supabase.from('quiz_sets').select('*').limit(1)
console.log('Query test:', error ? '❌ FAIL' : '✅ PASS', error?.message || 'OK')

// Test 2b: Check RLS
const { data: user } = await supabase.auth.getUser()
console.log('Current user:', user?.user?.id || 'anonymous')
```

### Test 3: Complete Game Flow

1. **Create Quiz** (as logged-in user)
   - Go to http://localhost:3000/host/dashboard/create
   - Create a quiz with 2-3 questions
   - Click "Save Quiz"
   - ✅ Should redirect to dashboard
   - ✅ Quiz should appear in list

2. **Start Game** (as host)
   - Click "Start Game" on your quiz
   - ✅ Should see lobby with game PIN
   - ✅ URL should be `/host/game/[id]`

3. **Join Game** (as player)
   - Open incognito/private window
   - Go to http://localhost:3000
   - Enter game PIN
   - Enter nickname
   - Click "Join"
   - ✅ Should NOT see 400 error in console
   - ✅ Should see "Welcome [nickname]" message
   - ✅ Host screen should show player joined

4. **Play Game**
   - Host: Click "Start Quiz"
   - Player: Answer questions
   - ✅ Host should see answers in real-time
   - ✅ Player should see correct/wrong feedback
   - ✅ Leaderboard should update

5. **View Results**
   - ✅ Final leaderboard should show correct scores
   - ✅ Host can see game analytics

---

## 🐛 Common Issues & Quick Fixes

### Issue: 400 Bad Request when joining game

**Symptoms:**
- Browser console: `POST .../participants 400 (Bad Request)`
- Alert: "Failed to create participant"

**Fix:**
1. ✅ Enable Anonymous Authentication (see above)
2. ✅ Run safe_setup.sql to ensure user_id column exists
3. ✅ Verify RLS policy allows `auth.uid() = user_id`

**Verify fix:**
```sql
-- Check participants table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'participants'
ORDER BY ordinal_position;

-- Should see user_id with default auth.uid()
```

### Issue: Quiz not saving

**Fix:**
```sql
-- Check quiz_sets RLS policies
SELECT * FROM pg_policies WHERE tablename = 'quiz_sets';

-- Should see policy: "Users can create their own quiz sets"
```

### Issue: Realtime not working

**Fix:**
```sql
-- Re-enable realtime
alter publication supabase_realtime drop table games;
alter publication supabase_realtime add table games;

alter publication supabase_realtime drop table participants;
alter publication supabase_realtime add table participants;

alter publication supabase_realtime drop table answers;
alter publication supabase_realtime add table answers;
```

### Issue: Images not uploading

**Fix:**
1. Create storage bucket "quiz-images" (see above)
2. Set bucket policies:
```sql
-- Allow public access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'quiz-images' );

-- Allow authenticated uploads
create policy "Authenticated users can upload"
on storage.objects for insert
with check (
  bucket_id = 'quiz-images'
  AND auth.role() = 'authenticated'
);
```

---

## 📊 Health Check Summary

Run this quick health check:

```sql
-- Quick health check
SELECT
    (SELECT COUNT(*) FROM quiz_sets) as total_quizzes,
    (SELECT COUNT(*) FROM questions) as total_questions,
    (SELECT COUNT(*) FROM games WHERE phase = 'lobby') as active_lobbies,
    (SELECT COUNT(*) FROM games WHERE phase = 'quiz') as games_in_progress,
    (SELECT COUNT(*) FROM participants) as total_participants_ever,
    (SELECT COUNT(DISTINCT user_id) FROM participants) as unique_players;
```

---

## ✅ Setup Complete!

If all checks pass, your SupaQuiz installation is ready! 🎉

**Next steps:**
1. Create your first quiz
2. Test the complete game flow
3. Invite players to join
4. Check analytics dashboard

**Need help?**
- See `TROUBLESHOOTING.md` for detailed error solutions
- See `FINAL_SETUP_GUIDE.md` for complete setup instructions
- Check browser console for error messages
- Check Supabase Dashboard → Logs for backend errors

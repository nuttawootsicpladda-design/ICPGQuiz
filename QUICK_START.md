# 🚀 Quick Start Guide - SupaQuiz

Get your Kahoot alternative up and running in 5 minutes!

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account (free tier is fine)
- Project ID: `qkqkgswwkpklftnajsug`

---

## ⚡ 3-Step Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Supabase

Your `.env.local` is already configured with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://qkqkgswwkpklftnajsug.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Important:** Enable Anonymous Authentication in Supabase:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qkqkgswwkpklftnajsug/auth/providers)
2. Click **Authentication** → **Providers**
3. Find **Anonymous Sign-ins**
4. Toggle **ON**
5. Click **Save**

### Step 3: Setup Database

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/qkqkgswwkpklftnajsug/sql)
2. Click **New Query**
3. Copy and paste the entire contents of `supabase/safe_setup.sql`
4. Click **Run**
5. Wait for "✅ Database setup completed successfully!" message

---

## 🎮 Start the App

```bash
npm run dev
```

Open http://localhost:3000

---

## ✅ Verify Setup

Visit http://localhost:3000/diagnostics to run automated checks.

**All checks should be green (✅)**

Common issues:
- ❌ Anonymous Authentication → Enable in Supabase Dashboard
- ❌ Database tables → Run `safe_setup.sql`
- ❌ Environment variables → Check `.env.local` exists

---

## 🎯 Your First Game

### 1. Create an Account
- Click **Login** → **Don't have an account? Register**
- Sign up with email/password
- You'll be redirected to the dashboard

### 2. Create a Quiz
- Click **Create Quiz** button
- Add quiz details (name, description, optional image)
- Add questions (minimum 2)
  - Question text
  - 4 answer choices (mark correct ones)
  - Optional: Set time limit (default 20s)
  - Optional: Set points (default 1000)
- Click **Save Quiz**

### 3. Start a Game
- On dashboard, find your quiz
- Click **Start Game**
- You'll see the lobby with a **Game PIN**
- Share the PIN with players

### 4. Players Join
- Players go to http://localhost:3000
- Enter the game PIN
- Enter their nickname
- Click **Join**
- They'll appear on your lobby screen

### 5. Play!
- Click **Start Quiz** when ready
- Questions appear for everyone
- Players answer on their devices
- See real-time answers on host screen
- Leaderboard updates after each question
- Final results at the end

---

## 📱 Access Points

| Role | URL | Purpose |
|------|-----|---------|
| **Home** | http://localhost:3000 | Players enter game PIN |
| **Login** | http://localhost:3000/auth/login | Host login |
| **Register** | http://localhost:3000/auth/register | Create account |
| **Dashboard** | http://localhost:3000/host/dashboard | Manage quizzes |
| **Create Quiz** | http://localhost:3000/host/dashboard/create | Build new quiz |
| **Analytics** | http://localhost:3000/host/dashboard/analytics | View quiz stats |
| **Diagnostics** | http://localhost:3000/diagnostics | System health check |

---

## 🎨 Features Available

### ✅ Core Features
- ✅ Real-time multiplayer gameplay
- ✅ Speed-based scoring (faster = more points)
- ✅ Multiple choice questions
- ✅ Live leaderboard
- ✅ Anonymous player authentication
- ✅ Host authentication (email/password)
- ✅ Quiz creator with visual editor
- ✅ Question time limits (customizable)
- ✅ Points system (customizable per question)
- ✅ Answer reveal with correct/wrong feedback
- ✅ Color-coded answer buttons (Kahoot style)
- ✅ Game PIN system for joining

### ✅ Advanced Features
- ✅ Edit existing quizzes
- ✅ Duplicate quizzes
- ✅ Delete quizzes
- ✅ Image upload for quizzes and questions
- ✅ Quiz analytics and statistics
- ✅ Question performance metrics
- ✅ Player history tracking
- ✅ Public/Private quizzes
- ✅ Quiz play counter
- ✅ User profiles
- ✅ Sound effects (join, correct, wrong, countdown)
- ✅ Background music
- ✅ Mute toggle (persisted)

---

## 🎵 Sound System

Sounds are included and work automatically:

- **Join Sound** - When a player joins the lobby
- **Countdown** - Timer ticking in last 5 seconds
- **Correct** - Player answered correctly
- **Wrong** - Player answered incorrectly
- **Background Music** - Plays in lobby

**Controls:**
- Floating mute button (bottom-right corner)
- Preference saved in browser localStorage
- First click on page required (browser autoplay policy)

---

## 🖼️ Image Upload

Upload images for quizzes and questions:

**Setup Required:**
1. Go to [Supabase Storage](https://supabase.com/dashboard/project/qkqkgswwkpklftnajsug/storage/buckets)
2. Create bucket: `quiz-images`
3. Make it **Public**
4. Click **Save**

**Usage:**
- Drag and drop images
- Or click to browse
- Preview before saving
- Supports: JPG, PNG, GIF, WebP

---

## 🔧 Troubleshooting

### Error: 400 Bad Request when joining game

**Cause:** Anonymous Authentication not enabled

**Fix:**
1. Supabase Dashboard → Authentication → Providers
2. Enable "Anonymous Sign-ins"
3. Save changes

**Verify:**
```javascript
// In browser console
const { data, error } = await supabase.auth.signInAnonymously()
console.log(error ? '❌ Not enabled' : '✅ Working')
```

### Error: Quiz not saving

**Cause:** Not logged in or RLS policy issue

**Fix:**
1. Make sure you're logged in (not anonymous)
2. Re-run `supabase/safe_setup.sql`

### Error: Images not uploading

**Cause:** Storage bucket not created

**Fix:**
1. Create `quiz-images` bucket in Supabase Storage
2. Make it public
3. See "Image Upload" section above

### More Help

- 📚 See `TROUBLESHOOTING.md` for detailed solutions
- 🔍 Visit `/diagnostics` page for automated checks
- 📖 See `FEATURES_COMPLETE.md` for full feature list
- 🛠️ See `SETUP_VERIFICATION.md` for manual verification steps

---

## 🎓 Tips & Best Practices

### For Hosts

1. **Test your quiz** before playing with others
   - Preview questions
   - Check time limits
   - Verify correct answers

2. **Set appropriate time limits**
   - Easy questions: 15-20 seconds
   - Medium questions: 20-30 seconds
   - Hard questions: 30-45 seconds

3. **Use images** to make questions more engaging
   - Upload relevant images
   - Keep file sizes reasonable (<2MB)

4. **Review analytics** after games
   - See which questions were too easy/hard
   - Check player engagement
   - Adjust for next time

### For Players

1. **Join early** to ensure you're in the lobby before start
2. **Choose a unique nickname** (duplicates allowed but confusing)
3. **Watch the timer** - faster answers = more points
4. **Have fun!** 🎉

---

## 📊 Scoring System

Points are calculated based on speed:

```
Base Points: 1000 (or custom per question)
Time Penalty: (time_taken / time_limit) * 500
Final Score: base_points - time_penalty

Example:
- Question worth 1000 points, 20 second limit
- Answer in 5 seconds: 1000 - (5/20 * 500) = 875 points
- Answer in 10 seconds: 1000 - (10/20 * 500) = 750 points
- Answer in 20 seconds: 1000 - (20/20 * 500) = 500 points
- Wrong answer: 0 points
```

---

## 🚀 What's Next?

After basic setup:

1. ✅ Run diagnostics at `/diagnostics`
2. ✅ Create your first quiz
3. ✅ Test a complete game flow
4. ✅ Explore analytics
5. ✅ Upload custom images
6. ✅ Try sound effects
7. ✅ Customize quiz settings

---

## 📞 Getting Help

**Check these in order:**

1. Visit `/diagnostics` - Automated health check
2. Check `TROUBLESHOOTING.md` - Common issues
3. Check browser console - Error messages
4. Check Supabase Logs - Backend errors
5. Verify Anonymous Auth - Most common issue

**Most Common Fix:**
Enable Anonymous Authentication in Supabase Dashboard! This solves 90% of issues.

---

## ✅ Checklist

Before your first game:

- [ ] `npm install` completed
- [ ] `.env.local` exists with credentials
- [ ] Anonymous Auth enabled in Supabase
- [ ] `safe_setup.sql` executed successfully
- [ ] `npm run dev` running without errors
- [ ] `/diagnostics` shows all green checks
- [ ] Created test quiz
- [ ] Tested joining as player (incognito window)
- [ ] Verified real-time updates work
- [ ] Sound effects working (after first click)

---

## 🎉 You're Ready!

Everything is set up and ready to go. Create your first quiz and have fun!

**Quick Test:**
1. Start dev server: `npm run dev`
2. Visit: http://localhost:3000/diagnostics
3. All green? You're good to go! 🚀
4. Any red? Check the error message and fix

Enjoy your Kahoot alternative! 🎮

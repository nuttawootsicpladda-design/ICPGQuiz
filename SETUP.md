# SupaQuiz - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account (https://supabase.com)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Supabase

#### Option A: Using Supabase Cloud (Recommended)

1. **Create a Supabase Project**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Note your Project URL and Anon Key

2. **Configure Environment Variables**
   - Your `.env.local` is already configured with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://qkqkgswwkpklftnajsug.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Run Database Migrations**
   - Open your Supabase Dashboard
   - Go to SQL Editor
   - Copy the entire content from `supabase/complete_setup.sql`
   - Paste and run it
   - ✅ This creates all tables, functions, RLS policies, and indexes

4. **Add Sample Data (Optional)**
   - In SQL Editor, copy content from `supabase/seed.sql`
   - Paste and run it
   - ✅ This adds 6 sample quiz sets in different languages

#### Option B: Using Supabase CLI

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref qkqkgswwkpklftnajsug

# Push database schema
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --project-id qkqkgswwkpklftnajsug --schema public > src/types/supabase.ts
```

### Step 3: Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

---

## 🎯 Features Included

### ✅ Complete Authentication System
- Email/Password registration and login
- User profiles
- Anonymous auth for guest players
- Protected routes

### ✅ Quiz Creator/Editor
- Visual quiz builder
- Add/edit/delete questions
- 4 multiple-choice answers per question
- Set time limits (5-60 seconds)
- Set points (100-5000)
- Drag and drop question ordering
- Image support (ready for Supabase Storage integration)

### ✅ Quiz Management Dashboard
- My Quizzes view (Grid/List)
- Create new quiz
- Edit existing quiz
- Duplicate quiz
- Delete quiz
- Start game directly

### ✅ Live Game System
- Host lobby with QR code
- Real-time player joining
- Live quiz gameplay
- Speed-based scoring
- Results leaderboard with confetti

### ✅ Analytics Dashboard
- Total quizzes, plays, and players
- Average scores
- Per-quiz performance metrics
- Question-level analytics (% correct)

### ✅ Enhanced UI/UX
- Beautiful gradient designs
- Responsive layouts
- Smooth transitions
- Modern card-based interface
- Color-coded answer buttons

---

## 📁 Project Structure

```
kahoot-alternative-main/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── auth/
│   │   │   ├── login/page.tsx          # Login page
│   │   │   └── register/page.tsx       # Registration page
│   │   ├── profile/page.tsx            # User profile
│   │   ├── host/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx            # My Quizzes
│   │   │       ├── create/page.tsx     # Quiz Creator
│   │   │       ├── edit/[id]/         # Quiz Editor (TBD)
│   │   │       └── analytics/page.tsx  # Analytics Dashboard
│   │   └── game/[id]/                  # Player game pages
│   ├── components/
│   │   └── Navbar.tsx                  # Navigation bar
│   ├── contexts/
│   │   └── AuthContext.tsx             # Authentication context
│   └── types/
│       ├── types.ts                    # Type definitions
│       └── supabase.ts                 # Generated DB types
├── supabase/
│   ├── complete_setup.sql              # All-in-one database setup
│   ├── seed.sql                        # Sample quiz data
│   └── migrations/                     # Original migrations
└── public/                             # Static assets
```

---

## 🎮 How to Use

### For Hosts (Teachers/Creators)

1. **Sign Up**
   - Go to http://localhost:3000
   - Click "Get Started Free"
   - Create your account

2. **Create a Quiz**
   - Click "Create Quiz" from dashboard
   - Enter quiz name and description
   - Add questions with 4 answer choices
   - Set time limits and points
   - Save quiz

3. **Start a Game**
   - Go to "My Quizzes"
   - Click "Play" on any quiz
   - Share QR code or game ID with players
   - Click "Start Game" when ready
   - Control question progression
   - View results at the end

4. **View Analytics**
   - Go to "Analytics" from sidebar
   - See overall statistics
   - View per-quiz performance
   - Check question difficulty

### For Players

1. **Join a Game**
   - Go to http://localhost:3000/game/{gameId}
   - Or scan QR code from host
   - Enter your nickname
   - Wait in lobby

2. **Play**
   - Answer questions quickly
   - Faster = more points
   - See your rank on leaderboard

---

## 🗄️ Database Schema

### Main Tables
- `quiz_sets` - Quiz collections
- `questions` - Questions in quizzes
- `choices` - Answer choices
- `games` - Active game sessions
- `participants` - Players in games
- `answers` - Player answers
- `profiles` - User profiles

### Views
- `game_results` - Leaderboard data
- `quiz_analytics` - Quiz performance metrics
- `question_analytics` - Question difficulty stats

### Functions
- `add_question()` - Add question with choices
- `duplicate_quiz()` - Copy entire quiz
- `increment_plays_count()` - Track game plays

---

## 🔒 Security (RLS Policies)

- Users can only manage their own quizzes
- Public quizzes are viewable by everyone
- Players can only submit their own answers
- Hosts can only control their own games
- All data access is secured by Row Level Security

---

## 🎨 Customization Options

### Time Limits
- Per-question: 5-60 seconds
- Default: 20 seconds

### Points
- Per-question: 100-5000 points
- Default: 1000 points
- Speed bonus: Score decreases with time

### Visibility
- Public quizzes: Anyone can play
- Private quizzes: Owner only

---

## 🐛 Troubleshooting

### "Failed to fetch quiz sets"
- Check `.env.local` credentials
- Verify database migrations ran successfully
- Check Supabase project is active

### "Failed to start game"
- Ensure you're logged in (not anonymous)
- Check quiz has questions
- Verify RLS policies are set up

### Types not matching
- Regenerate types: `npx supabase gen types typescript --project-id {your-id} > src/types/supabase.ts`

---

## 📚 Additional Resources

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs

---

## 🤝 Contributing

This is an open-source Kahoot alternative built with:
- **Next.js 14** - React framework
- **Supabase** - Backend & Database
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

---

## 📝 License

MIT License - feel free to use and modify!

---

## 🎉 You're All Set!

Your SupaQuiz platform is ready to use. Create amazing quizzes and engage your audience!

For support or questions, check the GitHub repository issues.

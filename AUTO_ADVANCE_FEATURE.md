# ⏱️ Auto-Advance Feature Documentation

## Overview

Quiz creators can now set a countdown timer to automatically advance to the next question after the answer is revealed! This eliminates the need to manually click "Next" and creates a smoother game flow.

## Features

### ✅ What's Included

- **Adjustable Timer** - Set countdown from 0-30 seconds
- **Manual Mode** - Set to 0 for traditional manual control
- **Visual Countdown** - Shows remaining time in real-time
- **Skip Option** - Can skip countdown and go to next immediately
- **Auto-Advance** - Automatically moves to next question when timer reaches 0

## How It Works

### For Quiz Creators

When creating a quiz, you can set the auto-advance time:

1. **Go to Create Quiz** (`/host/dashboard/create`)
2. **Find "Auto-Advance Timer"** section
3. **Adjust the slider**:
   - Drag left/right to set time (0-30 seconds)
   - See live preview of selected time
4. **Choose your preference**:
   - **0 seconds** = Manual mode (click Next to continue)
   - **1-30 seconds** = Auto-advance after X seconds

### During Gameplay

When hosting a game:

1. **Question Time** ⏰
   - Players answer the question
   - Timer counts down as normal

2. **Answer Revealed** ✅
   - Correct answer is shown
   - Statistics displayed
   - **Auto-advance countdown starts** (if enabled)

3. **Countdown Display** ⏱️
   - Purple badge shows remaining time
   - Example: "⏱️ 5s"
   - Updates every second

4. **Two Options**:
   - **Wait** - Countdown reaches 0, auto-advances
   - **Skip** - Click "Skip ⏭️" button to go immediately

5. **Next Question** ➡️
   - Automatically loads next question
   - Countdown resets for next round

## Setup Instructions

### 1. Run Database Migration

**Option A: Just auto-advance feature**
```sql
-- Copy and run: supabase/add_auto_advance.sql
```

**Option B: Complete setup (includes everything)**
```sql
-- Copy and run: supabase/safe_setup.sql
```

To run SQL:
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/qkqkgswwkpklftnajsug/sql)
2. Click **New Query**
3. Paste the SQL code
4. Click **Run**

### 2. Verify Installation

```sql
-- Check if auto_advance_time column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'quiz_sets'
AND column_name = 'auto_advance_time';

-- Should return one row showing:
-- column_name: auto_advance_time
-- data_type: smallint
-- column_default: 5
```

### 3. Test the Feature

1. Start dev server: `npm run dev`
2. Create new quiz
3. See "Auto-Advance Timer" slider
4. Adjust to desired time (e.g., 5 seconds)
5. Save quiz and start game
6. After answer reveal, countdown appears
7. Wait 5 seconds OR click Skip
8. Automatically advances to next question!

## Configuration Options

### Timer Values

| Value | Behavior | Use Case |
|-------|----------|----------|
| **0 seconds** | Manual mode | Full control, self-paced |
| **1-3 seconds** | Quick advance | Fast-paced games |
| **4-6 seconds** | Moderate | Balanced gameplay |
| **7-10 seconds** | Comfortable | Review answers |
| **11-30 seconds** | Extended | Discussion time |

### Recommended Settings

**🎮 Fast Game (Competitive)**
- Auto-advance: **3-5 seconds**
- Time per question: **10-15 seconds**
- Points: **1000**

**📚 Educational (Learning)**
- Auto-advance: **8-10 seconds**
- Time per question: **20-30 seconds**
- Points: **500-1000**

**👥 Presentation/Discussion**
- Auto-advance: **15-20 seconds** or **Manual (0)**
- Time per question: **30-60 seconds**
- Points: **500**

**🎉 Fun/Casual**
- Auto-advance: **5-7 seconds**
- Time per question: **15-20 seconds**
- Points: **1000**

## User Interface

### Quiz Creator UI

```
┌────────────────────────────────────────┐
│ Auto-Advance Timer ⏱️                  │
│                                        │
│ [────●──────────────────] 5s          │
│  0                           30        │
│                                        │
│ ✨ Auto-advance to next question       │
│    after 5 seconds                     │
└────────────────────────────────────────┘
```

### Game Screen UI

**When countdown active:**
```
┌────────────────────────────────────────┐
│                     ⏱️ 5s   [Skip ⏭️] │
│                                        │
│        [Question and Stats]            │
│                                        │
└────────────────────────────────────────┘
```

**Manual mode (0 seconds):**
```
┌────────────────────────────────────────┐
│                           [Next ➡️]    │
│                                        │
│        [Question and Stats]            │
│                                        │
└────────────────────────────────────────┘
```

## Technical Details

### Database Schema

```sql
-- quiz_sets table
ALTER TABLE quiz_sets
ADD COLUMN auto_advance_time smallint DEFAULT 5;

-- Values:
-- 0 = Manual mode (no auto-advance)
-- 1-30 = Auto-advance after X seconds
```

### Implementation

**1. Quiz Creator**
```typescript
const [autoAdvanceTime, setAutoAdvanceTime] = useState(5)

// Save to database
await supabase.from('quiz_sets').insert({
  // ... other fields
  auto_advance_time: autoAdvanceTime,
})
```

**2. Host Game Screen**
```typescript
const [countdown, setCountdown] = useState<number | null>(null)

// Start countdown when answer revealed
const onTimeUp = async () => {
  setIsAnswerRevealed(true)

  const autoAdvanceTime = quizSet.auto_advance_time || 0
  if (autoAdvanceTime > 0) {
    setCountdown(autoAdvanceTime)
  }
}

// Countdown effect
useEffect(() => {
  if (countdown > 0) {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          getNextQuestion() // Auto-advance!
          return null
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }
}, [countdown])
```

**3. Skip Functionality**
```typescript
<button onClick={() => {
  clearInterval(countdownInterval)
  setCountdown(null)
  getNextQuestion()
}}>
  {countdown > 0 ? 'Skip ⏭️' : 'Next ➡️'}
</button>
```

### Files Modified

**New Files:**
- `supabase/add_auto_advance.sql` - Database migration

**Modified Files:**
- `src/app/host/dashboard/create/page.tsx` - Added timer slider
- `src/app/host/game/[id]/quiz.tsx` - Added countdown logic
- `supabase/safe_setup.sql` - Includes auto_advance_time column

## Best Practices

### 1. Match Timer to Content

- **Quick facts**: 3-5 seconds
- **Complex questions**: 8-10 seconds
- **Discussion prompts**: Manual or 15+ seconds

### 2. Consider Audience

- **Kids**: Shorter timer (5-7s) keeps attention
- **Adults**: Longer timer (7-10s) for analysis
- **Mixed**: Moderate timer (5-7s)

### 3. Game Pacing

**Fast-paced:**
- Short auto-advance (3-5s)
- Short question time (10-15s)
- Keep energy high!

**Slow-paced:**
- Longer auto-advance (8-10s)
- Longer question time (25-30s)
- Allow discussion

**Custom:**
- Use manual mode (0s)
- Advance when YOU decide
- Best for presentations

### 4. Testing

Always test your quiz before live gameplay:
1. Create quiz with timer
2. Play through solo
3. Check if timing feels right
4. Adjust if needed

## Troubleshooting

### Countdown not appearing
**Cause:** auto_advance_time set to 0 (manual mode)
**Fix:** Edit quiz and increase timer value

### Countdown too fast/slow
**Cause:** Timer value not suitable for content
**Fix:** Edit quiz and adjust timer value

### Can't skip countdown
**Cause:** UI issue or button not visible
**Fix:** Check that button appears when answer revealed

### Auto-advance not working
**Cause:** Database column missing
**Fix:** Run `add_auto_advance.sql` migration

**Verify:**
```sql
SELECT auto_advance_time FROM quiz_sets;
-- Should return values (0-30)
```

## Examples

### Example 1: Quick Trivia Game

**Settings:**
- Auto-advance: **3 seconds**
- Question time: **10 seconds**
- Questions: 10-15

**Result:**
- Fast-paced, exciting
- Total time: ~2-3 minutes
- High energy!

### Example 2: Learning Module

**Settings:**
- Auto-advance: **10 seconds**
- Question time: **30 seconds**
- Questions: 5-10

**Result:**
- Educational, thoughtful
- Total time: ~5-7 minutes
- Time to learn!

### Example 3: Team Presentation

**Settings:**
- Auto-advance: **Manual (0)**
- Question time: **60 seconds**
- Questions: 5-8

**Result:**
- Discussion-friendly
- Host-controlled pacing
- Interactive presentation!

## Future Enhancements

Potential improvements:
- [ ] Different timers per question
- [ ] Sound effect for countdown
- [ ] Visual progress bar
- [ ] Pause/resume countdown
- [ ] Extend time mid-countdown
- [ ] Custom countdown animations
- [ ] Warning at 3, 2, 1 seconds

## Comparison: Manual vs Auto-Advance

| Feature | Manual (0s) | Auto-Advance (1-30s) |
|---------|-------------|----------------------|
| **Control** | Full | Automated |
| **Pacing** | Variable | Consistent |
| **Host attention** | Required | Reduced |
| **Flow** | Can pause | Keeps moving |
| **Best for** | Presentations | Games |
| **Flexibility** | High | Medium |
| **Energy** | Variable | High |

## Tips for Hosts

### Using Auto-Advance

1. **Test first** - Play through once to check timing
2. **Communicate** - Tell players about auto-advance
3. **Use Skip** - Don't wait if everyone answered
4. **Adjust next time** - Note if timer too fast/slow

### Using Manual Mode

1. **Watch chat** - See when discussion finished
2. **Check understanding** - Ensure everyone got it
3. **Control pace** - Speed up or slow down as needed
4. **Stay engaged** - Remember to click Next!

## Questions?

See:
- `TROUBLESHOOTING.md` - General troubleshooting
- `QUICK_START.md` - Setup guide
- `FEATURES_COMPLETE.md` - All features list

Enjoy smoother game flow with auto-advance! ⏱️✨

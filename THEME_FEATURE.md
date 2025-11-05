# 🎨 Theme Feature Documentation

## Overview

Quiz creators can now choose from 12 beautiful themes to customize the look and feel of their quizzes! Each theme provides unique color schemes, backgrounds, and button styles.

## Features

### ✅ What's Included

- **12 Unique Themes** - Classic, Ocean, Forest, Sunset, Space, Neon, Candy, Dark, Rainbow, Fire, Ice, Nature
- **Theme Picker** - Easy-to-use dropdown with visual previews
- **Custom Color Schemes** - Each theme has its own:
  - Lobby background gradient
  - Game background
  - Results background
  - Answer button colors (4 unique colors per theme)
  - UI accent colors
- **Applied Throughout** - Theme colors appear in:
  - ✅ Host lobby
  - ✅ Game question screens
  - ✅ Answer buttons (4 colors matching theme)
  - ✅ Results/leaderboard
  - ✅ Player screens

## Available Themes

### 1. 🎮 Classic (Default)
- **Style**: Traditional Kahoot look
- **Colors**: Purple, Pink, Red, Blue, Yellow, Green
- **Best for**: Standard quizzes, education

### 2. 🌊 Ocean
- **Style**: Deep sea vibes
- **Colors**: Blue, Cyan, Teal, Sky
- **Best for**: Science, marine biology, relaxing themes

### 3. 🌳 Forest
- **Style**: Natural and fresh
- **Colors**: Green, Emerald, Lime, Teal
- **Best for**: Nature, environment, wellness

### 4. 🌅 Sunset
- **Style**: Warm and vibrant
- **Colors**: Orange, Red, Yellow, Pink
- **Best for**: Creative, energetic, warm topics

### 5. 🚀 Space
- **Style**: Cosmic adventure
- **Colors**: Indigo, Purple, Pink, Violet
- **Best for**: Astronomy, sci-fi, futuristic themes

### 6. ⚡ Neon
- **Style**: Electric and bright
- **Colors**: Fuchsia, Cyan, Yellow, Green (with glow effects)
- **Best for**: Modern, tech, gaming

### 7. 🍭 Candy
- **Style**: Sweet and colorful
- **Colors**: Pink, Purple, Yellow, Rose
- **Best for**: Kids, fun topics, celebrations

### 8. 🌙 Dark
- **Style**: Sleek and modern
- **Colors**: Grayscale tones
- **Best for**: Professional, serious topics, accessibility

### 9. 🌈 Rainbow
- **Style**: All the colors!
- **Colors**: Red, Blue, Yellow, Green (vibrant)
- **Best for**: Celebrations, diversity, fun

### 10. 🔥 Fire
- **Style**: Hot and intense
- **Colors**: Red, Orange, Yellow, Amber
- **Best for**: Energy, passion, competitive games

### 11. ❄️ Ice
- **Style**: Cool and fresh
- **Colors**: Cyan, Blue, Sky, Indigo
- **Best for**: Winter, calm topics, professional

### 12. 🍂 Nature
- **Style**: Earth tones
- **Colors**: Amber, Green, Yellow, Emerald
- **Best for**: Nature, autumn, organic themes

## Setup Instructions

### 1. Run Database Migration

**If you already have the database set up:**
```sql
-- Run just the theme migration
-- Copy and paste: supabase/add_theme_support.sql
```

**OR if setting up from scratch:**
```sql
-- Run the complete safe_setup.sql (includes theme support)
-- Copy and paste: supabase/safe_setup.sql
```

To run SQL:
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/qkqkgswwkpklftnajsug/sql)
2. Click **New Query**
3. Paste the SQL code
4. Click **Run**

### 2. Verify Installation

```sql
-- Check if theme_id column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'quiz_sets'
AND column_name = 'theme_id';

-- Should return one row showing theme_id column with default 'classic'
```

### 3. Test the Feature

1. Start dev server: `npm run dev`
2. Go to Create Quiz page
3. You should see Theme picker in Quiz Details
4. Select different themes and see preview
5. Create quiz and start game
6. Theme colors appear throughout the game!

## Usage

### For Quiz Creators

1. **Create New Quiz**
   - Go to `/host/dashboard/create`
   - Enter quiz name and description

2. **Choose Theme**
   - Click on Theme selector
   - Browse 12 themes with visual previews
   - See color swatches for each theme
   - Click to select your favorite

3. **Save Quiz**
   - Theme is saved with the quiz
   - Will be applied automatically when game starts

### For Players

- Themes are applied automatically
- Players see themed:
  - Lobby background
  - Answer button colors
  - Results screen
- Consistent experience across all screens

### For Hosts

Themes appear in:
- **Lobby Screen**: Custom gradient background
- **Question Screen**: Themed answer buttons
- **Results Screen**: Themed leaderboard background

## Technical Details

### Database Schema

```sql
-- quiz_sets table
CREATE TABLE quiz_sets (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  theme_id text DEFAULT 'classic',  -- NEW COLUMN
  user_id uuid REFERENCES auth.users(id),
  -- ... other columns
);
```

### Theme Data Structure

```typescript
interface QuizTheme {
  id: string              // Unique identifier
  name: string            // Display name
  description: string     // Short description
  preview: string         // Emoji preview

  // Backgrounds
  lobbyBg: string         // Lobby gradient
  gameBg: string          // Game background
  resultsBg: string       // Results background

  // Answer colors (4 choices)
  answerColors: {
    color1: string        // First choice color
    color2: string        // Second choice color
    color3: string        // Third choice color
    color4: string        // Fourth choice color
  }

  // UI colors
  primaryColor: string
  secondaryColor: string
  accentColor: string
  textColor: string
  cardBg: string
  cardBorder: string
}
```

### Files Created/Modified

**New Files:**
- `src/utils/themes.ts` - Theme data (12 themes) and helper functions
- `src/components/ThemePicker.tsx` - Theme selector component
- `supabase/add_theme_support.sql` - Database migration

**Modified Files:**
- `src/app/host/dashboard/create/page.tsx` - Added theme picker
- `src/app/host/game/[id]/page.tsx` - Pass quizSet to child components
- `src/app/host/game/[id]/lobby.tsx` - Apply lobby theme
- `src/app/host/game/[id]/quiz.tsx` - Apply game theme & button colors
- `src/app/host/game/[id]/results.tsx` - Apply results theme
- `supabase/safe_setup.sql` - Includes theme migration

## How Themes Are Applied

### 1. Quiz Creation
```typescript
// User selects theme
const [themeId, setThemeId] = useState('classic')

// Saved to database
await supabase.from('quiz_sets').insert({
  name: quizName,
  theme_id: themeId,  // Stored here
  // ...
})
```

### 2. Game Start
```typescript
// Load quiz with theme
const quizSet = await supabase
  .from('quiz_sets')
  .select('*, theme_id')  // Include theme_id
  .eq('id', quizSetId)

// Get theme object
const theme = getThemeById(quizSet.theme_id)
```

### 3. Screen Rendering
```typescript
// Apply theme classes
<div className={`${theme.lobbyBg}`}>  {/* Lobby */}
<div className={`${theme.gameBg}`}>   {/* Game */}

// Answer buttons use theme colors
{choices.map((choice, index) => (
  <button className={getAnswerButtonClass(index, themeId)}>
    {choice.body}
  </button>
))}
```

## Customization

### Adding a New Theme

Edit `src/utils/themes.ts`:

```typescript
export const QUIZ_THEMES: QuizTheme[] = [
  // ... existing themes
  {
    id: 'mytheme',
    name: 'My Theme',
    description: 'My custom theme',
    preview: '✨',

    lobbyBg: 'bg-gradient-to-br from-purple-600 to-blue-500',
    gameBg: 'bg-gradient-to-b from-gray-900 to-black',
    resultsBg: 'bg-black',

    answerColors: {
      color1: 'bg-purple-500 hover:bg-purple-600',
      color2: 'bg-blue-500 hover:bg-blue-600',
      color3: 'bg-pink-500 hover:bg-pink-600',
      color4: 'bg-indigo-500 hover:bg-indigo-600',
    },

    primaryColor: 'bg-purple-600',
    secondaryColor: 'bg-blue-500',
    accentColor: 'bg-pink-400',
    textColor: 'text-white',
    cardBg: 'bg-white',
    cardBorder: 'border-purple-400',
  },
]
```

### Modifying Existing Theme

Find the theme in `QUIZ_THEMES` array and edit its properties:

```typescript
{
  id: 'ocean',
  // Change any property
  lobbyBg: 'bg-gradient-to-br from-teal-600 to-cyan-500', // New gradient
  answerColors: {
    color1: 'bg-teal-500 hover:bg-teal-600',  // New color
    // ...
  }
}
```

### Changing Default Theme

In migration file or manually:
```sql
-- Change default theme for new quizzes
ALTER TABLE quiz_sets
ALTER COLUMN theme_id SET DEFAULT 'ocean';  -- Change 'ocean' to any theme ID
```

## Best Practices

### Theme Selection Tips

1. **Match Topic**: Choose themes that complement your quiz topic
   - Science quiz? → Ocean or Space
   - Kids quiz? → Candy or Rainbow
   - Professional? → Dark or Classic

2. **Consider Audience**:
   - Young children → Bright, colorful (Candy, Rainbow)
   - Adults → Sophisticated (Dark, Classic, Nature)
   - Mixed → Versatile (Ocean, Forest, Fire)

3. **Accessibility**:
   - Ensure good contrast for readability
   - Dark theme for light-sensitive users
   - Ice/Ocean for color-blind friendly options

### Performance

- **No Performance Impact**: All themes use CSS classes (no images)
- **Instant Loading**: Themes are pure Tailwind CSS
- **Lightweight**: +15KB for theme data
- **SEO Friendly**: No dynamic imports

## Troubleshooting

### Theme picker not showing
**Cause**: Database migration not run
**Fix**: Run `supabase/add_theme_support.sql`

### Theme not applying to game
**Cause**: quizSet not passed to components
**Fix**: Ensure components receive quizSet prop

### Wrong colors showing
**Cause**: Old quiz created before themes
**Fix**:
```sql
-- Update existing quizzes to use default theme
UPDATE quiz_sets
SET theme_id = 'classic'
WHERE theme_id IS NULL;
```

### Button colors not matching theme
**Cause**: TypeScript type mismatch or old code
**Fix**: Verify using `getAnswerButtonClass()` function

## Examples

### Creating a Themed Quiz Flow

```typescript
// 1. User creates quiz
quizName: "Ocean Trivia"
theme: "ocean" 🌊

// 2. Game starts
lobby → Blue/Cyan gradient background

// 3. Question appears
game → Deep blue background
buttons → Cyan, Blue, Teal, Sky colors

// 4. Results shown
results → Dark blue/cyan gradient
confetti → Cyan colors
```

### Theme Comparison

| Feature | Classic | Neon | Dark |
|---------|---------|------|------|
| Vibe | Traditional | Electric | Professional |
| Colors | Bold primary | Bright neon | Grayscale |
| Best For | Education | Gaming | Business |
| Accessibility | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

## Future Enhancements

Potential improvements:
- [ ] Custom theme creator
- [ ] Theme preview in dashboard
- [ ] Animated theme transitions
- [ ] Sound themes (matching audio to visuals)
- [ ] Seasonal themes (Halloween, Christmas, etc.)
- [ ] User-uploaded background images
- [ ] Theme marketplace

## Questions?

See:
- `TROUBLESHOOTING.md` - General troubleshooting
- `QUICK_START.md` - Setup guide
- `FEATURES_COMPLETE.md` - All features list
- `AVATAR_FEATURE.md` - Avatar system docs

Have fun customizing your quizzes! 🎨✨

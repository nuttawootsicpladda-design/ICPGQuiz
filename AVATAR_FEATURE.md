# 🎨 Avatar Feature Documentation

## Overview

Players can now select fun avatars when joining a game! This feature adds visual personality to your quiz sessions and makes the game more engaging.

## Features

### ✅ What's Included

- **44 Different Avatars** - Animals, fantasy creatures, objects, food, sports, and nature themes
- **Avatar Picker** - Easy-to-use dropdown with visual selection
- **Random Default** - Each player gets a random avatar pre-selected
- **Visual Display** - Avatars appear throughout the game:
  - ✅ Host lobby (when players join)
  - ✅ Leaderboard (final results)
  - ✅ All participant lists

## Available Avatars

### Animals (12)
🐱 Cat | 🐶 Dog | 🐻 Bear | 🐼 Panda | 🦁 Lion | 🐯 Tiger | 🦊 Fox | 🐨 Koala | 🐵 Monkey | 🐷 Pig | 🐸 Frog | 🐰 Rabbit

### Sea Creatures (4)
🐙 Octopus | 🐠 Fish | 🐬 Dolphin | 🦈 Shark

### Birds (4)
🐔 Chicken | 🐧 Penguin | 🦉 Owl | 🦅 Eagle

### Fantasy & Fun (4)
🦄 Unicorn | 🐉 Dragon | 👽 Alien | 🤖 Robot

### Objects (6)
🚀 Rocket | ⭐ Star | 🔥 Fire | ⚡ Lightning | 🌈 Rainbow | 👑 Crown

### Food (4)
🍕 Pizza | 🍩 Donut | 🍦 Ice Cream | 🎂 Cake

### Sports (4)
⚽ Soccer | 🏀 Basketball | 🏆 Trophy | 🏅 Medal

### Nature (4)
🌳 Tree | 🌸 Flower | ☀️ Sun | 🌙 Moon

## Setup Instructions

### 1. Run Database Migration

**Option A: If you haven't set up the database yet**
```sql
-- Run the complete safe_setup.sql (includes avatar support)
-- Copy and paste: supabase/safe_setup.sql
```

**Option B: If you already have the database set up**
```sql
-- Run just the avatar migration
-- Copy and paste: supabase/add_avatar_support.sql
```

To run SQL:
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/qkqkgswwkpklftnajsug/sql)
2. Click **New Query**
3. Paste the SQL code
4. Click **Run**

### 2. Verify Installation

After running the migration, verify it worked:

```sql
-- Check if avatar_id column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'participants'
AND column_name = 'avatar_id';

-- Should return one row showing avatar_id column
```

### 3. Test the Feature

1. Start your dev server: `npm run dev`
2. Create a game as host
3. Join as a player (incognito window)
4. You should see:
   - Avatar picker on join screen
   - Random avatar pre-selected
   - Ability to click and choose different avatar
   - Avatar displayed in host lobby
   - Avatar shown in final leaderboard

## Usage

### For Players

1. **Join a Game**
   - Go to game URL or scan QR code
   - See avatar picker with random selection

2. **Choose Avatar**
   - Click on the avatar display
   - Browse 44 different avatars
   - Click your favorite to select
   - Selected avatar is highlighted with blue ring

3. **Enter Nickname**
   - Type your nickname (max 20 characters)
   - Click "Join Game"

4. **See Your Avatar**
   - Avatar appears next to your name in lobby
   - Avatar shows on leaderboard at the end
   - Top 3 players get larger avatars with medals!

### For Hosts

Avatars are displayed automatically:
- **In Lobby**: See each player's avatar when they join
- **In Results**: Leaderboard shows avatars next to names
- **Top 3 Special**: First place 🥇, second 🥈, third 🥉 with bigger avatars

## Technical Details

### Database Schema

```sql
-- participants table
CREATE TABLE participants (
  id uuid PRIMARY KEY,
  nickname text NOT NULL,
  game_id uuid REFERENCES games(id),
  user_id uuid REFERENCES auth.users(id),
  avatar_id text DEFAULT 'cat',  -- NEW COLUMN
  created_at timestamp
);
```

### Avatar Data Structure

```typescript
interface Avatar {
  id: string        // Unique identifier
  emoji: string     // Emoji character
  name: string      // Display name
  bgColor: string   // Tailwind background color class
  borderColor: string // Tailwind border color class
}
```

### Files Modified

**New Files:**
- `src/utils/avatars.ts` - Avatar data and helper functions
- `src/components/AvatarPicker.tsx` - Avatar selector component
- `supabase/add_avatar_support.sql` - Database migration

**Modified Files:**
- `src/app/game/[id]/lobby.tsx` - Added avatar picker to join form
- `src/app/host/game/[id]/lobby.tsx` - Display avatars in lobby
- `src/app/host/game/[id]/results.tsx` - Display avatars in leaderboard
- `supabase/safe_setup.sql` - Includes avatar column migration

## Customization

### Adding More Avatars

Edit `src/utils/avatars.ts` and add to the `AVATARS` array:

```typescript
export const AVATARS: Avatar[] = [
  // ... existing avatars
  {
    id: 'your-avatar-id',
    emoji: '🎯',  // Your emoji
    name: 'Target',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-400'
  },
]
```

### Changing Default Avatar

In `supabase/add_avatar_support.sql`, change the default:

```sql
ALTER TABLE public.participants
ADD COLUMN avatar_id text DEFAULT 'unicorn';  -- Change 'cat' to any avatar ID
```

### Customizing Colors

Each avatar has background and border colors. You can customize these in `src/utils/avatars.ts`:

```typescript
{
  id: 'cat',
  emoji: '🐱',
  name: 'Cat',
  bgColor: 'bg-purple-100',      // Change background
  borderColor: 'border-purple-500' // Change border
}
```

Available Tailwind colors:
- `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`
- Shades: `100` (lightest background), `400`, `500`, `600` (border/accent)

### Avatar Sizes

The `AvatarDisplay` component supports different sizes:

```typescript
<AvatarDisplay
  avatarId="cat"
  size="sm"  // sm | md | lg | xl
/>
```

- `sm`: 32px (8rem) - Used in lobby player list
- `md`: 48px (12rem) - Default size
- `lg`: 64px (16rem) - Used for top 3 in leaderboard
- `xl`: 96px (24rem) - Extra large

## Troubleshooting

### Avatar picker not showing
**Cause:** Database migration not run
**Fix:** Run `supabase/add_avatar_support.sql` or `supabase/safe_setup.sql`

### Avatars showing as default emoji only
**Cause:** `avatar_id` column doesn't exist in database
**Fix:**
```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'participants' AND column_name = 'avatar_id';

-- If empty, run migration
-- supabase/add_avatar_support.sql
```

### Error when joining game
**Cause:** TypeScript type mismatch
**Fix:** The code uses `(participant as any).avatar_id` to handle optional field
**Better fix:** Regenerate Supabase types after migration:
```bash
npx supabase gen types typescript --project-id qkqkgswwkpklftnajsug > src/types/supabase.ts
```

### Avatars not showing in leaderboard
**Cause:** Participants data not fetched
**Fix:** The results component now fetches participants separately. Check browser console for errors.

## Performance

- **Avatar Count**: 44 avatars (lightweight, emoji-based)
- **Load Time**: Instant (no image downloads)
- **Database Impact**: +1 text column per participant (~10 bytes)
- **UI Performance**: No performance impact (CSS rendered)

## Accessibility

- ✅ Keyboard navigable avatar picker
- ✅ Clear visual selection (blue ring highlight)
- ✅ Semantic HTML labels
- ✅ Screen reader friendly (emoji with names)

## Future Enhancements

Potential improvements:
- [ ] Custom avatar upload
- [ ] Avatar unlocking/achievements
- [ ] Animated avatars
- [ ] Avatar categories/filters
- [ ] Favorite avatars saved to profile
- [ ] Team avatars (matching themes)

## Questions?

See:
- `TROUBLESHOOTING.md` - General troubleshooting
- `QUICK_START.md` - Setup guide
- `FEATURES_COMPLETE.md` - All features list

Enjoy your new avatars! 🎉

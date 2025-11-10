# 👥⚔️ Teams Mode Feature

ฟีเจอร์ Teams Mode ให้ผู้เล่นแบ่งทีมและแข่งขันกันแบบทีม vs ทีม สนุกและเพิ่ม engagement มากขึ้น!

---

## ✨ ฟีเจอร์

### 🎯 **Core Features**
- ✅ แบ่งทีม 2-4 ทีม (Red Dragons 🐉, Blue Sharks 🦈, Green Ninjas 🥷, Yellow Lightning ⚡)
- ✅ ผู้เล่นเลือกทีมเอง หรือ Auto-assign แบบสมดุล
- ✅ คะแนนรวมทีม Real-time
- ✅ Team Leaderboard แสดงอันดับทีม
- ✅ Team badges และ indicators
- ✅ Individual scores ยังนับอยู่ (dual scoring)

### 🎨 **Team Customization**
แต่ละทีมมี:
- **ชื่อทีม** (Red Dragons, Blue Sharks, etc.)
- **สี** เฉพาะทีม
- **Emoji** ประจำทีม
- **Description** สั้นๆ

---

## 📦 สิ่งที่สร้างเสร็จแล้ว

### 1. **Database Schema** (`supabase/add_teams_mode.sql`)
```sql
-- เพิ่มคอลัมน์ใน games table
games.team_mode      BOOLEAN DEFAULT FALSE
games.max_teams      SMALLINT (2-4)

-- เพิ่มคอลัมน์ใน participants table
participants.team_id VARCHAR(20) ('red', 'blue', 'green', 'yellow')

-- Views ใหม่
team_results         -- คะแนนทีม real-time
team_leaderboard     -- อันดับทีม
team_members         -- สมาชิกแต่ละทีม

-- Functions
get_team_info()      -- ข้อมูลทีม (name, color, emoji)
auto_assign_team()   -- จัดทีมอัตโนมัติแบบสมดุล
```

### 2. **Utilities** (`src/utils/teams.ts`)
```typescript
interface Team {
  id: string
  name: string
  color: string
  bgColor: string
  borderColor: string
  emoji: string
  description: string
}

// Helper functions
getTeam(teamId)
getTeamsByCount(count)
getTeamColor(teamId)
getTeamName(teamId)
getTeamEmoji(teamId)
```

### 3. **Components**

#### **TeamSelector** (`src/components/TeamSelector.tsx`)
- เลือกทีม
- แสดงจำนวนสมาชิกแต่ละทีม Real-time
- Auto-update เมื่อมีคนเข้าร่วม

#### **TeamBadge** (`src/components/TeamBadge.tsx`)
- Badge แสดงทีม
- รองรับ 3 sizes (sm, md, lg)
- แสดงชื่อหรือแค่ emoji

#### **TeamLeaderboard** (`src/components/TeamLeaderboard.tsx`)
- แสดงอันดับทีม
- คะแนนรวม, Accuracy, Correct answers
- Real-time updates
- แสดงทีมที่ชนะเด่นขึ้น

---

## 🚀 การติดตั้ง

### ขั้นตอนที่ 1: รัน SQL Migration

1. เปิด Supabase Dashboard
2. ไปที่ SQL Editor
3. เปิดไฟล์: `supabase/add_teams_mode.sql`
4. Copy & Run

หรือ:
```bash
# ใน Supabase CLI
supabase db push
```

### ขั้นตอนที่ 2: Verify Tables

ตรวจสอบว่า migration สำเร็จ:

```sql
-- ตรวจสอบ columns ใหม่
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('games', 'participants')
  AND column_name IN ('team_mode', 'max_teams', 'team_id');

-- ตรวจสอบ views
SELECT viewname FROM pg_views
WHERE viewname IN ('team_results', 'team_leaderboard', 'team_members');
```

---

## 💻 Integration Guide

### 1. **เปิด Team Mode ในหน้า Create Game**

แก้ไข `src/app/host/game/[id]/page.tsx` (Host game page):

```typescript
// เพิ่ม state
const [teamMode, setTeamMode] = useState(false)
const [maxTeams, setMaxTeams] = useState<2 | 3 | 4>(2)

// เมื่อสร้างเกม
const { data: game, error } = await supabase
  .from('games')
  .insert({
    quiz_set_id: quizSetId,
    host_user_id: user.id,
    team_mode: teamMode,       // ← เพิ่ม
    max_teams: maxTeams,        // ← เพิ่ม
  })
  .select()
  .single()
```

### 2. **Player Lobby - เลือกทีม**

แก้ไข `src/app/game/[id]/lobby.tsx`:

```typescript
import TeamSelector from '@/components/TeamSelector'
import { useState, useEffect } from 'react'

function Register({ gameId, onRegisterCompleted }) {
  const [nickname, setNickname] = useState('')
  const [avatarId, setAvatarId] = useState('cat')
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [gameInfo, setGameInfo] = useState<any>(null)

  // โหลดข้อมูลเกม (team_mode, max_teams)
  useEffect(() => {
    const loadGameInfo = async () => {
      const { data } = await supabase
        .from('games')
        .select('team_mode, max_teams')
        .eq('id', gameId)
        .single()

      setGameInfo(data)
    }
    loadGameInfo()
  }, [gameId])

  const onFormSubmit = async (e) => {
    e.preventDefault()
    // ... existing code ...

    // Insert participant with team_id
    const { data: participant, error } = await supabase
      .from('participants')
      .insert({
        nickname,
        game_id: gameId,
        user_id: userId,
        avatar_id: avatarId,
        team_id: gameInfo?.team_mode ? selectedTeam : null, // ← เพิ่ม
      })
      .select()
      .single()

    // ... rest of code ...
  }

  return (
    <form onSubmit={onFormSubmit}>
      {/* Existing avatar and nickname fields */}

      {/* Team Selector (แสดงเฉพาะ Team Mode) */}
      {gameInfo?.team_mode && (
        <div className="mb-4">
          <TeamSelector
            gameId={gameId}
            maxTeams={gameInfo.max_teams}
            selectedTeam={selectedTeam}
            onTeamSelected={setSelectedTeam}
          />
        </div>
      )}

      {/* Submit button */}
    </form>
  )
}
```

### 3. **Host Lobby - แสดงทีม**

แก้ไข `src/app/host/game/[id]/lobby.tsx`:

```typescript
import TeamBadge from '@/components/TeamBadge'

export default function Lobby({ participants, gameId, quizSet }) {
  // Group participants by team
  const participantsByTeam = participants.reduce((acc, p) => {
    const team = p.team_id || 'no-team'
    if (!acc[team]) acc[team] = []
    acc[team].push(p)
    return acc
  }, {} as Record<string, typeof participants>)

  return (
    <div>
      {/* Team Mode Display */}
      {quizSet.team_mode && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {Object.entries(participantsByTeam).map(([teamId, members]) => (
            <div key={teamId} className="bg-white rounded-lg p-4">
              <TeamBadge teamId={teamId} size="lg" />
              <div className="mt-2 space-y-2">
                {members.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <AvatarDisplay avatarId={p.avatar_id} size="sm" />
                    <span>{p.nickname}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regular participant list for solo mode */}
    </div>
  )
}
```

### 4. **แสดง Team Leaderboard**

แก้ไข `src/app/host/game/[id]/quiz.tsx` (Host Quiz view):

```typescript
import TeamLeaderboard from '@/components/TeamLeaderboard'

export default function HostQuiz({ game, currentQuestion, questionCount }) {
  return (
    <div>
      {/* Existing quiz display */}

      {/* Team Leaderboard (แสดงตอนเฉลยคำตอบ) */}
      {game.team_mode && game.is_answer_revealed && (
        <div className="absolute right-4 top-4 w-96">
          <TeamLeaderboard
            gameId={game.id}
            currentQuestionIndex={game.current_question_sequence}
            totalQuestions={questionCount}
          />
        </div>
      )}
    </div>
  )
}
```

### 5. **Results Page - แสดงทีมชนะ**

แก้ไข `src/app/game/[id]/page.tsx` (Results component):

```typescript
import TeamLeaderboard from '@/components/TeamLeaderboard'
import TeamBadge from '@/components/TeamBadge'

function Results({ participant }) {
  const [gameInfo, setGameInfo] = useState<any>(null)

  useEffect(() => {
    const loadGameInfo = async () => {
      const { data } = await supabase
        .from('games')
        .select('team_mode, max_teams')
        .eq('id', participant.game_id)
        .single()

      setGameInfo(data)
    }
    loadGameInfo()
  }, [participant.game_id])

  return (
    <div>
      {gameInfo?.team_mode ? (
        // Team Mode Results
        <div>
          <h1 className="text-3xl font-bold mb-4">Team Battle Results!</h1>

          {/* Your Team */}
          <div className="bg-white p-6 rounded-lg mb-6">
            <p className="text-lg mb-2">Your Team:</p>
            <TeamBadge teamId={participant.team_id} size="lg" />
            <p className="mt-4">Your Contribution: <span className="font-bold">{myScore} points</span></p>
          </div>

          {/* Team Leaderboard */}
          <TeamLeaderboard gameId={participant.game_id} />
        </div>
      ) : (
        // Solo Mode Results (existing)
        <div>
          {/* Existing individual leaderboard */}
        </div>
      )}
    </div>
  )
}
```

---

## 🎮 วิธีใช้งาน (สำหรับผู้ใช้)

### สำหรับ Host (ผู้สร้างควิซ):

1. **สร้างเกมแบบ Team Mode:**
   - สร้างควิซตามปกติ
   - ในหน้าเริ่มเกม เลือก "Enable Team Mode"
   - เลือกจำนวนทีม (2, 3, หรือ 4 ทีม)
   - เริ่มเกม

2. **ระหว่างเกม:**
   - เห็นผู้เล่นแบ่งตามทีม
   - ดู Team Leaderboard real-time
   - เห็นการแข่งขันระหว่างทีม

### สำหรับ Player (ผู้เล่น):

1. **เข้าร่วมเกม:**
   - Scan QR Code
   - ใส่ Nickname + เลือก Avatar
   - **เลือกทีม** ที่ต้องการ
   - รอคนอื่นในทีมเข้าร่วม

2. **ระหว่างเล่น:**
   - ตอบคำถามเพื่อให้คะแนนทีม
   - เห็นคะแนนรวมทีม
   - แข่งกับทีมอื่น

3. **หลังจบ:**
   - เห็นทีมไหนชนะ
   - คะแนนที่ตัวเองทำให้ทีม
   - อันดับทีม

---

## 🎨 Customization

### เปลี่ยนชื่อทีม/สี/emoji

แก้ไข `src/utils/teams.ts`:

```typescript
export const TEAMS: Record<string, Team> = {
  red: {
    id: 'red',
    name: 'ทีมแดง',         // ← เปลี่ยนชื่อ
    color: '#EF4444',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500',
    emoji: '🔴',            // ← เปลี่ยน emoji
    description: 'แรงและกล้า'
  },
  // ... teams อื่นๆ
}
```

### เพิ่มทีมใหม่ (5+ ทีม)

1. เพิ่มใน `teams.ts`:
```typescript
purple: {
  id: 'purple',
  name: 'Purple Wizards',
  color: '#9333EA',
  bgColor: 'bg-purple-600',
  borderColor: 'border-purple-600',
  emoji: '🧙',
  description: 'Magical and mysterious'
}
```

2. อัพเดท constraint ใน SQL:
```sql
ALTER TABLE participants
DROP CONSTRAINT check_team_id;

ALTER TABLE participants
ADD CONSTRAINT check_team_id
CHECK (team_id IS NULL OR team_id IN ('red', 'blue', 'green', 'yellow', 'purple'));
```

---

## 📊 Team Scoring Logic

### คะแนนรวมทีม:
```
Total Team Score = Σ (Individual scores of all team members)
```

### Accuracy:
```
Team Accuracy = (Correct Answers / Total Answers) × 100%
```

### Ranking:
```
Teams ranked by: total_team_score DESC
```

---

## 🔧 Advanced Features

### Auto-assign ทีมอัตโนมัติ

```typescript
// ใช้ function auto_assign_team()
const { data: assignedTeam } = await supabase
  .rpc('auto_assign_team', {
    game_id_param: gameId
  })

// Update participant
await supabase
  .from('participants')
  .update({ team_id: assignedTeam })
  .eq('id', participantId)
```

### Team Chat แยก

เพิ่มคอลัมน์ `team_id` ใน `chat_messages`:

```sql
ALTER TABLE chat_messages
ADD COLUMN team_id VARCHAR(20);

-- Policy: เห็นได้เฉพาะทีมเดียวกัน
CREATE POLICY "Team members see team chat" ON chat_messages
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM participants WHERE id = auth.uid()
    )
  );
```

### Team Power-ups

แต่ละทีมมี power-up พิเศษ:
- Red: +10% damage
- Blue: See hints
- Green: Extra time
- Yellow: Speed boost

---

## 🎯 Use Cases

1. **Classroom:**
   - แบ่งกลุ่มนักเรียน
   - แข่งขันกันระหว่างกลุ่ม
   - เพิ่มการทำงานร่วมกัน

2. **Corporate Training:**
   - Team building
   - แข่งขันระหว่างแผนก
   - สร้าง engagement

3. **Events:**
   - Quiz competition
   - Family game night
   - Party games

---

## 🐛 Troubleshooting

### ❌ Team Selector ไม่แสดง
**สาเหตุ:** `game.team_mode = false`

**แก้ไข:**
```sql
UPDATE games SET team_mode = true, max_teams = 4 WHERE id = 'your-game-id';
```

### ⚠️ Team scores ไม่อัพเดท
**สาเหตุ:** Realtime subscriptions ไม่เชื่อมต่อ

**แก้ไข:**
```typescript
// ตรวจสอบ realtime channel
const channel = supabase.channel('team-scores')
console.log('Channel status:', channel.state)
```

### 🔒 RLS Policy blocking
**สาเหตุ:** ผู้เล่นไม่มีสิทธิ์เข้าถึง views

**แก้ไข:**
```sql
-- Grant access to views
GRANT SELECT ON team_results TO anon, authenticated;
GRANT SELECT ON team_leaderboard TO anon, authenticated;
```

---

## 📈 Future Enhancements

Ideas สำหรับพัฒนาต่อ:

- [ ] **Team Captain** - หัวหน้าทีมที่มีสิทธิ์พิเศษ
- [ ] **Team Challenges** - คำถามพิเศษสำหรับทีม
- [ ] **Team Power-ups** - ความสามารถพิเศษแต่ละทีม
- [ ] **Team Avatar** - อวาตาร์ประจำทีม custom ได้
- [ ] **Team Stats History** - สถิติทีมย้อนหลัง
- [ ] **Team Tournaments** - ระบบแข่งขันทีม
- [ ] **Team Achievements** - รางวัลประจำทีม
- [ ] **Voice Chat** - แชทเสียงในทีม

---

## 🎉 Summary

Teams Mode เพิ่ม:
- ✅ ความสนุก → แข่งขันเป็นทีม
- ✅ Engagement → ทำงานร่วมกัน
- ✅ Social → เจอเพื่อนใหม่
- ✅ Replayability → อยากเล่นอีก

**พร้อมใช้งานแล้ว!** 🚀

---

**Made with ❤️ for teamwork and fun!**

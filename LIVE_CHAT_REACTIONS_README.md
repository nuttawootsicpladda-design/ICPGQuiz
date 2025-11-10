# 💬🎉 Live Chat & Reactions

ฟีเจอร์ Live Chat และ Emoji Reactions แบบ Real-time สำหรับเพิ่มความสนุกและการมีส่วนร่วมในเกม!

---

## ✨ ฟีเจอร์

### 💬 **Live Chat**
- แชทแบบ Real-time ระหว่างรอในห้อง Lobby
- ข้อความแสดงทันทีทุกคนที่อยู่ในเกม
- แสดง Avatar และ Nickname ของผู้ส่ง
- Scroll อัตโนมัติเมื่อมีข้อความใหม่
- จำกัดข้อความ 200 ตัวอักษร

### 🎊 **Live Reactions**
- ส่ง Emoji reactions แบบ Real-time
- 8 emoji พร้อมใช้งาน: ❤️ 😂 😮 😢 🔥 👍 👏 🎉
- แอนิเมชั่นลอยขึ้นสวยงาม (5 วินาที)
- ใช้ได้ทั้งในห้อง Lobby และขณะเล่นควิซ
- ทุกคนเห็น reactions พร้อมกัน

---

## 📋 การติดตั้ง

### 1. รัน SQL Migration

เปิด Supabase Dashboard และรัน SQL file:

```bash
supabase/add_chat_and_reactions.sql
```

หรือคัดลอก SQL ไปรันใน Supabase SQL Editor:

**สร้างตาราง:**
- `chat_messages` - เก็บข้อความแชท
- `reactions` - เก็บ emoji reactions

**ตั้งค่า RLS (Row Level Security):**
- เฉพาะผู้เล่นในเกมเดียวกันเท่านั้นที่เห็นแชทและ reactions
- ป้องกันการเข้าถึงข้อมูลจากเกมอื่น

### 2. Components ที่ถูกสร้าง

ไฟล์ component ถูกสร้างอัตโนมัติแล้ว:

```
src/components/
├── LiveChat.tsx         # Chat component
└── LiveReactions.tsx    # Reactions component
```

### 3. Integration (ทำเสร็จแล้ว)

Components ถูก integrate เข้ากับหน้าต่างๆ แล้ว:

- ✅ **Player Lobby** (`src/app/game/[id]/lobby.tsx`)
  - แสดง Live Chat เมื่อผู้เล่นลงทะเบียนแล้ว
  - มีปุ่ม Reactions แบบลอย

- ✅ **Quiz Phase** (`src/app/game/[id]/quiz.tsx`)
  - มีปุ่ม Reactions ขณะเล่นควิซ
  - ส่ง reactions เมื่อตอบคำถามได้/ผิด

---

## 🎮 วิธีการใช้งาน

### สำหรับผู้เล่น (Player):

#### 1. **ใช้ Live Chat ใน Lobby:**

1. เข้าเกม และลงทะเบียน (ใส่ nickname)
2. หน้า Lobby จะแสดง Chat box ทางด้านขวา
3. พิมพ์ข้อความในช่อง "Type a message..."
4. กด "Send" หรือกด Enter
5. ข้อความจะปรากฏทันทีให้ทุกคนเห็น

**Tips:**
- ข้อความเก่าจะถูกโหลดมาแสดงด้วย (100 ข้อความล่าสุด)
- สีฟ้า = ข้อความของคนอื่น
- สีม่วง = ข้อความของคุณ

#### 2. **ส่ง Reactions:**

**ในหน้า Lobby:**
1. คลิกปุ่มลอย (มุมขวาล่าง) 😊
2. เลือก emoji ที่ต้องการ
3. Emoji จะลอยขึ้นบนหน้าจอทุกคน!

**ขณะเล่นควิซ:**
1. เหมือนกัน - คลิกปุ่มลอยมุมขวาล่าง
2. ส่ง reactions ได้ตลอดเวลา
3. ใช้แสดงความรู้สึก (ดีใจ, เสียใจ, ตื่นเต้น)

---

## 🏗️ สถาปัตยกรรม

### Database Schema:

```sql
-- Chat Messages
chat_messages
├── id (UUID, Primary Key)
├── game_id (UUID, Foreign Key -> games)
├── participant_id (UUID, Foreign Key -> participants)
├── message (TEXT)
└── created_at (TIMESTAMP)

-- Reactions
reactions
├── id (UUID, Primary Key)
├── game_id (UUID, Foreign Key -> games)
├── participant_id (UUID, Foreign Key -> participants)
├── emoji (VARCHAR)
└── created_at (TIMESTAMP)
```

### Real-time Flow:

```
Player 1 sends message
      ↓
INSERT into chat_messages
      ↓
Supabase Real-time Broadcast
      ↓
All connected players receive update
      ↓
Messages appear instantly
```

---

## 🎨 Customization

### เปลี่ยน Emoji ที่ใช้ได้:

แก้ไขไฟล์ `src/components/LiveReactions.tsx`:

```typescript
const EMOJI_OPTIONS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  // เพิ่ม/ลบ emoji ได้ตามต้องการ
  { emoji: '🎯', label: 'Bullseye' },
]
```

### ปรับเวลาแอนิเมชั่น Reactions:

แก้ไขไฟล์เดียวกัน:

```typescript
// บรรทัด 48 - เปลี่ยนจาก 5000 (5 วินาที) เป็นค่าอื่น
setTimeout(() => {
  setFloatingReactions(prev =>
    prev.filter(r => r.id !== newReaction.id)
  )
}, 5000) // ⬅️ แก้ตรงนี้
```

### ปรับความยาวข้อความสูงสุด:

แก้ไข `src/components/LiveChat.tsx`:

```tsx
<input
  type="text"
  maxLength={200}  // ⬅️ แก้ตรงนี้ (ค่าปัจจุบัน: 200)
  ...
/>
```

---

## 🔧 Advanced Features

### Auto-delete Old Reactions (ทำความสะอาดอัตโนมัติ):

ฟังก์ชัน SQL สำหรับลบ reactions ที่เก่ากว่า 10 วินาที:

```sql
SELECT cleanup_old_reactions();
```

คุณสามารถเรียกใช้ฟังก์ชันนี้ใน cron job หรือ edge function:

```typescript
// Supabase Edge Function
setInterval(async () => {
  await supabase.rpc('cleanup_old_reactions')
}, 60000) // ทุก 1 นาที
```

### จำกัดจำนวนข้อความต่อผู้เล่น (Rate Limiting):

เพิ่ม logic ใน `LiveChat.tsx`:

```typescript
const [lastMessageTime, setLastMessageTime] = useState(0)

const handleSendMessage = async (e) => {
  e.preventDefault()

  // Rate limit: 1 message per 2 seconds
  const now = Date.now()
  if (now - lastMessageTime < 2000) {
    alert('Please wait before sending another message')
    return
  }

  // ... existing code ...
  setLastMessageTime(now)
}
```

---

## 📊 Analytics Ideas

คุณสามารถเพิ่มการวิเคราะห์:

1. **Most Used Emoji:**
```sql
SELECT emoji, COUNT(*) as usage_count
FROM reactions
GROUP BY emoji
ORDER BY usage_count DESC
LIMIT 5;
```

2. **Most Active Chatters:**
```sql
SELECT p.nickname, COUNT(cm.id) as message_count
FROM chat_messages cm
JOIN participants p ON cm.participant_id = p.id
GROUP BY p.nickname
ORDER BY message_count DESC
LIMIT 10;
```

3. **Chat Activity Timeline:**
```sql
SELECT DATE_TRUNC('minute', created_at) as minute,
       COUNT(*) as messages
FROM chat_messages
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY minute
ORDER BY minute;
```

---

## 🔒 Security & Privacy

### ความปลอดภัยที่มีอยู่:

✅ **Row-Level Security (RLS):**
- เฉพาะผู้เล่นในเกมเดียวกันเท่านั้นที่เห็นแชท
- ป้องกัน SQL injection ด้วย Supabase RLS

✅ **Input Validation:**
- จำกัดความยาวข้อความ (200 ตัวอักษร)
- Sanitize input ก่อนแสดงผล

✅ **Authentication:**
- ต้อง login (anonymous) ก่อนใช้งาน
- ทุก action ผูกกับ participant_id

### เพิ่มความปลอดภัย:

#### 1. **Content Moderation (กรองคำหยาบ):**

```typescript
const BAD_WORDS = ['xxx', 'yyy', 'zzz']

const moderateMessage = (text: string): string => {
  let moderated = text
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi')
    moderated = moderated.replace(regex, '***')
  })
  return moderated
}

// ใช้ใน handleSendMessage:
const moderatedMessage = moderateMessage(newMessage.trim())
```

#### 2. **Report System:**

เพิ่มปุ่ม "Report" ข้างข้อความ:

```sql
CREATE TABLE message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id),
  reported_by UUID REFERENCES participants(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Use Cases

### 1. **Education (การศึกษา):**
- นักเรียนแชทระหว่างรอเริ่มควิซ
- ครูดูการมีส่วนร่วมของนักเรียน
- ส่ง reactions เมื่อตอบถูก (กำลังใจ)

### 2. **Corporate Training:**
- พนักงานทักทายกันก่อนเริ่มทดสอบ
- Ice-breaking activity
- Team building ผ่าน reactions

### 3. **Events & Competitions:**
- ผู้เข้าร่วมแชทระหว่างรอเริ่ม
- ส่ง reactions ให้ผู้เล่นที่ตอบเก่ง
- สร้าง engagement สูง

---

## 🐛 Troubleshooting

### ❌ แชทไม่แสดง
**สาเหตุ:**
1. ยังไม่รัน SQL migration
2. RLS policies ไม่ถูกต้อง
3. Network connection ปัญหา

**วิธีแก้:**
```sql
-- ตรวจสอบว่าตารางมีหรือไม่
SELECT * FROM chat_messages LIMIT 1;

-- ตรวจสอบ RLS policies
SELECT * FROM pg_policies WHERE tablename = 'chat_messages';
```

### ⚠️ Reactions ไม่ลอยขึ้น
**สาเหตุ:**
1. CSS animations ไม่โหลด
2. z-index ต่ำเกินไป

**วิธีแก้:**
- ตรวจสอบ console errors
- ตรวจสอบ `<style jsx>` ใน LiveReactions.tsx

### 🐌 Real-time ช้า
**สาเหตุ:**
- Supabase real-time connections limit
- Network latency

**วิธีแก้:**
- Upgrade Supabase plan (free tier จำกัด connections)
- ใช้ polling fallback สำหรับ free users

---

## 🚀 Future Enhancements

Ideas สำหรับพัฒนาต่อ:

- [ ] **Typing Indicators** - แสดง "... is typing"
- [ ] **Message Threads** - ตอบกลับข้อความเฉพาะ
- [ ] **DMs (Direct Messages)** - ส่งข้อความส่วนตัว
- [ ] **Stickers** - รูปภาพแทนแค่ emoji
- [ ] **GIF Support** - ส่ง GIF จาก Giphy
- [ ] **Voice Messages** - บันทึกเสียงส่ง
- [ ] **Message Reactions** - react emoji บนข้อความ
- [ ] **User Mentions** - @username
- [ ] **Rich Text** - bold, italic, links
- [ ] **Message History** - ดูข้อความเก่าทั้งหมด

---

## 📝 License

Same as main project.

---

**Made with ❤️ using Supabase Realtime**

Enjoy your new Live Chat & Reactions feature! 🎉

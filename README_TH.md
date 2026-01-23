# ICPG Quiz - แพลตฟอร์มควิซเกมแบบ Kahoot

แพลตฟอร์มสร้างควิซและเกมตอบคำถามแบบเรียลไทม์ เป็นทางเลือกแทน Kahoot ที่สามารถโฮสต์เองได้

## สารบัญ

- [ภาพรวมโปรเจกต์](#ภาพรวมโปรเจกต์)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [ฟีเจอร์หลัก](#ฟีเจอร์หลัก)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [การติดตั้งและใช้งาน](#การติดตั้งและใช้งาน)
- [การ Deploy](#การ-deploy)
- [ฐานข้อมูล](#ฐานข้อมูล)

---

## ภาพรวมโปรเจกต์

**ICPG Quiz** เป็นแพลตฟอร์มเกมตอบคำถามแบบโต้ตอบ (Interactive Quiz Game Platform) ที่พัฒนาขึ้นเพื่อเป็นทางเลือกแทน Kahoot โดยมีความสามารถหลักดังนี้:

- สร้างควิซพร้อมคำถามแบบเลือกตอบ
- จัดเกมแบบ Live Multiplayer ที่ผู้เล่นสามารถเข้าร่วมแบบเรียลไทม์
- รองรับ AI สร้างคำถามอัตโนมัติจากหัวข้อ/เนื้อหา/URL/PDF/PowerPoint
- มีธีมสีให้เลือกใช้มากกว่า 15 แบบ
- รองรับโหมดทีมและ Leaderboard แบบเรียลไทม์

---

## เทคโนโลยีที่ใช้

### Frontend
| เทคโนโลยี | เวอร์ชัน | คำอธิบาย |
|-----------|---------|----------|
| Next.js | 14.2.35 | React Framework with App Router |
| TypeScript | 5 | Type-safe JavaScript |
| Tailwind CSS | 3.3.0 | Utility-first CSS Framework |
| React | 18 | UI Library |

### Backend & Services
| เทคโนโลยี | คำอธิบาย |
|-----------|----------|
| Supabase | Backend as a Service (PostgreSQL, Auth, Realtime) |
| OpenRouter API | AI สำหรับสร้างคำถามอัตโนมัติ (Gemini Flash 2.5) |

### Libraries สำคัญ
```
@supabase/supabase-js  - Supabase Client
next-qrcode            - สร้าง QR Code สำหรับเข้าเกม
react-confetti         - เอฟเฟกต์ฉลองชัยชนะ
react-countdown-circle-timer - Timer แบบวงกลม
html2canvas            - Export ผลลัพธ์เป็นรูปภาพ
```

---

## ฟีเจอร์หลัก

### 1. การสร้างควิซ
- สร้างคำถามแบบ Multiple Choice (2-4 ตัวเลือก)
- อัพโหลดรูปภาพประกอบคำถาม
- กำหนดเวลาตอบ (ค่าเริ่มต้น 20 วินาที)
- กำหนดคะแนน (ค่าเริ่มต้น 1000 คะแนน)
- ลำดับคำถามแบบ Drag & Drop

### 2. การจัดเกมแบบ Live
- สร้าง QR Code และ Game ID สำหรับผู้เล่นเข้าร่วม
- ติดตามผู้เล่นที่เข้าร่วมแบบเรียลไทม์
- ควบคุมเกม: เริ่ม/หยุด/ข้ามคำถาม/เฉลย
- Leaderboard อัพเดทแบบเรียลไทม์

### 3. ประสบการณ์ผู้เล่น
- เข้าร่วมเกมผ่าน QR Code หรือ Game ID
- เลือก Avatar และตั้งชื่อเล่น
- ตอบคำถามพร้อมระบบคิดคะแนนตามความเร็ว
- ดูผลลัพธ์และอันดับพร้อมเอฟเฟกต์ฉลอง

### 4. AI สร้างคำถาม
สามารถสร้างคำถามอัตโนมัติจาก:
- หัวข้อที่ต้องการ (Free Text)
- เนื้อหาข้อความ (Paste Content)
- URL เว็บไซต์
- ไฟล์ PDF
- ไฟล์ PowerPoint

ระดับความยาก: ง่าย / ปานกลาง / ยาก

### 5. โหมดทีม
- แบ่งผู้เล่นเป็นทีม
- Leaderboard แยกตามทีม
- ป้ายทีมและสีประจำทีม

### 6. ธีมสี (15+ แบบ)
Classic, Ocean, Forest, Sunset, Space, Neon, Candy, Dark, Rainbow, Fire, Ice, Nature และอื่นๆ

### 7. ระบบเสียง
- เพลงพื้นหลังห้องรอ
- เสียงเอฟเฟกต์: ตอบถูก/ผิด, นับถอยหลัง, เข้าเกม, เริ่มเกม, ชนะ
- ปุ่มปิด/เปิดเสียง

### 8. ฟีเจอร์เพิ่มเติม
- **Self-Paced Quiz**: ผู้เล่นทำควิซด้วยตัวเองตามเวลาสะดวก
- **Auto-Advance**: ข้ามคำถามอัตโนมัติ
- **Auto-Read**: อ่านคำถามด้วยเสียง (Text-to-Speech)
- **Export CSV**: ดาวน์โหลดผลคะแนน
- **Quiz Duplication**: ทำสำเนาควิซ

---

## โครงสร้างโปรเจกต์

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # หน้าแรก
│   ├── layout.tsx                # Layout หลัก
│   ├── providers.tsx             # AuthProvider
│   │
│   ├── auth/                     # ระบบ Authentication
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── game/[id]/                # หน้าผู้เล่น
│   │   ├── page.tsx              # Main orchestrator
│   │   ├── lobby.tsx             # ห้องรอ
│   │   ├── quiz.tsx              # หน้าตอบคำถาม
│   │   └── results.tsx           # หน้าผลลัพธ์
│   │
│   ├── host/                     # หน้าโฮสต์
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # รายการควิซ
│   │   │   ├── create/page.tsx   # สร้างควิซ
│   │   │   ├── edit/[id]/page.tsx# แก้ไขควิซ
│   │   │   └── analytics/page.tsx# Analytics
│   │   │
│   │   └── game/[id]/            # ควบคุมเกม
│   │       ├── page.tsx
│   │       ├── lobby.tsx
│   │       ├── quiz.tsx
│   │       └── results.tsx
│   │
│   ├── play/[id]/page.tsx        # Self-paced mode
│   ├── tournament/[id]/page.tsx  # Tournament mode
│   │
│   └── api/
│       ├── generate-quiz/route.ts    # AI สร้างคำถาม
│       └── generate-course/route.ts  # สร้างคอร์ส
│
├── components/                   # React Components
│   ├── Navbar.tsx
│   ├── AIQuizGenerator.tsx       # AI สร้างคำถาม
│   ├── VerticalLeaderboard.tsx   # Leaderboard
│   ├── ThemePicker.tsx           # เลือกธีม
│   ├── AvatarPicker.tsx          # เลือก Avatar
│   ├── SoundControl.tsx          # ควบคุมเสียง
│   ├── BackgroundMusic.tsx       # เพลงพื้นหลัง
│   └── ...
│
├── contexts/
│   └── AuthContext.tsx           # จัดการ Auth State
│
├── types/
│   ├── types.ts                  # Type definitions
│   └── supabase.ts               # Supabase types
│
└── utils/
    ├── sounds.ts                 # จัดการเสียง
    ├── themes.ts                 # ข้อมูลธีม
    ├── avatars.ts                # ข้อมูล Avatar
    └── teams.ts                  # จัดการทีม

supabase/                         # Database
├── complete_setup.sql            # Schema ทั้งหมด
├── safe_setup.sql                # Migration script
├── seed.sql                      # ข้อมูลตัวอย่าง
└── migrations/                   # Version control
```

---

## การติดตั้งและใช้งาน

### ความต้องการเบื้องต้น
- Node.js 18+
- npm หรือ yarn
- Supabase Account (ฟรี)

### ขั้นตอนการติดตั้ง

#### 1. ติดตั้ง Dependencies
```bash
npm install
```

#### 2. สร้างโปรเจกต์ Supabase
1. ไปที่ [supabase.com](https://supabase.com) และสร้างโปรเจกต์ใหม่
2. คัดลอก Project URL และ Anon Key

#### 3. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
OPENROUTER_API_KEY=[optional-สำหรับ-AI-features]
```

#### 4. เปิดใช้งาน Anonymous Auth
ใน Supabase Dashboard:
1. ไป Authentication > Providers
2. เปิดใช้งาน "Anonymous Sign-ins"

**สำคัญ**: ถ้าไม่เปิด Anonymous Auth ผู้เล่นจะไม่สามารถเข้าร่วมเกมได้

#### 5. ตั้งค่าฐานข้อมูล
1. ไปที่ Supabase SQL Editor
2. รันไฟล์ `supabase/safe_setup.sql`

#### 6. รัน Development Server
```bash
npm run dev
```
เปิด http://localhost:3000

#### 7. ตรวจสอบการติดตั้ง
เข้า http://localhost:3000/diagnostics เพื่อตรวจสอบ

### คำสั่งที่ใช้บ่อย
```bash
npm run dev      # รัน development server
npm run build    # Build สำหรับ production
npm run start    # รัน production server
npm run lint     # ตรวจสอบ ESLint
```

---

## การ Deploy

### Vercel (แนะนำ)
1. Push โค้ดไปยัง GitHub
2. เชื่อมต่อ repository กับ Vercel
3. ตั้งค่า Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENROUTER_API_KEY` (ถ้าใช้ AI)
4. Deploy

### แพลตฟอร์มอื่นที่รองรับ
- Netlify (ใช้ @netlify/plugin-nextjs)
- Railway
- Render
- ทุก Hosting ที่รองรับ Node.js 18+

---

## ฐานข้อมูล

### ตารางหลัก
| ตาราง | คำอธิบาย |
|-------|----------|
| `quiz_sets` | ชุดควิซ |
| `questions` | คำถาม |
| `choices` | ตัวเลือกคำตอบ |
| `games` | เกมที่กำลังเล่น |
| `participants` | ผู้เล่นในเกม |
| `answers` | คำตอบของผู้เล่น |
| `profiles` | โปรไฟล์ผู้ใช้ |

### Views (Analytics)
- `game_results` - คะแนนรวมผู้เล่นแต่ละเกม
- `quiz_analytics` - สถิติควิซ
- `question_analytics` - ระดับความยากคำถาม

---

## ความปลอดภัย

- Row-Level Security (RLS) บนทุกตาราง
- JWT Authentication ผ่าน Supabase
- ป้องกัน SQL Injection
- ป้องกัน XSS ผ่าน React
- Environment Variables สำหรับ Keys

---

## การใช้งานเบื้องต้น

### สำหรับผู้สร้างควิซ (Host)
1. เข้าสู่ระบบที่ `/auth/login`
2. ไปที่ Dashboard `/host/dashboard`
3. คลิก "สร้างควิซใหม่"
4. เพิ่มคำถามและตัวเลือก (หรือใช้ AI สร้าง)
5. บันทึกและกดเริ่มเกม
6. แชร์ QR Code หรือ Game ID ให้ผู้เล่น
7. ควบคุมเกมจากหน้า Host

### สำหรับผู้เล่น (Player)
1. สแกน QR Code หรือเข้า URL ที่ได้รับ
2. ใส่ Game ID (ถ้าจำเป็น)
3. เลือก Avatar และตั้งชื่อเล่น
4. รอ Host เริ่มเกม
5. ตอบคำถามให้เร็วที่สุด
6. ดูคะแนนและอันดับ

---

## License

MIT License - สามารถนำไปใช้และดัดแปลงได้อย่างอิสระ

---

## ผู้พัฒนา

พัฒนาสำหรับ ICP Ladda Co., Ltd.

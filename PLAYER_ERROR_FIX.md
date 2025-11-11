# แก้ไขปัญหา "TypeError: Load failed" ในหน้า Player

## ปัญหาที่พบ
หน้า Player รอตอบคำถามแสดง error "TypeError: Load failed"

## สาเหตุที่เป็นไปได้
1. การโหลดไฟล์เสียงจาก external URLs ล้มเหลว
2. การเข้าถึง localStorage ในบางกรณีอาจเกิด error
3. Components ที่ใช้ตำแหน่ง fixed ทับกัน
4. Network requests ล้มเหลวโดยไม่มี error handling

## การแก้ไขที่ทำ

### 1. ปรับปรุง Sound Manager (`src/utils/sounds.ts`)
- เพิ่ม try-catch ใน `initSounds()` เพื่อจัดการ errors
- เปลี่ยน audio preload จาก 'auto' เป็น 'metadata' เพื่อลดการโหลดเริ่มต้น
- เพิ่ม error handlers สำหรับแต่ละ audio element
- เพิ่ม error handling สำหรับ localStorage access
- ทำให้ sound playback ล้มเหลวแบบ silent (ไม่ block app)

### 2. แก้ไขตำแหน่ง UI Components
- ย้าย SoundControl จาก `bottom-4 right-4` เป็น `bottom-4 left-4`
- ป้องกันการทับกันกับ LiveReactions button

### 3. เพิ่ม Error Boundary (`src/components/ErrorBoundary.tsx`)
- สร้าง Error Boundary component เพื่อจัดการ runtime errors
- แสดง UI ที่เป็นมิตรเมื่อเกิด error
- มีปุ่มรีโหลดหน้าเพื่อลองใหม่

### 4. ปรับปรุง Quiz Component (`src/app/game/[id]/quiz.tsx`)
- เพิ่ม error handling ใน `fetchLeaderboard()`
- เพิ่ม error state และ error display UI
- เพิ่ม try-catch ใน sound playback
- เพิ่ม window check สำหรับ CountdownCircleTimer

### 5. ปรับปรุง Game Page (`src/app/game/[id]/page.tsx`)
- ห่อ main content ด้วย ErrorBoundary
- เพิ่ม error handling ใน `getGame()` และ `getQuestions()`
- เพิ่ม retry logic (3 ครั้ง) สำหรับการโหลด questions
- เพิ่ม logging เพื่อ debug

## วิธีทดสอบ

1. รีโหลดหน้า Player
2. ตรวจสอบ Console สำหรับ errors หรือ warnings
3. ทดสอบการเล่นเกมปกติ
4. ตรวจสอบว่า sounds ทำงานหรือไม่ (ถ้าไม่ทำงานก็ไม่ควร block app)
5. ตรวจสอบว่า leaderboard แสดงผลถูกต้อง

## หมายเหตุ

- ถ้ายังมีปัญหา ให้เปิด Browser DevTools (F12) และดู Console tab
- ตรวจสอบ Network tab ว่ามี requests ไหนล้มเหลว
- ตรวจสอบว่า Supabase connection ทำงานปกติ
- ลองปิด ad blockers หรือ browser extensions ที่อาจ block external resources

## การแก้ไขเพิ่มเติม (ถ้ายังมีปัญหา)

### ถ้า sounds ยังทำให้เกิดปัญหา
ปิดการใช้งาน sounds ชั่วคราวโดยแก้ไข `src/app/game/[id]/quiz.tsx`:
```typescript
// Comment out sound playback
// playSound('correct')
// playSound('wrong')
```

### ถ้า external audio URLs ถูก block
ใช้ local audio files แทน หรือปิดการใช้งาน sounds ทั้งหมด

### ถ้า CountdownCircleTimer มีปัญหา
ใช้ countdown แบบง่ายแทน:
```typescript
// Replace CountdownCircleTimer with simple countdown
<div className="text-white text-4xl font-bold">
  {Math.ceil(TIME_TIL_CHOICE_REVEAL / 1000)}
</div>
```

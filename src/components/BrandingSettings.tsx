'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/types/types'

interface BrandingSettingsProps {
  quizSetId?: string
  initialLogo?: string
  initialPrimaryColor?: string
  initialSecondaryColor?: string
  initialCompanyName?: string
  initialBackgroundImage?: string
  onSave?: (branding: BrandingData) => void
}

interface BrandingData {
  logo_url: string | null
  primary_color: string
  secondary_color: string
  company_name: string
  background_image_url: string | null
}

const PRESET_COLORS = [
  { name: 'Purple', primary: '#7C3AED', secondary: '#EC4899' },
  { name: 'Blue', primary: '#3B82F6', secondary: '#06B6D4' },
  { name: 'Green', primary: '#10B981', secondary: '#84CC16' },
  { name: 'Orange', primary: '#F97316', secondary: '#EAB308' },
  { name: 'Red', primary: '#EF4444', secondary: '#F43F5E' },
  { name: 'Indigo', primary: '#6366F1', secondary: '#8B5CF6' },
  { name: 'Teal', primary: '#14B8A6', secondary: '#22D3EE' },
  { name: 'Pink', primary: '#EC4899', secondary: '#F472B6' },
]

export default function BrandingSettings({
  quizSetId,
  initialLogo = '',
  initialPrimaryColor = '#7C3AED',
  initialSecondaryColor = '#EC4899',
  initialCompanyName = '',
  initialBackgroundImage = '',
  onSave,
}: BrandingSettingsProps) {
  const [logoUrl, setLogoUrl] = useState(initialLogo)
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor)
  const [secondaryColor, setSecondaryColor] = useState(initialSecondaryColor)
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [backgroundImage, setBackgroundImage] = useState(initialBackgroundImage)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกินไป (สูงสุด 2MB)')
      return
    }

    setIsUploading(true)

    try {
      // Convert to base64 for demo (in production, upload to storage)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoUrl(e.target?.result as string)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload error:', error)
      setIsUploading(false)
    }
  }

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกินไป (สูงสุด 5MB)')
      return
    }

    setIsUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload error:', error)
      setIsUploading(false)
    }
  }

  const handlePresetSelect = (preset: typeof PRESET_COLORS[0]) => {
    setPrimaryColor(preset.primary)
    setSecondaryColor(preset.secondary)
  }

  const handleSave = async () => {
    const branding: BrandingData = {
      logo_url: logoUrl || null,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      company_name: companyName,
      background_image_url: backgroundImage || null,
    }

    if (quizSetId) {
      setIsSaving(true)
      // Save to organization_branding table
      const { error } = await (supabase as any)
        .from('organization_branding')
        .upsert({
          quiz_set_id: quizSetId,
          ...branding,
        }, { onConflict: 'quiz_set_id' })

      setIsSaving(false)

      if (error) {
        // If table doesn't exist yet, just proceed with onSave
        console.warn('Branding table not available:', error)
      }
    }

    onSave?.(branding)
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        🎨 ตั้งค่าแบรนด์
      </h2>

      {/* Preview */}
      <div
        className="rounded-xl p-6 mb-6 text-white text-center"
        style={{
          background: backgroundImage
            ? `url(${backgroundImage}) center/cover`
            : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      >
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Logo"
            className="h-16 mx-auto mb-4 object-contain"
          />
        )}
        <h3 className="text-2xl font-bold mb-1">
          {companyName || 'ชื่อบริษัท'}
        </h3>
        <p className="opacity-80">ตัวอย่างหน้าแสดงผล</p>
      </div>

      {/* Company Name */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          ชื่อองค์กร / บริษัท
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="เช่น ICPG Training"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Logo Upload */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          โลโก้
        </label>
        <input
          type="file"
          ref={logoInputRef}
          onChange={handleLogoUpload}
          accept="image/*"
          className="hidden"
        />
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo preview"
              className="h-16 w-16 object-contain border rounded-lg"
            />
          ) : (
            <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
              🖼️
            </div>
          )}
          <button
            onClick={() => logoInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            {isUploading ? 'กำลังอัปโหลด...' : logoUrl ? 'เปลี่ยนโลโก้' : 'อัปโหลดโลโก้'}
          </button>
          {logoUrl && (
            <button
              onClick={() => setLogoUrl('')}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              ลบ
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">แนะนำ: PNG หรือ SVG พื้นหลังโปร่งใส, สูงสุด 2MB</p>
      </div>

      {/* Color Presets */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          ชุดสีสำเร็จรูป
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              className={`px-3 py-2 rounded-lg text-white text-sm font-medium transition hover:scale-105 ${
                primaryColor === preset.primary ? 'ring-2 ring-offset-2 ring-gray-400' : ''
              }`}
              style={{
                background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`,
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            สีหลัก
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            สีรอง
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Background Image */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          รูปพื้นหลัง (ไม่บังคับ)
        </label>
        <input
          type="file"
          ref={bgInputRef}
          onChange={handleBackgroundUpload}
          accept="image/*"
          className="hidden"
        />
        <div className="flex items-center gap-4">
          {backgroundImage ? (
            <img
              src={backgroundImage}
              alt="Background preview"
              className="h-16 w-24 object-cover border rounded-lg"
            />
          ) : (
            <div className="h-16 w-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
              🏞️
            </div>
          )}
          <button
            onClick={() => bgInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            {isUploading ? 'กำลังอัปโหลด...' : backgroundImage ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}
          </button>
          {backgroundImage && (
            <button
              onClick={() => setBackgroundImage('')}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              ลบ
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">จะแทนที่สีพื้นหลัง, สูงสุด 5MB</p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50"
      >
        {isSaving ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่า'}
      </button>
    </div>
  )
}

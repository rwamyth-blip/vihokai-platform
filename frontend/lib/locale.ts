import { useEffect, useState } from "react"

export type UILocale = "th" | "en" | "zh" | "ja" | "ko"

const KEY = "vihok_locale"
const DEFAULT: UILocale = "th"
const SUPPORTED: UILocale[] = ["th", "en", "zh", "ja", "ko"]

/** อ่านภาษา UI ที่ผู้ใช้เลือก (ตรงกับเพจภายใน [locale]) — default th */
export function getUILocale(): UILocale {
  if (typeof window === "undefined") return DEFAULT
  // 1) path /xx/... (ถ้าเปิดจากเพจภายใน)
  const seg = window.location.pathname.split("/")[1]
  if ((SUPPORTED as string[]).includes(seg)) return seg as UILocale
  // 2) ค่าที่เคยเลือก
  const saved = window.localStorage.getItem(KEY)
  if (saved && (SUPPORTED as string[]).includes(saved)) return saved as UILocale
  // 3) ภาษา browser (เอาแค่ 5 ภาษาหลัก)
  const nav = (navigator.language || "th").slice(0, 2).toLowerCase()
  if ((SUPPORTED as string[]).includes(nav)) return nav as UILocale
  return DEFAULT
}

/** บันทึกภาษาที่ผู้ใช้เลือก (เพจภายในอ่านค่าเดียวกัน) */
export function setUILocale(locale: UILocale) {
  try {
    window.localStorage.setItem(KEY, locale)
  } catch {}
}

/** hook: ภาษา UI ปัจจุบัน + ตัวเปลี่ยน (sync ข้ามแท็บ) */
export function useUILocale(): [UILocale, (l: UILocale) => void] {
  const [locale, setLocale] = useState<UILocale>(DEFAULT)
  useEffect(() => {
    setLocale(getUILocale())
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue && (SUPPORTED as string[]).includes(e.newValue)) {
        setLocale(e.newValue as UILocale)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])
  const change = (l: UILocale) => {
    setUILocale(l)
    setLocale(l)
  }
  return [locale, change]
}

export const UI_LOCALES: { code: UILocale; flag: string; name: string }[] = [
  { code: "th", flag: "🇹🇭", name: "ไทย" },
  { code: "en", flag: "🇺🇸", name: "English" },
  { code: "zh", flag: "🇨🇳", name: "中文" },
  { code: "ja", flag: "🇯🇵", name: "日本語" },
  { code: "ko", flag: "🇰🇷", name: "한국어" },
]

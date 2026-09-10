// frontend/lib/api.ts
// ศูนย์กลางการเรียก API — แนบ token ให้อัตโนมัติ และเด้งไปหน้า login เมื่อ session หมดอายุ
//
// ก่อนหน้านี้ทุกหน้าเรียก API ด้วย `user_id=anon` แบบ hardcode และไม่เคยส่ง token
// ผลคือผู้ใช้ทุกคนแชร์ข้อมูลก้อนเดียวกัน และใครก็อ่านข้อมูลคนอื่นได้ถ้ารู้ UUID
// ตอนนี้ backend บังคับ Bearer token แล้ว จึงต้องแนบ token ทุกครั้ง

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

const TOKEN_KEY = "token"
const USER_KEY = "user"
const LOGIN_PATH = "/auth"

export type SessionUser = {
  id: string
  email: string
  name?: string | null
  avatar?: string | null
  provider?: string | null
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    // ค่าเสีย — เก็บกวาดทิ้งไม่ให้พังซ้ำ
    localStorage.removeItem(USER_KEY)
    return null
  }
}

/** บันทึก session หลัง login สำเร็จ (user รับได้ทั้ง object และ JSON string) */
export function saveSession(token: string, user: SessionUser | string): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, typeof user === "string" ? user : JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function goToLogin(): void {
  const back = window.location.pathname + window.location.search
  window.location.href = `${LOGIN_PATH}?next=${encodeURIComponent(back)}`
}

/**
 * ต้อง login ก่อน — ถ้าไม่มี session ที่ใช้ได้ จะเด้งไป /auth
 * คืน user เมื่อพร้อมใช้งาน, คืน null เมื่อกำลังเด้งออก
 */
export function requireLogin(): SessionUser | null {
  if (typeof window === "undefined") return null

  const user = getSessionUser()
  if (user?.id && getToken()) return user

  clearSession()
  goToLogin()
  return null
}

/**
 * fetch ที่แนบ Authorization ให้อัตโนมัติ
 * 401 = session หมดอายุ หรือรหัสผ่านถูกเปลี่ยน -> ล้าง session แล้วให้ login ใหม่
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers = new Headers(init.headers)
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })

  if (res.status === 401) {
    clearSession()
    goToLogin()
    throw new Error("unauthorized")
  }
  return res
}

/** apiFetch + parse JSON ให้เลย */
export async function apiJson<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init)
  return (await res.json()) as T
}

/** ตัวช่วยสร้าง POST/PUT body เป็น JSON ให้อ่านง่ายขึ้น */
export function jsonInit(payload: unknown, method: "POST" | "PUT" | "DELETE" = "POST"): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }
}

"use client"
import { useState, useEffect } from "react"
import { API_BASE, saveSession } from "@/lib/api"

export default function ResetPasswordPage() {
  const [token, setToken] = useState("")
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  // อ่าน token จาก query string ฝั่ง client
  // (ใช้ window.location แทน useSearchParams เพื่อเลี่ยง Suspense boundary ของ Next)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken((params.get("token") || "").trim())
    setReady(true)
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setNotice("")

    if (password !== confirm) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      const detail = data?.detail

      if (!res.ok) {
        setError(
          typeof detail === "string"
            ? detail
            : detail?.message || "ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาลองใหม่"
        )
        setLoading(false)
        return
      }

      // สำเร็จ → ล็อกอินให้เลย ไม่ต้องกรอกรหัสซ้ำ
      setNotice(data?.message || "ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว")
      if (data?.token) {
        saveSession(data.token, data.user)
        setTimeout(() => {
          window.location.href = "/"
        }, 900)
      } else {
        setTimeout(() => {
          window.location.href = "/auth"
        }, 1200)
      }
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่")
      setLoading(false)
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="bg-[#1a1a1a] rounded-3xl p-8 w-full max-w-md border border-white/5 shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black font-bold text-2xl">
            V
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-white mb-2">
          ตั้งรหัสผ่านใหม่
        </h1>

        {/* ยังไม่รู้ผลจนกว่า effect จะรัน — กันจอวูบวาบ */}
        {!ready && (
          <p className="text-center text-white/40 text-sm mb-6">กำลังโหลด...</p>
        )}

        {ready && !token && (
          <>
            <p className="text-center text-white/40 text-sm mb-6">
              ลิงก์นี้ไม่สมบูรณ์ (ไม่มี token)
            </p>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
              กรุณาเปิดลิงก์จากอีเมลอีกครั้ง หรือขอลิงก์ใหม่
            </div>
            <a
              href="/auth"
              className="mt-6 block w-full text-center bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </a>
          </>
        )}

        {ready && token && (
          <>
            <p className="text-center text-white/40 text-sm mb-6">
              ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ
            </p>

            <form onSubmit={handleReset} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
                autoComplete="new-password"
                required
                minLength={8}
                autoFocus
                className={inputClass}
              />

              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="ยืนยันรหัสผ่านใหม่"
                autoComplete="new-password"
                required
                minLength={8}
                className={inputClass}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
              >
                {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
              </button>

              <a
                href="/auth"
                className="block text-center text-sm text-white/40 hover:text-white/70 transition"
              >
                ← กลับไปเข้าสู่ระบบ
              </a>
            </form>

            {notice && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-sm text-center">
                {notice}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* ลิงก์หมดอายุ/ถูกใช้แล้ว → ให้ไปขอลิงก์ใหม่ได้เลย */}
            {error && (
              <a
                href="/auth"
                className="mt-3 block text-center text-sm text-white/50 hover:text-white/80 underline transition"
              >
                ขอลิงก์ใหม่
              </a>
            )}
          </>
        )}
      </div>
    </div>
  )
}

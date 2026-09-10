"use client"
import { useState, useEffect } from "react"
import { API_BASE, saveSession } from "@/lib/api"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [nextPath, setNextPath] = useState("")

  const handleGoogleLogin = () => {
    setLoading(true)
    window.location.href = `${API_BASE}/api/auth/google`
  }

  // Login โดยตรง: email + รหัสผ่าน ครั้งเดียวจบ
  // ไม่มี 2FA · ไม่มี OTP ทาง SMS · ไม่มี prompt เด้งบนมือถือ · ไม่มี reCAPTCHA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setNotice("")

    const address = email.trim().toLowerCase()

    // ---- ลืมรหัสผ่าน: ขอลิงก์ตั้งรหัสใหม่ทางอีเมล ----
    if (mode === "forgot") {
      try {
        const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: address }),
        })
        const data = await res.json().catch(() => ({}))
        const detail = data?.detail

        if (!res.ok) {
          setError(
            typeof detail === "string"
              ? detail
              : detail?.message || "ส่งลิงก์ไม่สำเร็จ กรุณาลองใหม่"
          )
        } else {
          setNotice(data?.message || "ถ้าอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์ไปแล้ว")
          setMode("login")
        }
      } catch {
        setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่")
      }
      setLoading(false)
      return
    }

    // ---- เข้าสู่ระบบ / สมัครใหม่ ----
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const detail = data?.detail
        setError(
          typeof detail === "string"
            ? detail
            : detail?.message || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่"
        )
        setLoading(false)
        return
      }

      saveSession(data.token, data.user)
      window.location.href = nextPath || "/"
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่")
      setLoading(false)
    }
  }

  // รับ callback จาก Backend (?token=...&user=...) และอ่าน ?next= เพื่อกลับไปที่เดิม
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const next = urlParams.get("next") || ""
    setNextPath(next)

    const token = urlParams.get("token")
    const user = urlParams.get("user")

    if (token && user) {
      saveSession(token, user)
      window.location.href = next || "/"
    }
  }, [])

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
          {mode === "login"
            ? "Welcome back"
            : mode === "register"
              ? "Create your account"
              : "ลืมรหัสผ่าน"}
        </h1>
        <p className="text-center text-white/40 text-sm mb-6">
          {mode === "login"
            ? "Sign in to continue to Vihok AI"
            : mode === "register"
              ? "Sign up with email and password"
              : "กรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่"}
        </p>

        {/* Email + Password — login ตรงครั้งเดียวจบ ไม่มีขั้นตอนยืนยันเพิ่ม */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            autoComplete="email"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
          />

          {mode !== "forgot" && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
          >
            {loading
              ? mode === "forgot"
                ? "กำลังส่งลิงก์..."
                : mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
              : mode === "forgot"
                ? "ส่งลิงก์ตั้งรหัสผ่านใหม่"
                : mode === "login"
                  ? "Sign In"
                  : "Sign Up"}
          </button>

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setMode("forgot")
                  setError("")
                  setNotice("")
                }}
                className="text-sm text-white/40 hover:text-white/70 transition"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
          )}

          <p className="text-center text-sm text-white/40">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("login")
                  setError("")
                  setNotice("")
                }}
                className="text-white hover:underline font-medium"
              >
                ← กลับไปเข้าสู่ระบบ
              </button>
            ) : (
              <>
                {mode === "login" ? "ยังไม่มีบัญชี?" : "มีบัญชีอยู่แล้ว?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login")
                    setError("")
                    setNotice("")
                  }}
                  className="text-white hover:underline font-medium"
                >
                  {mode === "login" ? "สมัครใหม่" : "เข้าสู่ระบบ"}
                </button>
              </>
            )}
          </p>
        </form>

        {notice && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-sm text-center">
            {notice}
          </div>
        )}

        {mode !== "forgot" && (
          <>
        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-xs text-white/20 uppercase">or</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl py-3 hover:bg-white/10 transition disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            <span className="text-white font-medium">Continue with Google</span>
          </button>

        </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
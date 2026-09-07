"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGoogleLogin = () => {
    setLoading(true)
    // Backend /api/auth/google ตอบ 302 redirect → ไป Google โดยตรง
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
    window.location.href = `${API_BASE}/api/auth/google`
  }

  // รับ callback จาก Backend
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get("token")
    const user = urlParams.get("user")
    
    if (token && user) {
      localStorage.setItem("token", token)
      localStorage.setItem("user", user)
      window.location.href = "/"
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

        <h1 className="text-2xl font-bold text-center text-white mb-2">Welcome back</h1>
        <p className="text-center text-white/40 text-sm mb-6">Sign in to continue to Vihok AI</p>

        {/* Email Input */}
        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          
          <button className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition">
            Continue
          </button>

          <div className="text-right">
            <a href="#" className="text-sm text-white/30 hover:text-white/60 transition">
              Forgot password?
            </a>
          </div>
        </div>

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

          <button className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl py-3 hover:bg-white/10 transition">
            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="text-white font-medium">Continue with Facebook</span>
          </button>

          <button className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl py-3 hover:bg-white/10 transition">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
            <span className="text-white font-medium">Continue with Apple</span>
          </button>

          <button className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl py-3 hover:bg-white/10 transition">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.4 24c-.3 0-.7-.1-1-.3C4.7 21.1 0 16.6 0 11.7 0 6.8 4.3 3 9.6 3c2.1 0 4.1.8 5.6 2.2l-2.3 2.3c-.9-.9-2.1-1.3-3.3-1.3-3.4 0-6.1 2.7-6.1 6.1 0 3.4 2.7 6.1 6.1 6.1 2.9 0 5.2-1.9 5.9-4.5h-5.9v-3h9.4c.1.5.2 1 .2 1.5 0 5.3-3.6 9.1-8.7 9.1z"/>
            </svg>
            <span className="text-white font-medium">Continue with Microsoft</span>
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-white/30 text-sm mt-6">
          Don't have an account?{" "}
          <a href="#" className="text-white hover:underline font-medium">
            Sign up
          </a>
        </p>

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
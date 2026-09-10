"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { saveSession } from "@/lib/api"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get("token")
    const user = urlParams.get("user")
    
    if (token && user) {
      saveSession(token, user)
      router.push("/th")
    } else {
      router.push("/auth")
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white mx-auto mb-4"></div>
        <p className="text-white/50">กำลังเข้าสู่ระบบ...</p>
      </div>
    </div>
  )
}
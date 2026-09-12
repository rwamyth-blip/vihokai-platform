// app/[locale]/memory/page.tsx — หน้า Kola Memory & Context
// ดู/ค้น/กรอง/เพิ่ม/แก้/ลบ/ล้าง Memory รายผู้ใช้ (JWT จาก lib/api, ไม่ hardcode user)
"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, BrainCircuit, Plus, Pencil, Trash2, Search, Power, Loader2 } from "lucide-react"
import { apiFetch, apiJson, jsonInit, requireLogin } from "@/lib/api"
import { fontForLocale } from "@/components/locale"

const CATS = ["all", "preference", "profile", "goal", "project", "instruction", "fact"] as const

type Memory = {
  id: string
  category: string
  content: string
  importance: number
  confidence: number
  created_at?: string
  updated_at?: string
}

export default function MemoryPage() {
  const router = useRouter()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : (params?.locale as string) || "th"
  const fontFamily = fontForLocale(locale)

  const [status, setStatus] = useState<any>(null)
  const [items, setItems] = useState<Memory[]>([])
  const [cat, setCat] = useState<(typeof CATS)[number]>("all")
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [addCat, setAddCat] = useState("fact")
  const [addText, setAddText] = useState("")
  const [editing, setEditing] = useState<Memory | null>(null)
  const [editText, setEditText] = useState("")
  const [confirmClear, setConfirmClear] = useState(false)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const s = await apiJson("/api/kola/status")
      setStatus(s)
      const qs = new URLSearchParams()
      if (cat !== "all") qs.set("category", cat)
      if (q.trim()) qs.set("search", q.trim())
      const d = await apiJson(`/api/kola/memories?${qs.toString()}`)
      setItems(d.memories || [])
    } catch (e: any) {
      setError(e?.message === "unauthorized" ? "" : "โหลด Memory ไม่ได้ — ตรวจว่า migration รันแล้ว (supabase_kola_memory.sql)")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!requireLogin()) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!requireLogin()) return
    const t = setTimeout(load, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, q])

  const toggleEnabled = async () => {
    const next = !(status?.memory_enabled ?? true)
    await apiFetch("/api/kola/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memory_enabled: next }) })
    load()
  }

  const addMemory = async () => {
    if (!addText.trim()) return
    await apiFetch("/api/kola/memories", jsonInit({ category: addCat, content: addText.trim() }))
    setAddText("")
    setShowAdd(false)
    load()
  }

  const saveEdit = async () => {
    if (!editing || !editText.trim()) return
    await apiFetch(`/api/kola/memories/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: editText.trim() }) })
    setEditing(null)
    load()
  }

  const delOne = async (id: string) => {
    await apiFetch(`/api/kola/memories/${id}`, { method: "DELETE" })
    load()
  }

  const clearAll = async () => {
    await apiFetch("/api/kola/memories?confirm=yes", { method: "DELETE" })
    setConfirmClear(false)
    load()
  }

  const online = !!status?.online

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0f0f0f] dark:text-white" style={{ fontFamily }}>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-[#0f0f0f]/80">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <button onClick={() => router.push(`/${locale}`)} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-orange-500 dark:text-white/50">
            <ArrowLeft size={17} /> กลับไปแชท
          </button>
          <div className="flex items-center gap-2 text-sm font-black">
            <BrainCircuit size={17} className="text-orange-500" /> Kola Memory
            <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold ${online ? "bg-green-500/10 text-green-500" : "bg-slate-400/10 text-slate-400"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${online ? "animate-pulse bg-green-500" : "bg-slate-400"}`} />
              {status ? (online ? "ONLINE" : "OFFLINE") : "…"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        <p className="text-sm text-slate-500 dark:text-white/50">Memory &amp; Context • จำบริบท • ต่อเนื่องทุกแชท</p>
        {status && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-4 text-[13px] dark:border-white/5">
            <span>ความจำ: {status.memory_count ?? 0} รายการ</span>
            <span className="text-slate-400">vector: {status.vector_ready ? "พร้อม" : "fallback"}</span>
            <span className="text-slate-400">embedding: {status.embedding_ready ? "พร้อม" : "ไม่มี key"}</span>
            <button onClick={toggleEnabled} className="ml-auto flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-bold dark:border-white/10">
              <Power size={14} /> {status.memory_enabled ? "ปิด Memory" : "เปิด Memory"}
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 dark:border-white/10">
            <Search size={15} className="text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา memory..." className="w-full bg-transparent text-sm outline-none" />
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white">
            <Plus size={15} /> เพิ่ม
          </button>
          <button onClick={() => setConfirmClear(true)} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-500 dark:border-red-500/30">
            ล้างทั้งหมด
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-xs font-bold ${cat === c ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-white/60"}`}>
              {c}
            </button>
          ))}
        </div>

        {showAdd && (
          <div className="mt-4 rounded-2xl border p-4 dark:border-white/10">
            <div className="flex gap-2">
              <select value={addCat} onChange={(e) => setAddCat(e.target.value)} className="rounded-xl border bg-transparent px-3 py-2 text-sm dark:border-white/10">
                {CATS.filter((c) => c !== "all").map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={addText} onChange={(e) => setAddText(e.target.value)} placeholder="เช่น ผู้ใช้ชอบคำตอบภาษาไทยสั้นๆ" className="flex-1 rounded-xl border bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10" />
              <button onClick={addMemory} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white">บันทึก</button>
            </div>
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> กำลังโหลด...</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-300 p-6 text-center text-sm text-red-500 dark:border-red-500/30">{error}</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center text-sm text-slate-400 dark:border-white/5">ยังไม่มี Memory — คุยกับ AI แล้วระบบจะจำสิ่งสำคัญให้อัตโนมัติ หรือกด “เพิ่ม” ด้วยตัวเอง</div>
          ) : (
            <div className="space-y-3">
              {items.map((m) => (
                <div key={m.id} className="rounded-2xl border p-4 dark:border-white/5 dark:bg-[#1a1a1a]">
                  {editing?.id === m.id ? (
                    <div className="flex gap-2">
                      <input value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 rounded-xl border bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10" />
                      <button onClick={saveEdit} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white">บันทึก</button>
                      <button onClick={() => setEditing(null)} className="rounded-xl border px-4 py-2 text-sm dark:border-white/10">ยกเลิก</button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-500">{m.category}</span>
                      <p className="flex-1 text-sm leading-6">{m.content}</p>
                      <button onClick={() => { setEditing(m); setEditText(m.content) }} className="text-slate-400 hover:text-orange-500"><Pencil size={15} /></button>
                      <button onClick={() => delOne(m.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-slate-400">สำคัญ {m.importance}/5 • มั่นใจ {Math.round((m.confidence ?? 0) * 100)}%</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {confirmClear && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-[#1a1a1a]">
              <h3 className="font-black">ล้าง Memory ทั้งหมด?</h3>
              <p className="mt-2 text-sm text-slate-500">AI จะจำอะไรเกี่ยวกับคุณไม่ได้อีก (กู้คืนไม่ได้)</p>
              <div className="mt-5 flex gap-2">
                <button onClick={clearAll} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white">ล้างทั้งหมด</button>
                <button onClick={() => setConfirmClear(false)} className="flex-1 rounded-xl border py-2.5 text-sm dark:border-white/10">ยกเลิก</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

"use client"
import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Search,
  Database,
  Bot,
  Sparkles,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { fontForLocale, libCopyForLocale } from "@/components/locale"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

export default function LibraryPage() {
  const router = useRouter()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : (params?.locale as string) || "th"
  // ข้อความ + ฟอนต์ตามภาษาหน้า main (th/en/ja/zh/ko, อื่น fallback en)
  const lc = libCopyForLocale(locale)
  const fontFamily = fontForLocale(locale)

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [translateTo, setTranslateTo] = useState("th")

  const [chat, setChat] = useState("")
  const [answer, setAnswer] = useState<any>(null)
  const [asking, setAsking] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`${API_BASE}/library/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // แปล title+description อัตโนมัติตามภาษาหน้า (ปิดได้โดยเลือกต้นฉบับ)
        body: JSON.stringify({
          query: query.trim(),
          limit: 12,
          target_lang: translateTo === "orig" ? null : translateTo || locale,
        }),
      })
      const data = await res.json()
      setResults(data.results || [])
    } catch (e) {
      console.error("Library search error:", e)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const ask = async () => {
    if (!chat.trim()) return
    setAsking(true)
    setAnswer(null)
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chat.trim(), use_library: true, top_k: 6 }),
      })
      const data = await res.json()
      setAnswer(data)
    } catch (e) {
      console.error("RAG chat error:", e)
      setAnswer({ answer: lc.disconnected })
    } finally {
      setAsking(false)
    }
  }

  return (
    <main
      className="min-h-screen bg-[#f8fafc] dark:bg-[#0f0f0f] text-slate-800 dark:text-white"
      style={{ fontFamily }}
      lang={locale}
    >
      <div className="mx-auto max-w-[1000px] px-5 py-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/${locale}`)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <ArrowLeft size={18} />
            {lc.back}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg shadow-blue-200 dark:shadow-none">
              <Database size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                VihokAI <span className="text-blue-600 dark:text-blue-400">Global Library</span>
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-white/40">
                {lc.subtitle}
              </p>
            </div>
          </div>
        </header>

        <p className="mt-4 text-[12px] text-slate-400 dark:text-white/30">
          {lc.sourcesLine}
        </p>

        {/* Search */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-5 py-4 shadow-sm">
            <Search size={20} className="text-slate-400 dark:text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder={lc.searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-white/30"
            />
          </div>
          <button
            onClick={search}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 dark:shadow-none transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {lc.searchBtn}
          </button>
          {/* เลือกภาษาคำแปล: ตามหน้าปัจจุบัน / ไทย / อังกฤษ / ต้นฉบับ */}
          <select
            value={translateTo}
            onChange={(e) => setTranslateTo(e.target.value)}
            title={lc.translateLabel}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-4 py-4 text-sm font-semibold outline-none"
          >
            <option value={locale}>{lc.optFollow(locale)}</option>
            <option value="th">{lc.optTh}</option>
            <option value="en">{lc.optEn}</option>
            <option value="orig">{lc.optOrig}</option>
          </select>
        </div>

        {/* Results */}
        {searched && (
          <div className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-blue-500" />
              <h2 className="font-bold">
                {lc.results} <span className="text-blue-600 dark:text-blue-400">{results.length}</span> {lc.items}
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-20 text-slate-400 dark:text-white/30">
                <Loader2 size={20} className="animate-spin" /> {lc.searching}
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 py-16 text-center text-slate-400 dark:text-white/30">
                {lc.empty}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-5 shadow-sm transition hover:shadow-md"
                  >
                    {r.thumbnail && (
                      <img
                        src={r.thumbnail}
                        alt={r.title}
                        className="mb-3 h-40 w-full rounded-xl object-cover"
                      />
                    )}
                    <h3 className="text-sm font-bold leading-snug">{r.title_translated || r.title || "Untitled"}</h3>
                    {/* โชว์ชื่อต้นฉบับจางๆ เมื่อมีคำแปล */}
                    {r.title_translated && r.title_translated !== r.title && (
                      <p className="mt-0.5 text-[11px] italic text-slate-400 dark:text-white/30">
                        {r.title}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-white/40">
                      {(r.authors || []).slice(0, 3).join(", ")}
                      {r.year ? ` · ${r.year}` : ""}
                    </p>
                    {(r.description_translated || r.description || r.abstract) && (
                      <p className="mt-2 line-clamp-3 text-[12px] text-slate-500 dark:text-white/50">
                        {r.description_translated || r.description || r.abstract}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                      <span className="rounded-full bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {r.source}
                      </span>
                      {r.source_url && (
                        <a
                          href={r.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Source <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RAG Chat */}
        <div className="mt-10 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 text-white">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="font-bold">{lc.askTitle}</h2>
              <p className="text-[11px] text-slate-400 dark:text-white/40">
                {lc.askSub}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
              placeholder={lc.askPlaceholder}
              className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#2f2f2f] px-4 py-3 text-sm outline-none focus:border-blue-400"
            />
            <button
              onClick={ask}
              disabled={asking}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {asking ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
              {lc.askBtn}
            </button>
          </div>

          {answer && (
            <div className="mt-5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#2a2a2a] p-5">
              <p className="whitespace-pre-wrap text-sm leading-7">{answer.answer}</p>
              {answer.citations && answer.citations.length > 0 && (
                <>
                  <hr className="my-4 border-slate-200 dark:border-white/10" />
                  <p className="mb-2 text-xs font-bold">{lc.refs}</p>
                  <ul className="space-y-1.5">
                    {answer.citations.map((c: any, i: number) => (
                      <li key={i} className="text-[12px] text-slate-600 dark:text-white/60">
                        • {c.title}
                        {c.source ? ` — ${c.source}` : ""}
                        {c.url && (
                          <>
                            {" "}
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {c.url}
                            </a>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

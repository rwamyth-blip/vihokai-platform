// app/[locale]/marketplace/page.tsx — Model Marketplace (port จาก Vihokai.html)
// เมนูรองภายใต้ AI Model — ขายแยก 5 โมเดลตามงาน (QR PromptPay / ตัดบัตรจำลอง + ออก API key + ตัวอย่าง curl)
// หมายเหตุ: ระบบชำระเงินเป็น mock (frontend only) — ห้ามใช้เก็บเงินจริงจนกว่าจะต่อ Omise/PromptPay จริง
"use client"
import { useMemo, useRef, useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft, Check, Copy, CreditCard, QrCode, X, Zap, Sparkles,
  MessageCircle, Cpu, FileText, Database, Timer, ShieldCheck, Layers,
} from "lucide-react"
import { fontForLocale } from "@/components/locale"

type MarketModel = {
  id: string
  technical: string
  subtitle: string
  title: string
  price: number
  accentText: string
  accentBorder: string
  accentGradient: string
  context: string
  speed: string
  pricePerM: string
  badge: string
  desc: string
  features: string[]
  bestFor: string[]
  icon: any
  params: string
}

const MODELS: MarketModel[] = [
  {
    id: "siri-thai", technical: "muse-glimmer-30b", subtitle: "muse-glimmer-30b",
    title: "VihokAI SIRI Thai • Powered by Glimmer", price: 499,
    accentText: "text-emerald-400", accentBorder: "border-emerald-500/30",
    accentGradient: "from-emerald-500 to-teal-500", context: "32k", speed: "ไว",
    pricePerM: "$0.03 / M", badge: "ไทยลื่นสุด",
    desc: "ไทยลื่นไหล ไร้ติดขัด - Powered by Qwen3 30B A3B Glimmer (Thai Optimized)",
    features: ["Context 32k tokens", "ไทยลื่นสุด ไม่เพี้ยน", "$0.03 / M ถูกที่สุด", "Latency ~300ms"],
    bestFor: ["Chatbot", "ลูกค้าไทย", "FAQ"], icon: MessageCircle, params: "30B",
  },
  {
    id: "lightning", technical: "nvidia-nemotron-3.5-lightning-30b-a3b",
    subtitle: "Powered by NVIDIA Nemotron 3.5 Lightning 30B A3B",
    title: "VihokAI Poly Lightning • Powered by NVIDIA", price: 599,
    accentText: "text-amber-400", accentBorder: "border-amber-500/30",
    accentGradient: "from-amber-400 to-orange-500", context: "262k", speed: "4x เร็วแรง",
    pricePerM: "$0.05 / M", badge: "Trending • เร็ว 4x",
    desc: "ไวปานฟ้าแลบ แวบเดียวเสร็จ - เร็วแรง 4x รองรับ tool calling เชิงระบบ",
    features: ["Context 262k tokens", "เร็วแรง 4x กว่ารุ่นทั่วไป", "$0.05 / M input", "Agent + Function Call"],
    bestFor: ["AI Agent", "Speed", "Tool Use"], icon: Zap, params: "30B MoE",
  },
  {
    id: "1m", technical: "deepseek-v4-flash-0731",
    subtitle: "Powered by DeepSeek V4 Flash 0731 - 1M Context",
    title: "VihokAI TIDA - flash • Powered by DeepSeek", price: 799,
    accentText: "text-violet-400", accentBorder: "border-violet-500/30",
    accentGradient: "from-violet-500 to-fuchsia-500", context: "1M", speed: "Flash",
    pricePerM: "Cached $0.007 / M", badge: "จำแม่น 1M",
    desc: "TIDA อ่านเอกสารยาว 1 ล้าน tokens อ่านสัญญา งานวิจัย ทั้งเล่มจบในครั้งเดียว",
    features: ["Context 1 ล้าน tokens", "Cached $0.007 / M ถูกสุด", "อ่าน PDF 500 หน้า", "RAG ยาวพิเศษ"],
    bestFor: ["Long Docs", "สรุปเอกสาร", "กฎหมาย"], icon: FileText, params: "Flash",
  },
  {
    id: "pro-120b", technical: "gpt-oss-120b",
    subtitle: "Powered by OpenAI gpt-oss-120b 120B - Apache 2.0",
    title: "VihokAI Kola 120B • Powered by OpenAI", price: 999,
    accentText: "text-cyan-400", accentBorder: "border-cyan-500/30",
    accentGradient: "from-cyan-400 to-blue-500", context: "128k", speed: "Reasoning",
    pricePerM: "$0.15 / M", badge: "ฉลาดสุด 117B",
    desc: "OpenAI open-source 120B ฉลาดสุด เขียนโค้ด แก้บัค วิเคราะห์เชิงลึก",
    features: ["117B params ฉลาดสุด", "Context 128k", "$0.15 / M สำหรับ reasoning", "Coding & Reasoning Top"],
    bestFor: ["Coding", "Reasoning", "Complex Task"], icon: Cpu, params: "117B",
  },
  {
    id: "z-flash", technical: "accounts/fireworks/models/glm-5p3-flash",
    subtitle: "Powered by Z.ai GLM-5.3-Flash - 320B A18B - Multimodal",
    title: "VihokAI Zina Flash • Powered by Zhipu", price: 899,
    accentText: "text-zinc-100", accentBorder: "border-zinc-700",
    accentGradient: "from-white to-zinc-400", context: "200k", speed: "Multimodal",
    pricePerM: "$0.08 / M", badge: "ใหม่ล่าสุด 320B",
    desc: "VihokAI Zina Flash - โมเดล Multimodal ตัวแรกของ GLM-5 series 320B total 18B active แรงเกือบเท่า Claude Opus 4.8 โค้ดดิ้ง Agent เก่ง ราคาถูกกว่า 10x",
    features: ["320B total / 18B active MoE", "Multimodal ตัวแรก GLM-5", "แรงเทียบเท่า Opus 4.8", "$0.08 / M (input $0.16/M)"],
    bestFor: ["Coding Agent", "Multimodal", "ถูกแรง"], icon: Sparkles, params: "320B",
  },
]

// PromptPay payload (port ตรงจาก Vihokai.html — เบอร์ mock 08x, ใช้จริงต้องเปลี่ยนเป็นเบอร์ร้าน)
function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}
function promptPayPayload(mobile: string, amount: number): string {
  let n = mobile.replace(/[^0-9]/g, "")
  let id = "01"
  if (n.length === 10 && n.startsWith("0")) id = "0066" + n.substring(1)
  else if (n.length === 9) id = "0066" + n
  else if (n.length === 11 && n.startsWith("66")) id = "00" + n
  else if (n.length === 12 && n.startsWith("66")) id = "00" + n
  else if (n.length === 13 && n.startsWith("0066")) id = n
  else if (n.length === 13) { id = n; } else id = n
  let tag = "01"
  const inner = "0016A000000677010111"
  const acc = tag + String(id.length).padStart(2, "0") + id
  const a = "29" + String((inner + acc).length).padStart(2, "0") + inner + acc
  const f = "000201010211"
  const v = "5303764"
  const p = "54" + String(amount.toFixed(2).length).padStart(2, "0") + amount.toFixed(2)
  const base = f + a + v + p + "5802TH" + "6304"
  return base + crc16(base)
}
function mockKey(technical: string): string {
  const slug = (technical.split("/").pop() || technical).replace(/[^a-z0-9]/gi, "").slice(0, 6).toLowerCase()
  const rand = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
  return `sk-thai-${slug}-${rand}${Date.now().toString(36).slice(-4)}`
}

// QR จำลอง (วาด pattern จาก payload — ไม่ใช่ QR จริง ใช้แทนก่อนต่อ lib จริง)
function MockQR({ payload, size = 260 }: { payload: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    const n = 29
    const cell = Math.floor(size / n)
    const px = cell * n
    c.width = px
    c.height = px
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, px, px)
    let h = 0
    for (let i = 0; i < payload.length; i++) h = (h * 31 + payload.charCodeAt(i)) | 0
    const rnd = (s: number) => {
      const x = Math.sin(s * 12.9898 + h) * 43758.5453
      return x - Math.floor(x)
    }
    const finder = (fx: number, fy: number) => {
      ctx.fillStyle = "#000000"
      ctx.fillRect(fx * cell, fy * cell, 7 * cell, 7 * cell)
      ctx.fillStyle = "#ffffff"
      ctx.fillRect((fx + 1) * cell, (fy + 1) * cell, 5 * cell, 5 * cell)
      ctx.fillStyle = "#000000"
      ctx.fillRect((fx + 2) * cell, (fy + 2) * cell, 3 * cell, 3 * cell)
    }
    let k = 0
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const inF = (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8)
        if (inF) continue
        if (x === 6 || y === 6) {
          if ((x + y) % 2 === 0) { ctx.fillStyle = "#000000"; ctx.fillRect(x * cell, y * cell, cell, cell) }
          continue
        }
        if (rnd(k++) > 0.5) { ctx.fillStyle = "#000000"; ctx.fillRect(x * cell, y * cell, cell, cell) }
      }
    finder(0, 0)
    finder(n - 7, 0)
    finder(0, n - 7)
  }, [payload, size])
  return (
    <div className="bg-white rounded-[12px] p-2 flex items-center justify-center">
      <canvas ref={ref} style={{ width: `${size}px`, height: `${size}px` }} className="block" />
    </div>
  )
}

export default function MarketplacePage() {
  const router = useRouter()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : (params?.locale as string) || "th"
  const fontFamily = fontForLocale(locale)

  const [sel, setSel] = useState<MarketModel | null>(null)
  const [tab, setTab] = useState<"qr" | "card">("qr")
  const [key, setKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedCurl, setCopiedCurl] = useState(false)

  const payload = useMemo(() => (sel ? promptPayPayload("0812345678", sel.price) : ""), [sel])
  const curl = sel && key
    ? `curl https://api.vihok.ai/v1/chat/completions \\\n  -H "Authorization: Bearer ${key}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "${sel.technical}",\n    "messages": [{"role": "user", "content": "สวัสดี ช่วยสรุปเอกสารให้หน่อย"}]\n  }'`
    : ""

  const open = (m: MarketModel, t: "qr" | "card") => { setSel(m); setTab(t); setKey(null); setCopied(false); setCopiedCurl(false) }
  const pay = () => { if (sel) setKey(mockKey(sel.technical)) }

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100" style={{ fontFamily }}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.08),_transparent_60%),linear-gradient(to_bottom,_transparent,_rgba(0,0,0,0.4))] z-0" />
      <div className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-8 pt-8 pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <button onClick={() => router.push(`/${locale}`)} className="mb-4 flex items-center gap-2 text-[12px] text-zinc-400 hover:text-white">
              <ArrowLeft size={14} /> กลับไปแชท
            </button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center font-black tracking-tighter">V</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tracking-tight text-[15px]">VihokAI</span>
                  <span className="text-[10px] tracking-widest px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">MODEL MARKETPLACE</span>
                </div>
                <div className="text-[13px] text-zinc-400 -mt-0.5">เลือกโมเดลที่ใช่ จ่ายแยกได้</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
              <ShieldCheck size={14} /> ขายแยก ไม่ต้องเหมารวม
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Layers size={14} /> 5 โมเดล • จ่ายต่อเดือน
            </span>
          </div>
        </header>

        <div className="mb-8">
          <h1 className="text-[32px] md:text-[44px] font-bold leading-[0.95] tracking-tight">
            เลือกโมเดลที่ใช่<br /><span className="text-zinc-500">จ่ายแยกได้ ไม่ต้องเหมา</span>
          </h1>
          <p className="mt-4 text-[14px] md:text-[15px] leading-6 text-zinc-400 max-w-[560px]">
            VihokAI แยกขาย 5 โมเดลตามงานจริง — แชทไทยลื่นๆ เอา SIRI, งาน Agent เร็วๆ เอา Lightning, อ่านเอกสารยาวเอา 1M, งานโค้ดยากๆ เอา PRO 120B, Multimodal แรงๆ เอา Z Flash แต่ละตัวมีคีย์แยก ตัดบิลแยก
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {MODELS.map((mm) => {
            const Icon = mm.icon
            return (
              <div key={mm.id} className={`group relative flex flex-col rounded-[20px] bg-zinc-900/70 backdrop-blur border ${mm.accentBorder} overflow-hidden transition-all hover:-translate-y-1`}>
                <div className={`h-[4px] w-full bg-gradient-to-r ${mm.accentGradient}`} />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-8 w-8 rounded-lg bg-zinc-800 border ${mm.accentBorder} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${mm.accentText}`} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-mono tracking-widest text-zinc-500 leading-[1.2] line-clamp-2">{mm.subtitle}</span>
                        <span className="text-[11px] mt-1 inline-flex w-fit px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">{mm.badge}</span>
                      </div>
                    </div>
                    <Sparkles className={`w-4 h-4 ${mm.accentText} opacity-60 shrink-0`} />
                  </div>
                  <h3 className="text-[15px] font-semibold tracking-tight leading-[1.15] min-h-[40px]">{mm.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-[1.5] text-zinc-400 line-clamp-3 min-h-[56px]">{mm.desc}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-[28px] font-bold tracking-tight">฿{mm.price}</span>
                    <span className="text-[13px] text-zinc-400">บาท/เดือน</span>
                    <span className="ml-auto text-[11px] px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">{mm.pricePerM}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { l: "Context", v: mm.context, I: Database },
                      { l: "Speed", v: mm.speed, I: Timer },
                      { l: "Params", v: mm.params, I: Cpu },
                    ].map((s) => (
                      <div key={s.l} className="rounded-xl bg-zinc-800/70 border border-zinc-700/60 p-2.5">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase tracking-widest"><s.I size={12} /> {s.l}</div>
                        <div className="mt-1 text-[13px] font-medium">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-1.5">
                    {mm.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-[12px] text-zinc-300">
                        <Check size={14} className={mm.accentText} /><span className="leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {mm.bestFor.map((b) => (
                      <span key={b} className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 tracking-wide">{b}</span>
                    ))}
                  </div>
                  <div className="flex-1" />
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <button onClick={() => open(mm, "qr")} className="inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white text-black text-[13px] font-medium hover:bg-zinc-100 transition">
                      <QrCode size={16} /> จ่าย QR
                    </button>
                    <button onClick={() => open(mm, "card")} className="inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-zinc-800 border border-zinc-700 text-[13px] font-medium text-zinc-100 hover:bg-zinc-700 transition">
                      <CreditCard size={16} /> ตัดบัตร
                    </button>
                  </div>
                  <div className="mt-2 text-center text-[10px] text-zinc-500">PromptPay • Omise • ออกบิลได้</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 rounded-[20px] border border-zinc-800 bg-zinc-900/50 p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-zinc-400">
            <span className="text-zinc-200 font-medium">ทำไมต้องแยกขาย?</span>
            <span>• ไม่ต้องจ่ายรวม 999 เพื่อใช้แค่แชทไทย 499 พอ</span>
            <span>• แต่ละโมเดลได้ API Key แยกกัน ควบคุมงบได้</span>
            <span>• ยกเลิกแยกตัวได้ ไม่กระทบตัวอื่น</span>
          </div>
        </div>
        <footer className="mt-6 rounded-[16px] border border-zinc-800 bg-zinc-900/40 px-5 py-4">
          <p className="text-[11px] leading-[1.6] text-zinc-500 text-center md:text-left">
            Models served via Fireworks AI Serverless. NVIDIA®, DeepSeek®, OpenAI®, Z.ai® are trademarks of their respective owners. VihokAI is not affiliated with NVIDIA, DeepSeek, OpenAI, or Z.ai. All models licensed for commercial use. <span className="text-zinc-400">| ราคานี้รวม VAT แล้ว</span>
          </p>
        </footer>
      </div>

      {/* ===== โมดัลจ่ายเงิน ===== */}
      {sel && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSel(null)} />
          <div className="relative w-full md:max-w-[880px] max-h-[92vh] md:max-h-[88vh] rounded-t-[24px] md:rounded-[24px] bg-[#121214] border border-zinc-800 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${sel.accentGradient} flex items-center justify-center text-black`}>
                  <sel.icon size={20} className="text-black" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] md:text-[13px] font-semibold leading-tight line-clamp-1">{sel.title}</div>
                  <div className="text-[11px] text-zinc-500 mt-1 line-clamp-1">{sel.subtitle} • ฿{sel.price} บาท/เดือน • {sel.pricePerM}</div>
                </div>
              </div>
              <button onClick={() => setSel(null)} className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 pt-4 flex gap-2">
              <button onClick={() => setTab("qr")} className={`h-9 px-4 rounded-full text-[13px] font-medium border transition ${tab === "qr" ? "bg-white text-black border-white" : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"}`}>
                <span className="inline-flex items-center gap-1.5"><QrCode size={16} /> จ่าย QR PromptPay</span>
              </button>
              <button onClick={() => setTab("card")} className={`h-9 px-4 rounded-full text-[13px] font-medium border transition ${tab === "card" ? "bg-white text-black border-white" : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"}`}>
                <span className="inline-flex items-center gap-1.5"><CreditCard size={16} /> ตัดบัตร Omise</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 grid grid-cols-1 md:grid-cols-[380px_1fr] gap-6">
              <div className="space-y-4">
                {tab === "qr" ? (
                  <div className="rounded-[18px] bg-zinc-900 border border-zinc-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[13px] font-medium">สแกนจ่าย PromptPay</span>
                      <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">฿{sel.price} บาท</span>
                    </div>
                    <div className="rounded-[14px] bg-white p-3 flex items-center justify-center"><MockQR payload={payload} size={260} /></div>
                    <div className="mt-3 rounded-xl bg-zinc-800 border border-zinc-700 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">PromptPay Payload (เบอร์ mock — ต่อเบอร์ร้านจริงก่อนใช้งาน)</div>
                      <div className="font-mono text-[10px] leading-4 text-zinc-300 break-all">{payload}</div>
                    </div>
                    <button onClick={pay} className="mt-4 w-full h-11 rounded-xl bg-white text-black text-[14px] font-semibold hover:bg-zinc-100">ฉันจ่ายแล้ว • ออก API Key เลย</button>
                    <div className="mt-2 text-[11px] text-zinc-500 text-center">จำลองจ่ายสำเร็จ ระบบจะออกคีย์ทันทีสำหรับโมเดลนี้เท่านั้น</div>
                  </div>
                ) : (
                  <div className="rounded-[18px] bg-zinc-900 border border-zinc-800 p-4">
                    <div className="text-[13px] font-medium mb-3">ตัดบัตรผ่าน Omise (Mock)</div>
                    <div className="space-y-3">
                      <div><div className="text-[11px] text-zinc-500 mb-1">ชื่อบนบัตร</div><input placeholder="Somchai Vihok" className="w-full h-10 rounded-xl bg-zinc-800 border border-zinc-700 px-3 text-[13px] outline-none focus:border-zinc-500" /></div>
                      <div><div className="text-[11px] text-zinc-500 mb-1">เลขบัตร</div><input placeholder="4242 4242 4242 4242" className="w-full h-10 rounded-xl bg-zinc-800 border border-zinc-700 px-3 text-[13px] outline-none focus:border-zinc-500" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><div className="text-[11px] text-zinc-500 mb-1">หมดอายุ</div><input placeholder="12/28" className="w-full h-10 rounded-xl bg-zinc-800 border border-zinc-700 px-3 text-[13px] outline-none" /></div>
                        <div><div className="text-[11px] text-zinc-500 mb-1">CVC</div><input placeholder="123" className="w-full h-10 rounded-xl bg-zinc-800 border border-zinc-700 px-3 text-[13px] outline-none" /></div>
                      </div>
                    </div>
                    <button onClick={pay} className="mt-5 w-full h-11 rounded-xl bg-white text-black text-[14px] font-semibold hover:bg-zinc-100">จ่าย ฿{sel.price} บาท • เปิดใช้งาน</button>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500"><ShieldCheck size={14} /> จำลอง Omise Tokenization • ไม่มีการตัดเงินจริงในเดโม่</div>
                  </div>
                )}
                <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 text-[11px] leading-5 text-zinc-400">
                  <div className="font-medium text-zinc-200 mb-1">ขายแยกดียังไง?</div>
                  แยกคีย์ แยกบิล แยกโมเดล — ทีมแชทใช้ SIRI Thai 499, ทีม Agent ใช้ Lightning 599, ไม่ต้องจ่าย PRO 999 ทุกคน
                </div>
              </div>
              <div className="space-y-4">
                {!key ? (
                  <div className="rounded-[18px] border border-dashed border-zinc-700 bg-zinc-900/40 p-6 text-center">
                    <div className={`mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br ${sel.accentGradient} flex items-center justify-center`}><sel.icon size={24} className="text-black" /></div>
                    <div className="mt-4 text-[14px] font-medium">รอชำระเงินสำหรับ {sel.title}</div>
                    <div className="mt-2 text-[12px] text-zinc-500 leading-5">เมื่อกด “ฉันจ่ายแล้ว” ระบบจะออก API Key เฉพาะโมเดล {sel.subtitle} ให้ทันที ใช้แยกกับโมเดลอื่นได้</div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3"><div className="text-[10px] text-zinc-500">MODEL</div><div className="text-[11px] font-mono mt-1 leading-tight">{sel.subtitle}</div></div>
                      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3"><div className="text-[10px] text-zinc-500">PRICE</div><div className="text-[12px] font-medium mt-1">฿{sel.price} บาท/เดือน</div></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-[18px] bg-emerald-500/10 border border-emerald-500/20 p-4">
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-emerald-300"><Check size={16} /> ชำระสำเร็จ • Key พร้อมใช้</div>
                      <div className="mt-3 rounded-xl bg-zinc-950 border border-zinc-800 p-3 flex items-center justify-between gap-3">
                        <div className="font-mono text-[13px] break-all text-emerald-200">{key}</div>
                        <button onClick={() => { navigator.clipboard.writeText(key); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="shrink-0 h-8 px-3 rounded-full bg-zinc-800 border border-zinc-700 text-[12px] inline-flex items-center gap-1.5">
                          <Copy size={14} /> {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                        </button>
                      </div>
                      <div className="mt-2 text-[11px] text-emerald-300/70">คีย์นี้ใช้ได้เฉพาะ {sel.subtitle} เท่านั้น • แยกบิล แยกโควต้า</div>
                    </div>
                    <div className="rounded-[18px] bg-zinc-900 border border-zinc-800 overflow-hidden">
                      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                        <span className="text-[12px] font-medium">ตัวอย่างเรียก API</span>
                        <button onClick={() => { navigator.clipboard.writeText(curl); setCopiedCurl(true); setTimeout(() => setCopiedCurl(false), 1500) }} className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 inline-flex items-center gap-1">
                          <Copy size={12} /> {copiedCurl ? "คัดลอกแล้ว" : "คัดลอก curl"}
                        </button>
                      </div>
                      <pre className="p-4 text-[11px] leading-5 font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap break-words">{curl}</pre>
                    </div>
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-[11px] text-zinc-400 leading-5">
                      <div className="text-zinc-200 font-medium mb-1">ใช้งานแยกโมเดล</div>
                      แต่ละโมเดลออกคีย์ <span className="font-mono text-zinc-200">sk-thai-xxxx</span> แยกกัน
                    </div>
                  </div>
                )}
                <div className="rounded-[18px] bg-zinc-900 border border-zinc-800 p-4">
                  <div className="text-[12px] font-medium mb-3">เปรียบเทียบสั้นๆ</div>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between"><span className="text-zinc-500">SIRI Thai 32k</span><span className="text-zinc-200">ไทยลื่น • ถูก • แชทบอท</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Lightning 262k</span><span className="text-zinc-200">เร็ว 4x • Agent</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">1M Flash</span><span className="text-zinc-200">1M token • เอกสารยาว</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">PRO 120B</span><span className="text-zinc-200">ฉลาดสุด • โค้ดยาก</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Z Flash 200k</span><span className="text-zinc-200">ใหม่ 320B • Multimodal</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// app/[locale]/models/page.tsx
// หน้า "VihokAI Model" — อยู่ภายใต้เมนู AI Model
// แสดงโมเดลจริงที่ backend เรียกได้ (engine) + AI Team + ตารางเปรียบเทียบ
"use client"

import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  BrainCircuit,
  Code2,
  Cpu,
  FileSearch,
  Gauge,
  Globe2,
  Layers3,
  Sparkles,
  Zap,
  Check,
  Crown,
} from "lucide-react"
import { fontForLocale, modelCopyForLocale } from "@/components/locale"

// ===== โมเดลหลัก (engine ต้องตรงกับ backend/main.py ai_map) =====
const CORE_MODELS = [
  {
    id: "vihokai",
    name: "VihokAI 1.0",
    engine: "gpt-5-nano",
    icon: "👑",
    accent: "amber",
    badge: "SIRI",
    desc: "โมเดลหลักของแพลตฟอร์ม — ผู้ช่วยอัจฉริยะที่เข้าใจบริบทและตอบทุกภาษา",
    best: "งานทั่วไป · ผู้ช่วยส่วนตัว · หลายภาษา",
    speed: 3,
    quality: 4,
    cost: 1,
  },
  {
    id: "auto",
    name: "Auto",
    engine: "gpt-oss-120b · gpt-5-nano",
    icon: "◉",
    accent: "orange",
    badge: "SMART",
    desc: "เลือกโมเดลให้อัตโนมัติตามลักษณะคำถาม — เร็วและคุ้มค่าโดยไม่ต้องเลือกเอง",
    best: "ไม่แน่ใจว่าจะใช้ตัวไหน · งานผสม",
    speed: 4,
    quality: 4,
    cost: 2,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    engine: "gpt-5-nano",
    icon: "◉",
    accent: "emerald",
    desc: "ตอบเร็ว กระชับ เหมาะกับงานทั่วไปและการสนทนาต่อเนื่อง",
    best: "แชททั่วไป · สรุปสั้น · ไอเดียเร็ว",
    speed: 5,
    quality: 4,
    cost: 1,
  },
  {
    id: "gemini",
    name: "Gemini",
    engine: "gemini-3.1-flash-lite",
    icon: "✦",
    accent: "blue",
    desc: "สมดุลระหว่างความเร็วและคุณภาพ ทำงานกับข้อมูลปริมาณมากได้ดี",
    best: "วิเคราะห์ · ข้อมูลยาว · งานสมดุล",
    speed: 4,
    quality: 4,
    cost: 2,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    engine: "deepseek-flash",
    icon: "◈",
    accent: "indigo",
    badge: "V4.1 FLASH",
    desc: "ถนัดการคิดวิเคราะห์และงานเทคนิค ต้นทุนต่ำเมื่อเทียบกับคุณภาพ",
    best: "โค้ด · คณิต · วิเคราะห์เชิงลึก",
    speed: 3,
    quality: 5,
    cost: 1,
  },
  {
    id: "kimi",
    name: "Kimi",
    engine: "kimi-k3",
    icon: "∞",
    accent: "purple",
    desc: "เด่นด้านงานสร้างสรรค์และการเขียนเนื้อหายาวที่ต้องมีความต่อเนื่อง",
    best: "เขียนเนื้อหา · สร้างสรรค์ · งานยาว",
    speed: 3,
    quality: 4,
    cost: 2,
  },
  {
    id: "meta_ai",
    name: "Meta AI",
    engine: "gpt-oss-120b",
    icon: "◍",
    accent: "sky",
    badge: "NEW",
    desc: "โมเดลโอเพนซอร์สขนาดใหญ่ ผ่าน Groq — เร็วมากและตอบได้หลากหลาย",
    best: "งานเร็ว · โอเพนซอร์ส · งานทั่วไป",
    speed: 5,
    quality: 4,
    cost: 1,
  },
  {
    id: "claude",
    name: "Claude",
    engine: "claude-4",
    icon: "✦",
    accent: "red",
    desc: "ถนัดการอ่านและวิเคราะห์เอกสารยาว พร้อมเหตุผลที่ตรวจสอบได้",
    best: "เอกสารยาว · วิเคราะห์ · เขียนละเอียด",
    speed: 3,
    quality: 5,
    cost: 3,
  },
]

// ===== AI Team (บทบาทการทำงานแบบ Multi-Agent) =====
const AI_TEAM = [
  {
    role: "Orchestrator",
    name: "VihokAI 1.0",
    engine: "gpt-5-nano",
    icon: BrainCircuit,
    accent: "amber",
    desc: "แยกโจทย์ จัดทีม และรวมคำตอบสุดท้าย",
    status: "online",
  },
  {
    role: "Researcher",
    name: "Meta AI",
    engine: "gpt-oss-120b",
    icon: Globe2,
    accent: "sky",
    desc: "ค้นเว็บและรวบรวมข้อมูลล่าสุด",
    status: "online",
  },
  {
    role: "Coder",
    name: "DeepSeek",
    engine: "deepseek-flash",
    icon: Code2,
    accent: "indigo",
    desc: "เขียนโค้ด แก้บั๊ก และงานเทคนิค",
    status: "online",
  },
  {
    role: "Document AI",
    name: "Gemini",
    engine: "gemini-3.1-flash-lite",
    icon: FileSearch,
    accent: "blue",
    desc: "อ่านเอกสาร สรุป และสร้าง RAG context",
    status: "online",
  },
  {
    role: "Creative",
    name: "Kimi",
    engine: "kimi-k3",
    icon: Sparkles,
    accent: "purple",
    desc: "งานเขียนสร้างสรรค์และเนื้อหายาว",
    status: "online",
  },
  {
    role: "Analyst",
    name: "Claude",
    engine: "claude-4",
    icon: Gauge,
    accent: "red",
    desc: "ตรวจสอบเหตุผลและวิเคราะห์เชิงลึก",
    status: "standby",
  },
]

const ACCENTS: Record<string, { text: string; bg: string; border: string; ring: string }> = {
  amber: { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", ring: "ring-amber-500/40" },
  orange: { text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", ring: "ring-orange-500/40" },
  emerald: { text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", ring: "ring-emerald-500/40" },
  blue: { text: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", ring: "ring-blue-500/40" },
  indigo: { text: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/30", ring: "ring-indigo-500/40" },
  purple: { text: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", ring: "ring-purple-500/40" },
  sky: { text: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/30", ring: "ring-sky-500/40" },
  red: { text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", ring: "ring-red-500/40" },
}

function accentOf(key: string) {
  return ACCENTS[key] || ACCENTS.orange
}

/** แถบระดับ 1-5 */
function LevelBar({ value, accent }: { value: number; accent: string }) {
  const a = accentOf(accent)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-4 rounded-full ${i <= value ? a.text.replace("text-", "bg-") : "bg-slate-200 dark:bg-white/10"}`}
        />
      ))}
    </div>
  )
}

export default function VihokAIModelPage() {
  const router = useRouter()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : (params?.locale as string) || "th"

  const m = modelCopyForLocale(locale)
  const fontFamily = fontForLocale(locale)

  // กลับไปหน้าแชทพร้อมเลือกโมเดล (ใช้ query ?model= ให้หน้าแชทรับค่าได้)
  const useModel = (id: string) => {
    router.push(`/${locale}?model=${encodeURIComponent(id)}`)
  }

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0f0f0f] dark:text-white"
      style={{ fontFamily }}
    >
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-[#0f0f0f]/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <button
            onClick={() => router.push(`/${locale}`)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-orange-500 dark:text-white/50 dark:hover:text-orange-400"
          >
            <ArrowLeft size={17} />
            {m.back}
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-sm font-black text-white">
              V
            </div>
            <span className="text-sm font-black tracking-wide">
              VIHOK<span className="text-orange-500">AI</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        {/* ===== Hero ===== */}
        <section className="mb-12">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-10 bg-orange-500" />
            <span className="text-[11px] font-bold tracking-[0.3em] text-orange-500">{m.eyebrow}</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            {m.title}
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-500 dark:text-white/50">
            {m.subtitle}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => useModel("auto")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:scale-[1.02]"
            >
              <Layers3 size={17} />
              {m.useTeam}
            </button>
            <button
              onClick={() => useModel("vihokai")}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold transition hover:border-orange-400 hover:text-orange-500 dark:border-white/10 dark:hover:border-orange-400/50"
            >
              <Crown size={17} />
              VihokAI 1.0
            </button>
          </div>
        </section>

        {/* ===== Core Models ===== */}
        <section className="mb-14">
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Zap size={19} className="text-orange-500" />
              {m.coreTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-white/40">{m.coreSub}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_MODELS.map((model) => {
              const a = accentOf(model.accent)
              return (
                <div
                  key={model.id}
                  className={`group flex flex-col rounded-2xl border bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg dark:bg-[#1a1a1a] ${a.border}`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-bold ${a.bg} ${a.text}`}>
                      {model.icon}
                    </div>
                    {model.badge && (
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider ${a.bg} ${a.text}`}>
                        {model.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black">{model.name}</h3>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-400 dark:text-white/30">
                    {m.engine}: {model.engine}
                  </p>

                  <p className="mt-3 flex-1 text-[13px] leading-6 text-slate-500 dark:text-white/50">
                    {model.desc}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-white/5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 dark:text-white/35">{m.speed}</span>
                      <LevelBar value={model.speed} accent={model.accent} />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 dark:text-white/35">{m.quality}</span>
                      <LevelBar value={model.quality} accent={model.accent} />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 dark:text-white/35">{m.cost}</span>
                      <LevelBar value={model.cost} accent={model.accent} />
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] text-slate-400 dark:text-white/35">
                    <span className="font-semibold">{m.bestFor}:</span> {model.best}
                  </p>

                  <button
                    onClick={() => useModel(model.id)}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-[13px] font-bold transition ${a.border} ${a.text} hover:${a.bg}`}
                  >
                    <Check size={15} />
                    {m.useModel}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* ===== AI Team ===== */}
        <section className="mb-14">
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <BrainCircuit size={19} className="text-orange-500" />
              {m.teamTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-white/40">{m.teamSub}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AI_TEAM.map((agent) => {
              const a = accentOf(agent.accent)
              const Icon = agent.icon
              return (
                <div
                  key={agent.role}
                  className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-orange-300 dark:border-white/5 dark:bg-[#1a1a1a] dark:hover:border-orange-400/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.bg} ${a.text}`}>
                      <Icon size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold tracking-[0.15em] text-slate-400 dark:text-white/35">
                        {agent.role.toUpperCase()}
                      </p>
                      <p className="truncate text-sm font-black">{agent.name}</p>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        agent.status === "online"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-slate-400/10 text-slate-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          agent.status === "online" ? "animate-pulse bg-green-500" : "bg-slate-400"
                        }`}
                      />
                      {agent.status === "online" ? m.online : m.standby}
                    </span>
                  </div>

                  <p className="mt-3 text-[13px] leading-6 text-slate-500 dark:text-white/50">{agent.desc}</p>
                  <p className="mt-2 font-mono text-[10px] text-slate-400 dark:text-white/30">{agent.engine}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ===== Comparison Table ===== */}
        <section className="mb-14">
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Gauge size={19} className="text-orange-500" />
              {m.compareTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-white/40">{m.compareSub}</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/5">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 dark:bg-white/5 dark:text-white/35">
                <tr>
                  <th className="px-5 py-3 font-bold">{m.title}</th>
                  <th className="px-5 py-3 font-bold">{m.engine}</th>
                  <th className="px-5 py-3 font-bold">{m.speed}</th>
                  <th className="px-5 py-3 font-bold">{m.quality}</th>
                  <th className="px-5 py-3 font-bold">{m.cost}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {CORE_MODELS.map((model) => {
                  const a = accentOf(model.accent)
                  return (
                    <tr key={model.id} className="bg-white transition hover:bg-slate-50 dark:bg-[#1a1a1a] dark:hover:bg-white/5">
                      <td className="px-5 py-3">
                        <span className={`mr-2 font-bold ${a.text}`}>{model.icon}</span>
                        <span className="font-semibold">{model.name}</span>
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-400 dark:text-white/35">{model.engine}</td>
                      <td className="px-5 py-3"><LevelBar value={model.speed} accent={model.accent} /></td>
                      <td className="px-5 py-3"><LevelBar value={model.quality} accent={model.accent} /></td>
                      <td className="px-5 py-3"><LevelBar value={model.cost} accent={model.accent} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-slate-400 dark:text-white/30">
            <Cpu size={13} className="mt-0.5 shrink-0" />
            {m.note}
          </p>
        </section>
      </main>
    </div>
  )
}

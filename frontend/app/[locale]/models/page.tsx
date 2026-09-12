// app/[locale]/models/page.tsx — VihokAI 1.0 Kola (ดึงจาก Vihokai-v1kola/app/page.tsx แล้วต่อยอด)
// โครงตาม sitemap: Home / Features(5) / AI Models(6) / AI Team(5) / Pricing / Dashboard / Login-GetStarted
// AI_MODELS / AI_TEAM ทั้งหมดต้องมี id ที่ backend ai_map รู้จัก — ดู backend/main.py (platform + live sync กัน)
"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowRight,
  ArrowLeft,
  Bot,
  BrainCircuit,
  ChevronRight,
  Code2,
  Cpu,
  FileSearch,
  Gauge,
  Globe2,
  Layers3,
  Menu,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
  Zap,
} from "lucide-react"
import { fontForLocale, modelCopyForLocale, kolaCopyForLocale } from "@/components/locale"

// รูป Kola — copy จาก Vihokai-v1kola/public/ มาไว้ที่ frontend/public/ แล้ว
const IMG = { hero: "/kola-hero.png", prime: "/kola-prime.png", swift: "/kola-swift.png" }

export default function VihokAIModelPage() {
  const router = useRouter()
  const params = useParams()
  const locale = Array.isArray(params?.locale) ? params.locale[0] : (params?.locale as string) || "th"
  const [mobileOpen, setMobileOpen] = useState(false)

  const m = modelCopyForLocale(locale)
  const k = kolaCopyForLocale(locale)
  const fontFamily = fontForLocale(locale)

  const useModel = (id: string) => {
    router.push(`/${locale}?model=${encodeURIComponent(id)}`)
  }
  const goDash = () => router.push(`/${locale}`)
  const goAuth = (mode?: string) => router.push(`/auth${mode ? `?mode=${mode}` : ""}`)

  // ===== Features (5 ตาม sitemap — ไม่มี Reasoning แยก เพราะรวมใน Multi-AI แล้ว) =====
  const features = [
    { icon: BrainCircuit, title: "Multi-AI", subtitle: k.fMultiSub },
    { icon: Search, title: "Web Search", subtitle: k.fSearchSub },
    { icon: FileSearch, title: "RAG / Knowledge Base", subtitle: k.fRagSub },
    { icon: Code2, title: "Coding", subtitle: k.fCodeSub },
    { icon: Zap, title: "Automation", subtitle: k.fAutoSub },
  ]

  // ===== AI Models (6 ตาม sitemap — id ต้องมีใน backend ai_map) =====
  const models = [
    { id: "kola_prime", type: "PRIME", title: "Kola Prime", subtitle: "AI COMMANDER", image: IMG.prime, color: "cyan" as const, desc: k.primeDesc, items: k.primeItems, cta: k.usePrime },
    { id: "kola_swift", type: "SWIFT", title: "Kola Swift", subtitle: "FAST AI ASSISTANT", image: IMG.swift, color: "orange" as const, desc: k.swiftDesc, items: k.swiftItems, cta: k.useSwift },
  ]

  // engine จริงของแต่ละโมเดลย่อย (ต้องตรงกับ backend ai_map)
  const lineup = [
    { id: "spark", name: "Muse Spark 1.3", engine: "gpt-oss-120b", tag: "ORCHESTRATOR", icon: BrainCircuit, desc: k.sparkDesc, color: "cyan" as const },
    { id: "deepseek", name: "DeepSeek V4", engine: "deepseek-flash", tag: "CODER", icon: Code2, desc: k.deepDesc, color: "purple" as const },
    { id: "qwen", name: "Qwen3 8B", engine: "qwen/qwen3.8-27b", tag: "DOCUMENT AI", icon: FileSearch, desc: k.qwenDesc, color: "green" as const },
  ]

  // ===== AI Team (5 ตาม sitemap — name/engine ตรงกับ lineup ข้างบน) =====
  const team = [
    { role: "Orchestrator", name: "Muse Spark 1.3", model: "ORCHESTRATOR · JUDGE · MEMORY", desc: k.dOrch, icon: BrainCircuit, status: "ONLINE", color: "cyan" as const },
    { role: "Researcher", name: "Compound Mini", model: "RESEARCHER", desc: k.dRes, icon: Globe2, status: "READY", color: "blue" as const },
    { role: "Coder", name: "DeepSeek V4", model: "CODER", desc: k.dCoder, icon: Code2, status: "READY", color: "purple" as const },
    { role: "Document AI", name: "Qwen3 8B", model: "DOCUMENT AI", desc: k.dDoc, icon: FileSearch, status: "READY", color: "green" as const },
    { role: "Memory & Context", name: "Kola Memory", model: "MEMORY & CONTEXT", desc: k.dMem, icon: Cpu, status: "ONLINE", color: "orange" as const },
  ]

  const nav = [
    { label: "Home", href: "#home" },
    { label: k.navFeatures, href: "#features" },
    { label: k.navTeam, href: "#ai-team" },
    { label: k.navPricing, href: "#pricing" },
    { label: k.navDashboard, href: "#dashboard" },
  ]

  return (
    <main className="min-h-screen overflow-hidden bg-[#020817] text-white" style={{ fontFamily }}>
      {/* background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 top-0 h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="absolute right-0 top-[800px] h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[140px]" />
      </div>

      {/* ===== NAVBAR ===== */}
      <nav className="relative z-50 border-b border-white/10 bg-[#020817]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1450px] items-center justify-between px-6">
          <button onClick={goDash} className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div className="absolute inset-0 rounded-xl bg-cyan-400/20 blur-md" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/50 bg-[#06152b]">
                <span className="text-xl font-black italic text-cyan-400">V</span>
              </div>
            </div>
            <div className="text-left">
              <div className="text-xl font-black tracking-[0.12em]">VIHOK<span className="text-cyan-400">AI</span></div>
              <div className="text-[9px] font-medium tracking-[0.35em] text-slate-500">INTELLIGENCE SYSTEM</div>
            </div>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            {nav.map((item, i) => (
              <a key={item.label} href={item.href} className={`text-sm transition ${i === 0 ? "text-cyan-400" : "text-slate-300 hover:text-white"}`}>
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button onClick={() => goAuth()} className="rounded-xl px-5 py-2.5 text-sm text-slate-300 hover:text-white">{k.login}</button>
            <button onClick={() => goAuth("register")} className="group flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300">
              {k.getStarted}<ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </button>
          </div>

          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="menu">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 bg-[#020817] p-6 md:hidden">
            <div className="flex flex-col gap-5">
              {nav.map((item) => (
                <a key={item.label} href={item.href} onClick={() => setMobileOpen(false)} className="text-slate-300">{item.label}</a>
              ))}
              <button onClick={() => goAuth("register")} className="rounded-xl bg-cyan-400 py-3 font-bold text-slate-950">{k.getStarted}</button>
            </div>
          </div>
        )}
      </nav>

      {/* ===== HERO (Home) ===== */}
      <section id="home" className="relative z-10 min-h-[720px] overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMG.hero} alt="VihokAI 1.0 Kola AI robotic bird" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020817] via-[#020817]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-[#020817]/30" />
        </div>

        <div className="relative mx-auto flex min-h-[720px] max-w-[1450px] items-center px-6">
          <div className="max-w-[650px] pt-16">
            <button onClick={goDash} className="mb-6 flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-slate-400 transition hover:text-cyan-300">
              <ArrowLeft size={14} /> {m.back}
            </button>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-10 bg-cyan-400" />
              <span className="text-xs font-bold tracking-[0.3em] text-cyan-300">{k.heroBadge}</span>
            </div>

            <h1 className="leading-[0.85]">
              <span className="block text-5xl font-black tracking-tight text-white sm:text-7xl lg:text-8xl">VIHOKAI</span>
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-white bg-clip-text text-5xl font-black italic tracking-tight text-transparent sm:text-7xl lg:text-8xl">1.0</span>
              <span className="mt-2 block text-6xl font-black italic tracking-tight text-orange-400 drop-shadow-[0_0_30px_rgba(251,146,60,0.3)] sm:text-8xl lg:text-9xl">KOLA</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-200">{k.heroDesc}</p>

            <div className="mt-9 flex flex-wrap gap-4">
              <button onClick={() => useModel("kola_prime")} className="group flex items-center gap-3 rounded-2xl bg-cyan-400 px-7 py-4 font-bold text-slate-950 shadow-[0_0_45px_rgba(34,211,238,0.3)] transition hover:-translate-y-1 hover:bg-cyan-300">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-cyan-400"><Play size={13} fill="currentColor" /></span>
                {k.ctaStart}<ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </button>
              <button onClick={() => document.getElementById("ai-team")?.scrollIntoView({ behavior: "smooth" })} className="flex items-center gap-2 rounded-2xl border border-cyan-400/60 bg-slate-950/30 px-7 py-4 font-bold text-white backdrop-blur-md transition hover:border-cyan-300 hover:bg-cyan-400/10">
                <Bot size={18} />{k.ctaTeam}
              </button>
            </div>

            <div className="mt-8 flex items-center gap-3 text-sm text-slate-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
              </span>
              {k.onlineNow}
            </div>
          </div>
        </div>

        {/* FEATURE BAR — 5 features ตาม sitemap */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#020817]/80 backdrop-blur-xl">
          <div className="mx-auto grid max-w-[1450px] grid-cols-2 divide-x divide-white/10 sm:grid-cols-3 lg:grid-cols-5">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="flex items-center gap-3 px-5 py-4">
                  <Icon size={20} className="shrink-0 text-cyan-400" />
                  <div><div className="text-sm font-bold">{f.title}</div><div className="text-[10px] text-slate-500">{f.subtitle}</div></div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== AI MODELS: Kola Prime + Kola Swift ===== */}
      <section id="features" className="relative z-10 border-b border-white/10 bg-[#031126] py-24">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mb-12 text-center">
            <div className="mb-3 text-xs font-bold tracking-[0.35em] text-cyan-400">TWO AI FORMS</div>
            <h2 className="text-4xl font-black md:text-5xl">{k.formsTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">{k.formsSub}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {models.map((card) => (
              <div key={card.id} className={`group overflow-hidden rounded-3xl border ${card.color === "cyan" ? "border-cyan-400/30" : "border-orange-400/30"} bg-[#06152b]`}>
                <div className="grid md:grid-cols-2">
                  <div className="relative min-h-[330px] overflow-hidden">
                    <img src={card.image} alt={card.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent" />
                    <div className={`absolute left-5 top-5 rounded-full border px-3 py-1 text-[10px] font-black tracking-[0.2em] ${card.color === "cyan" ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-300" : "border-orange-400/60 bg-orange-400/10 text-orange-300"}`}>
                      {card.type}
                    </div>
                  </div>
                  <div className="p-7">
                    <div className="text-xs font-bold tracking-[0.2em] text-slate-500">{card.subtitle}</div>
                    <h3 className="mt-2 text-3xl font-black">{card.title}</h3>
                    <p className="mt-5 leading-7 text-slate-400">{card.desc}</p>
                    <div className="mt-6 space-y-3">
                      {card.items.map((item) => (
                        <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full ${card.color === "cyan" ? "bg-cyan-400/10 text-cyan-400" : "bg-orange-400/10 text-orange-400"}`}>
                            <ChevronRight size={13} />
                          </div>
                          {item}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => useModel(card.id)} className={`mt-7 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition ${card.color === "cyan" ? "border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10" : "border-orange-400/40 text-orange-300 hover:bg-orange-400/10"}`}>
                      {card.cta}<ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ===== AI Models lineup (6 ตาม sitemap) + Model Comparison ===== */}
          <div className="mt-16">
            <div className="mb-8 text-center">
              <div className="mb-3 text-xs font-bold tracking-[0.35em] text-cyan-400">{k.lineupTitle.toUpperCase()}</div>
              <h3 className="text-3xl font-black">{k.lineupTitle}</h3>
              <p className="mx-auto mt-3 max-w-2xl text-slate-400">{k.lineupSub}</p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {lineup.map((l) => {
                const Icon = l.icon
                const colorCls = l.color === "cyan" ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300" : l.color === "purple" ? "border-purple-400/40 bg-purple-400/10 text-purple-300" : "border-green-400/40 bg-green-400/10 text-green-300"
                return (
                  <div key={l.id} className="group rounded-2xl border border-white/10 bg-[#06152b] p-6 transition hover:-translate-y-1 hover:border-cyan-400/30">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${colorCls}`}><Icon size={22} /></div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] text-slate-500">{l.tag}</div>
                        <div className="mt-1 font-black">{l.name}</div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-400">{l.desc}</p>
                    <p className="mt-3 font-mono text-[10px] text-slate-500">engine: {l.engine}</p>
                    <button onClick={() => useModel(l.id)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/40 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/10">
                      {m.useModel}<ArrowRight size={15} />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Model Comparison — ตารางเทียบ */}
            <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[680px] text-left text-[13px]">
                <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-bold">{k.lineupTitle}</th>
                    <th className="px-5 py-3 font-bold">{m.engine}</th>
                    <th className="px-5 py-3 font-bold">{m.speed}</th>
                    <th className="px-5 py-3 font-bold">{m.quality}</th>
                    <th className="px-5 py-3 font-bold">{m.cost}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { id: "kola_prime", name: "Kola Prime", engine: "gpt-5-nano · gpt-oss-120b", speed: 3, quality: 5, cost: 3 },
                    { id: "kola_swift", name: "Kola Swift", engine: "gpt-oss-120b", speed: 5, quality: 3, cost: 1 },
                    { id: "spark", name: "Muse Spark 1.3", engine: "gpt-oss-120b", speed: 5, quality: 4, cost: 1 },
                    { id: "deepseek", name: "DeepSeek V4", engine: "deepseek-flash", speed: 3, quality: 5, cost: 1 },
                    { id: "qwen", name: "Qwen3 8B", engine: "qwen/qwen3.8-27b", speed: 4, quality: 4, cost: 1 },
                  ].map((row) => (
                    <tr key={row.id} className="bg-[#06152b] transition hover:bg-white/5">
                      <td className="px-5 py-3">
                        <button onClick={() => useModel(row.id)} className="font-semibold text-cyan-300 hover:text-cyan-200">{row.name}</button>
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-400">{row.engine}</td>
                      <td className="px-5 py-3"><LevelBar value={row.speed} /></td>
                      <td className="px-5 py-3"><LevelBar value={row.quality} /></td>
                      <td className="px-5 py-3"><LevelBar value={row.cost} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ===== AI TEAM (5 ตาม sitemap) ===== */}
      <section id="ai-team" className="relative z-10 overflow-hidden bg-[#020817] py-24">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="mb-3 text-xs font-bold tracking-[0.35em] text-cyan-400">{k.teamEyebrow}</div>
              <h2 className="text-4xl font-black leading-tight md:text-5xl">{k.teamHeadA}<br /><span className="text-cyan-400">{k.teamHeadB}</span></h2>
              <p className="mt-6 max-w-lg leading-8 text-slate-400">{k.teamDesc}</p>
              <button onClick={goDash} className="mt-8 flex items-center gap-2 rounded-xl border border-cyan-400/40 px-5 py-3 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/10">
                {k.teamCta}<ChevronRight size={17} />
              </button>
            </div>

            <div className="relative">
              <div className="absolute left-1/2 top-[105px] hidden h-[250px] w-px -translate-x-1/2 bg-gradient-to-b from-cyan-400 via-blue-500 to-transparent md:block" />
              <div className="relative grid gap-4 sm:grid-cols-2">
                {team.map((member, index) => {
                  const Icon = member.icon
                  const isLeader = index === 0
                  const colorCls = member.color === "cyan" ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300" : member.color === "purple" ? "border-purple-400/40 bg-purple-400/10 text-purple-300" : member.color === "green" ? "border-green-400/40 bg-green-400/10 text-green-300" : member.color === "orange" ? "border-orange-400/40 bg-orange-400/10 text-orange-300" : "border-blue-400/40 bg-blue-400/10 text-blue-300"
                  return (
                    <div key={member.role} className={`group relative rounded-2xl border bg-[#06152b]/90 p-5 backdrop-blur-xl transition hover:-translate-y-1 ${isLeader ? "border-cyan-400/60 shadow-[0_0_40px_rgba(34,211,238,0.12)] sm:col-span-2" : "border-white/10 hover:border-cyan-400/30"}`}>
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${colorCls}`}><Icon size={23} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[10px] font-bold tracking-[0.2em] text-slate-500">{member.model}</div>
                              <h3 className="mt-1 text-lg font-black">{member.name}</h3>
                            </div>
                            <span className="flex items-center gap-1.5 text-[9px] font-bold text-green-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />{member.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-400">{member.role} • {member.desc}</p>
                        </div>
                      </div>
                      {isLeader && (
                        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                          <span className="rounded-lg bg-cyan-400/10 px-3 py-1.5 text-[10px] font-bold text-cyan-300">ORCHESTRATOR</span>
                          <span className="rounded-lg bg-blue-400/10 px-3 py-1.5 text-[10px] font-bold text-blue-300">JUDGE</span>
                          <span className="rounded-lg bg-purple-400/10 px-3 py-1.5 text-[10px] font-bold text-purple-300">MEMORY</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING (3 tiers — ปุ่ม Pro/Team disabled ตาม landing จริง) ===== */}
      <section id="pricing" className="relative z-10 bg-[#020817] py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 text-xs font-bold tracking-[0.35em] text-cyan-400">PRICING</div>
            <h2 className="text-4xl font-black md:text-5xl">{k.priceTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">{k.priceSub}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <PriceCard name="Free" price={k.freePrice} per={k.perMonth} feats={k.freeFeat} cta={k.freeCta} enabled onCta={() => goAuth("register")} />
            <PriceCard name="Pro" price={k.proPrice} per={k.perMonth} feats={k.proFeat} cta={k.comingSoon} enabled={false} />
            <PriceCard name="Team" price={k.teamPrice} per={k.perMonth} feats={k.teamFeat} cta={k.comingSoon} enabled={false} />
          </div>
        </div>
      </section>

      {/* ===== DASHBOARD (Mission Control preview) ===== */}
      <section id="dashboard" className="relative z-10 border-y border-white/10 bg-[#031126] py-24">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 text-xs font-bold tracking-[0.3em] text-cyan-400">REAL-TIME MISSION CONTROL</div>
              <h2 className="text-4xl font-black md:text-5xl">{k.missionTitle}</h2>
              <p className="mt-3 max-w-2xl text-slate-400">{k.missionSub}</p>
            </div>
            <button onClick={goDash} className="group flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
              {k.openDash}<ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </button>
          </div>

          <div className="grid overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#020817] shadow-[0_0_80px_rgba(34,211,238,0.05)] lg:grid-cols-[1fr_360px]">
            <div className="min-h-[430px] p-6 md:p-10">
              <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
                <div className="flex items-center gap-3"><Terminal size={18} className="text-cyan-400" /><span className="text-sm font-bold">KOLA / MISSION-001</span></div>
                <span className="rounded-full bg-green-400/10 px-3 py-1 text-[10px] font-bold text-green-400">{k.running}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="text-xs text-slate-500">USER REQUEST</div>
                <div className="mt-2 font-medium text-slate-200">PDF + API + market</div>
              </div>
              <div className="mt-8 space-y-4">
                <MissionStep number="01" title="Muse Spark 1.3" desc={k.dOrch} status="done" />
                <MissionStep number="02" title="Compound Mini" desc={k.dRes} status="run" />
                <MissionStep number="03" title="Qwen3 8B" desc={k.dDoc} status="run" />
                <MissionStep number="04" title="DeepSeek V4" desc={k.dCoder} status="wait" />
                <MissionStep number="05" title="Kola Judge" desc={k.dOrch} status="wait" />
              </div>
            </div>
            <div className="border-t border-white/10 bg-white/[0.015] p-6 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between"><div className="font-bold">{k.sysStatus}</div><Gauge size={18} className="text-cyan-400" /></div>
              <div className="mt-6 space-y-3">
                <StatusRow label="AI Agents" value="4 / 4" />
                <StatusRow label="Tasks" value="3 / 5" />
                <StatusRow label="Memory" value="ONLINE" />
                <StatusRow label="RAG" value="ACTIVE" />
                <StatusRow label="Search" value="ACTIVE" />
              </div>
              <div className="mt-8">
                <div className="mb-2 flex justify-between text-xs"><span className="text-slate-500">{k.progress}</span><span className="text-cyan-400">60%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[60%] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" /></div>
              </div>
              <div className="mt-8 rounded-2xl border border-orange-400/20 bg-orange-400/5 p-5">
                <div className="text-xs text-slate-500">ESTIMATED AI COST</div>
                <div className="mt-1 text-3xl font-black text-orange-400">$0.0049</div>
                <div className="mt-1 text-xs text-slate-500">per mission estimate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA (Login / Get Started) + value cards ===== */}
      <section className="relative z-10 overflow-hidden border-t border-cyan-400/10 bg-[#031126] py-28">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/5 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mx-auto mb-6 grid max-w-3xl gap-5 text-left md:grid-cols-3">
            <ValueCard icon={Zap} title={m.fast} value="Multi-AI" desc={k.sparkDesc} />
            <ValueCard icon={ShieldCheck} title={m.cost} value="Smart Routing" desc={k.swiftDesc} />
            <ValueCard icon={Layers3} title={m.balanced} value="One Platform" desc="Search • RAG • Coding • AI" />
          </div>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_40px_rgba(34,211,238,0.15)]"><Bot size={32} /></div>
          <div className="text-xs font-bold tracking-[0.35em] text-cyan-400">YOUR AI COMMANDER</div>
          <h2 className="mt-5 text-4xl font-black md:text-6xl">{k.ctaTitle}</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-400">{k.ctaSub}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <button onClick={() => goAuth("register")} className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-4 font-black text-slate-950 shadow-[0_0_50px_rgba(34,211,238,0.25)] transition hover:-translate-y-1">
              {k.getStarted}<ArrowRight size={19} className="transition group-hover:translate-x-1" />
            </button>
            <button onClick={() => goAuth()} className="inline-flex items-center gap-3 rounded-2xl border border-cyan-400/40 px-8 py-4 font-black text-cyan-300 transition hover:bg-cyan-400/10">
              {k.login}
            </button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-[#010611]">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-5 px-6 py-8 md:flex-row">
          <div>
            <div className="font-black tracking-[0.15em]">VIHOK<span className="text-cyan-400">AI</span><span className="ml-2 text-slate-600">1.0 | KOLA</span></div>
            <div className="mt-1 text-[10px] tracking-[0.2em] text-slate-600">AI TEAM • REAL WORK • REAL VALUE</div>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-600"><span>Privacy</span><span>Terms</span><span>Security</span></div>
        </div>
      </footer>
    </main>
  )
}

// ===== components ย่อย (port จาก Vihokai-v1kola) =====
function LevelBar({ value }: { value: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-1.5 w-4 rounded-full ${i <= value ? "bg-cyan-400" : "bg-white/10"}`} />
      ))}
    </div>
  )
}

function MissionStep({ number, title, desc, status }: { number: string; title: string; desc: string; status: "done" | "run" | "wait" }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs font-bold text-slate-500">{number}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold">{title}</span>
          {status === "run" && <span className="rounded bg-cyan-400/10 px-2 py-0.5 text-[9px] font-bold text-cyan-400">RUNNING</span>}
          {status === "done" && <span className="rounded bg-green-400/10 px-2 py-0.5 text-[9px] font-bold text-green-400">DONE</span>}
        </div>
        <div className="mt-1 text-xs text-slate-500">{desc}</div>
      </div>
      <div className={`h-2 w-2 rounded-full ${status === "done" ? "bg-green-400" : status === "run" ? "animate-pulse bg-cyan-400" : "bg-slate-700"}`} />
    </div>
  )
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-bold text-cyan-300">{value}</span>
    </div>
  )
}

function PriceCard({ name, price, per, feats, cta, enabled, onCta }: { name: string; price: string; per: string; feats: string[]; cta: string; enabled: boolean; onCta?: () => void }) {
  return (
    <div className={`rounded-2xl border p-6 transition ${enabled ? "border-cyan-400/40 bg-[#06152b] hover:-translate-y-1" : "border-white/10 bg-[#06152b] opacity-80"}`}>
      <div className="text-sm font-bold text-slate-300">{name}</div>
      <div className="mt-2 text-4xl font-black">{price}<span className="ml-1 text-sm font-medium text-slate-500">{per}</span></div>
      <div className="mt-5 space-y-2.5">
        {feats.map((f) => (
          <div key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-[10px] font-bold text-cyan-400">✓</span>{f}
          </div>
        ))}
      </div>
      <button disabled={!enabled} onClick={onCta} className={`mt-6 w-full rounded-xl py-3 text-sm font-bold transition ${enabled ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300" : "cursor-not-allowed border border-white/10 text-slate-500"}`}>
        {cta}
      </button>
    </div>
  )
}

function ValueCard({ icon: Icon, title, value, desc }: { icon: any; title: string; value: string; desc: string }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-[#06152b] p-6 transition hover:-translate-y-1 hover:border-cyan-400/30">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400"><Icon size={22} /></div>
        <div><div className="text-xs text-slate-500">{title}</div><div className="mt-1 font-black">{value}</div></div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{desc}</p>
    </div>
  )
}

"use client";
import Link from "next/link";
import { ViHokLogo } from "@/components/Logo";
import { getToken } from "@/lib/api";
import { UI_LOCALES, useUILocale } from "@/lib/locale";
import { HOME_COPY } from "@/lib/home-copy";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [locale, setLocale] = useUILocale()
  useEffect(() => { setLoggedIn(!!getToken()) }, [])
  const t = HOME_COPY[locale]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <ViHokLogo />
        <div className="flex gap-3 text-sm items-center">
          {/* ตัวเลือกภาษา — ค่าเดียวกับเพจภายใน (localStorage vihok_locale) */}
          <div className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1">
            {UI_LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code)}
                title={l.name}
                className={`rounded-full px-2 py-1 text-sm transition ${
                  locale === l.code ? "bg-white text-black font-bold" : "opacity-60 hover:opacity-100"
                }`}
              >
                {l.flag}
              </button>
            ))}
          </div>
          <Link href="/changelog" className="text-zinc-400 hover:text-white hidden sm:inline">Changelog</Link>
          <Link href="/roadmap" className="text-zinc-400 hover:text-white hidden sm:inline">Roadmap</Link>
          {loggedIn ? (
            <Link href="/th" className="px-4 py-2 rounded-full bg-white text-black font-bold">{t.enterChat}</Link>
          ) : (
            <>
              <Link href="/auth" className="text-zinc-300 hover:text-white font-semibold">{t.loginNav}</Link>
              <Link href="/auth?mode=register" className="px-4 py-2 rounded-full bg-white text-black font-bold">{t.signupNav}</Link>
            </>
          )}
        </div>
      </nav>

      <section className="text-center py-20 px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300 mb-6">
          <span>🦅</span> {t.badge}
        </div>
        <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-[0.9]">
          {t.h1a}<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-cyan-400 to-white">{t.h1b}</span>
        </h1>
        <p className="mt-6 text-xl text-zinc-400 max-w-2xl mx-auto">
          ViHok AI {t.sub1} <span className="text-white font-bold">{t.sub2}</span> {t.sub3}<br/>
          {t.sub4}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/th" className="px-8 py-4 rounded-2xl bg-white text-black font-bold text-lg">{t.ctaFree}</Link>
          <Link href="#how" className="px-8 py-4 rounded-2xl bg-zinc-900 border border-zinc-800">{t.ctaHow}</Link>
        </div>
        <p className="mt-3 text-sm font-semibold text-yellow-300">{t.freeNote}</p>
        <p className="mt-2 text-sm text-zinc-500">{t.noAccount} <Link href="/auth?mode=register" className="text-white font-semibold hover:underline">{t.signupFree}</Link> · {t.hasAccount} <Link href="/auth" className="text-white font-semibold hover:underline">{t.login}</Link></p>

        <div className="mt-16 mx-auto max-w-5xl rounded-[32px] border border-zinc-800 bg-zinc-900/50 p-3 shadow-2xl">
          <div className="rounded-[20px] bg-black p-4 aspect-[16/9] flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🦅 x 5</div>
              <p className="text-zinc-500 text-sm">5 การ์ด AI เด้งพร้อมกัน 2วิ + Best Answer 1วิ</p>
              <p className="text-xs text-zinc-600 mt-2">vihokai.com - Soar Above</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="py-20 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {[
          {icon:"🦅", title:t.feat1t, desc:t.feat1d},
          {icon:"⚡️", title:t.feat2t, desc:t.feat2d},
          {icon:"👑", title:t.feat3t, desc:t.feat3d},
        ].map(c=>(
          <div key={c.title} className="p-8 rounded-[24px] bg-zinc-900 border border-zinc-800">
            <div className="text-3xl mb-4">{c.icon}</div>
            <h3 className="font-bold text-lg">{c.title}</h3>
            <p className="text-sm text-zinc-400 mt-2">{c.desc}</p>
          </div>
        ))}
      </section>

      <section id="pricing" className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center">{t.pricingH}</h2>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {/* แผนฟรี — 55 ครั้ง รีเซ็ตทุก 6 ชม. (โปรโมท) */}
          <div className="rounded-[24px] p-8 border bg-zinc-900 border-zinc-800">
            <h3 className="text-xl font-bold">{t.freeName}</h3>
            <p className="text-xs opacity-60">{t.freeSub}</p>
            <div className="mt-4 flex items-baseline gap-2"><span className="text-4xl font-black">$0</span><span className="opacity-60">{t.perMo}</span></div>
            <p className="text-sm opacity-60 mt-1">55 credits</p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ {t.freeF1}</li>
              <li>✓ {t.freeF2}</li>
              <li>✓ {t.freeF3}</li>
            </ul>
            <Link href="/th" className="mt-8 block text-center w-full py-3 rounded-xl font-bold bg-white text-black">{t.freeCta}</Link>
          </div>
          {/* Pro — รอ Kola / Wari ติดตั้ง */}
          <div className="rounded-[24px] p-8 border bg-white text-black scale-105">
            <div className="text-xs font-bold bg-black text-white inline-block px-3 py-1 rounded-full mb-4">{t.proBadge}</div>
            <h3 className="text-xl font-bold">{t.proName}</h3>
            <p className="text-xs opacity-60">{t.proSub}</p>
            <div className="mt-4 flex items-baseline gap-2"><span className="text-4xl font-black">$20</span><span className="opacity-60">{t.perMo}</span></div>
            <p className="text-sm opacity-60 mt-1">500 credits</p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ {t.proF1}</li>
              <li>✓ {t.proF2}</li>
              <li>✓ {t.proF3}</li>
              <li>✓ {t.proF4}</li>
            </ul>
            <button disabled className="mt-8 block text-center w-full py-3 rounded-xl font-bold bg-black text-white opacity-60 cursor-not-allowed">{t.proCta}</button>
          </div>
          {/* Team — รอ Kola / Wari ติดตั้ง */}
          <div className="rounded-[24px] p-8 border bg-zinc-900 border-zinc-800 opacity-80">
            <h3 className="text-xl font-bold">{t.teamName}</h3>
            <p className="text-xs opacity-60">{t.teamSub}</p>
            <div className="mt-4 flex items-baseline gap-2"><span className="text-4xl font-black">$49</span><span className="opacity-60">{t.perMo}</span></div>
            <p className="text-sm opacity-60 mt-1">2000 credits</p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ {t.teamF1}</li>
              <li>✓ {t.teamF2}</li>
              <li>✓ {t.teamF3}</li>
            </ul>
            <button disabled className="mt-8 block text-center w-full py-3 rounded-xl font-bold bg-zinc-800 text-zinc-400 cursor-not-allowed">{t.teamCta}</button>
          </div>
        </div>
      </section>

      <footer className="py-12 text-center text-xs text-zinc-600 border-t border-zinc-900">
        {t.footer}
      </footer>
    </div>
  )
}

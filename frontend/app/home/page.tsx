
"use client";
import Link from "next/link";
import { ViHokLogo } from "@/components/Logo";
import { getToken } from "@/lib/api";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  useEffect(() => { setLoggedIn(!!getToken()) }, [])
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <ViHokLogo />
        <div className="flex gap-3 text-sm items-center">
          <Link href="/changelog" className="text-zinc-400 hover:text-white">Changelog</Link>
          <Link href="/roadmap" className="text-zinc-400 hover:text-white">Roadmap</Link>
          {loggedIn ? (
            <Link href="/th" className="px-4 py-2 rounded-full bg-white text-black font-bold">เข้าแชท →</Link>
          ) : (
            <>
              <Link href="/auth" className="text-zinc-300 hover:text-white font-semibold">Log in</Link>
              <Link href="/auth?mode=register" className="px-4 py-2 rounded-full bg-white text-black font-bold">Sign up →</Link>
            </>
          )}
        </div>
      </nav>

      <section className="text-center py-20 px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300 mb-6">
          <span>🦅</span> vihokai.com - เหนือชั้นแบบนก
        </div>
        <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-[0.9]">
          เหนือชั้น<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-cyan-400 to-white">แบบนก</span>
        </h1>
        <p className="mt-6 text-xl text-zinc-400 max-w-2xl mx-auto">
          ViHok AI ถามครั้งเดียว <span className="text-white font-bold">ได้ 5 คำตอบพร้อมกัน</span> จากมุมสูง<br/>
          Meta AI เป็นเหยี่ยวตัดสิน Best Answer ใน 3 วิ - เร็วกว่า Perplexity 3x
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/th" className="px-8 py-4 rounded-2xl bg-white text-black font-bold text-lg">เริ่มบินฟรี 20 ครั้ง →</Link>
          <Link href="#how" className="px-8 py-4 rounded-2xl bg-zinc-900 border border-zinc-800">ดูวิธีบิน</Link>
        </div>
        <p className="mt-4 text-sm text-zinc-500">ยังไม่มีบัญชี? <Link href="/auth?mode=register" className="text-white font-semibold hover:underline">สมัครฟรี</Link> · มีแล้ว <Link href="/auth" className="text-white font-semibold hover:underline">เข้าสู่ระบบ</Link></p>

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
          {icon:"🦅", title:"มองกว้างแบบเหยี่ยว", desc:"ถามครั้งเดียว 5 AIs ตอบพร้อมกัน เห็นทุกมุม"},
          {icon:"⚡️", title:"เร็วแบบโฉบ", desc:"Groq + Llama 3.3 400 tokens/sec เร็วกว่า 3x"},
          {icon:"👑", title:"ตัดสินแบบจ่าฝูง", desc:"Meta AI Judge สรุปคำตอบที่ดีที่สุดให้"},
        ].map(c=>(
          <div key={c.title} className="p-8 rounded-[24px] bg-zinc-900 border border-zinc-800">
            <div className="text-3xl mb-4">{c.icon}</div>
            <h3 className="font-bold text-lg">{c.title}</h3>
            <p className="text-sm text-zinc-400 mt-2">{c.desc}</p>
          </div>
        ))}
      </section>

      <section id="pricing" className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center">บินฟรี แล้วค่อยบินสูง</h2>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {name:"นกกระจอก", sub:"Free", price:"$0", credits:"20 credits", features:["เทียบ 2 AIs","Judge 5 ครั้ง"], cta:"เริ่มบินฟรี"},
            {name:"เหยี่ยว", sub:"Pro", price:"$20", popular:true, credits:"500 credits", features:["เทียบ 5 AIs ไม่จำกัด","Judge 500 ครั้ง","Research 8 บท","เร็ว 400 tok/s"], cta:"บินแบบเหยี่ยว →"},
            {name:"พญาอินทรี", sub:"Team", price:"$49", credits:"2000 credits", features:["ทุกอย่างใน Pro","Team + API","White-label"], cta:"บินแบบอินทรี"},
          ].map(plan=>(
            <div key={plan.name} className={`rounded-[24px] p-8 border ${plan.popular?"bg-white text-black scale-105":"bg-zinc-900 border-zinc-800"}`}>
              {plan.popular && <div className="text-xs font-bold bg-black text-white inline-block px-3 py-1 rounded-full mb-4">🔥 POPULAR</div>}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-xs opacity-60">{plan.sub}</p>
              <div className="mt-4 flex items-baseline gap-2"><span className="text-4xl font-black">{plan.price}</span><span className="opacity-60">/mo</span></div>
              <p className="text-sm opacity-60 mt-1">{plan.credits}</p>
              <ul className="mt-6 space-y-2 text-sm">{plan.features.map(f=><li key={f}>✓ {f}</li>)}</ul>
              <Link href="/pricing" className={`mt-8 block text-center w-full py-3 rounded-xl font-bold ${plan.popular?"bg-black text-white":"bg-white text-black"}`}>{plan.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-12 text-center text-xs text-zinc-600 border-t border-zinc-900">
        © 2026 ViHok AI - www.vihokai.com | เหนือชั้นแบบนก 🦅 Soar Above
      </footer>
    </div>
  )
}

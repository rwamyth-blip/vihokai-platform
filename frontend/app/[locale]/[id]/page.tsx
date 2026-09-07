// app/[locale]/[id]/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

type Message = { role: string; content: string; id: string }
type ChatDetail = {
	id: string
	title: string
	messages: Message[]
	created_at: string
}

export default function ChatDetailPage() {
	const params = useParams()
	const locale = Array.isArray(params?.locale) ? params.locale[0] : (params?.locale as string) || "th"
	const chatId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)

	const [chat, setChat] = useState<ChatDetail | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [input, setInput] = useState("")
	const [isSending, setIsSending] = useState(false)

	useEffect(() => {
		if (chatId) fetchChat()
	}, [chatId])

	const fetchChat = async () => {
		setLoading(true)
		try {
			const res = await fetch(`${API_BASE}/api/conversations/${chatId}?user_id=anon`)
			if (!res.ok) throw new Error("ไม่พบแชทนี้")
			const data = await res.json()
			if (data?.error || !Array.isArray(data?.messages)) throw new Error("ไม่พบแชทนี้")
			setChat({
				...data,
				messages: data.messages.map((message: Message, index: number) => ({
					...message,
					id: message.id || `${chatId}-${index}`,
				})),
			})
		} catch (err: any) {
			setError(err.message || "เกิดข้อผิดพลาด")
		} finally {
			setLoading(false)
		}
	}

	const sendMessage = async () => {
		if (!input.trim() || isSending) return
		setIsSending(true)
		const q = input
		setInput("")
		const userMsg: Message = { role: "user", content: q, id: Date.now().toString() }
		setChat((prev) => prev && { ...prev, messages: [...(prev.messages || []), userMsg] })

		try {
			const res = await fetch(`${API_BASE}/api/chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ question: q, locale, user_id: "anon", conversation_id: chatId }),
			})
			const data = await res.json()
			const aiMsg: Message = {
				role: "assistant",
				content: data.answer || "ไม่สามารถตอบได้ในขณะนี้",
				id: (Date.now() + 1).toString(),
			}
			setChat((prev) => prev && { ...prev, messages: [...(prev.messages || []), aiMsg] })
		} catch (err) {
			console.error("Error sending message:", err)
		} finally {
			setIsSending(false)
		}
	}

	if (loading) return <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center"><p className="text-white/50 text-sm">กำลังโหลด...</p></div>

	if (error || !chat) {
		return <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold mb-2">404</h1><p className="text-white/50 text-sm mb-4">{error || "ไม่พบแชทนี้"}</p><Link href={`/${locale}`} className="px-4 py-2 bg-white text-black rounded-full text-sm font-bold">กลับไปหน้าแรก</Link></div></div>
	}

	return <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
		<header className="sticky top-0 z-10 border-b border-white/5 bg-[#0f0f0f]/80 backdrop-blur-xl px-4 h-[56px] flex items-center justify-between"><div className="flex items-center gap-3"><Link href={`/${locale}`} className="text-white/40 hover:text-white">← กลับ</Link><div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-bold text-[10px]">V</div><span className="font-bold text-[13px] truncate max-w-[150px]">{chat.title}</span></div><div className="text-[10px] text-white/30">{chat.messages.length} ข้อความ</div></header>
		<div className="flex-1 overflow-y-auto p-4 space-y-3">{chat.messages.length === 0 ? <div className="h-full flex items-center justify-center text-white/30 text-sm">ยังไม่มีข้อความ เริ่มพูดคุยกันเลย!</div> : chat.messages.map((m) => <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${m.role === "user" ? "bg-white text-black" : "bg-white/10 text-white/80"}`}>{m.content}</div></div>)}{isSending && <div className="text-white/60">กำลังพิมพ์...</div>}</div>
		<div className="p-4 border-t border-white/5 bg-[#0f0f0f]"><div className="max-w-3xl mx-auto"><div className="bg-[#2a2a2a] rounded-full flex items-center gap-2 p-1.5 pl-4"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="พิมพ์ข้อความ..." className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/30" disabled={isSending} /><button onClick={sendMessage} disabled={isSending || !input.trim()} className="w-8 h-8 rounded-full bg-white text-black disabled:opacity-40">↑</button></div></div></div>
	</div>
}

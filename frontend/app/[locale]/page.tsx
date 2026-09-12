"use client"
import { useState, useMemo, useRef, useEffect } from "react"
import type { ReactNode } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import {
  API_BASE,
  apiFetch,
  getToken,
  jsonInit,
  logoutToHome,
  requireLogin,
} from "@/lib/api"
import { VihokLogoMark } from "@/components/VihokLogo"
import {
  Plus,
  Search,
  Settings,
  History,
  Star,
  Image as ImageIcon,
  FileText,
  BarChart3,
  Code2,
  Languages,
  Presentation,
  Paperclip,
  Globe,
  Gift,
  Bell,
  Sun,
  ChevronDown,
  ChevronRight,
  Crown,
  Send,
  Menu,
  X,
  Bot,
  Sparkles,
  Database,
  Layers3,
  MessageSquare,
  Zap,
} from "lucide-react"

// ===== ภาษาทั่วโลก 100+ ภาษา =====
const LANGUAGES = [
  // เอเชีย (18)
  { code: "th", flag: "🇹🇭", name: "ไทย", en: "Thai", region: "asia" },
  { code: "en", flag: "🇺🇸", name: "English", en: "English", region: "europe" },
  { code: "zh", flag: "🇨🇳", name: "中文", en: "Chinese", region: "asia" },
  { code: "ja", flag: "🇯🇵", name: "日本語", en: "Japanese", region: "asia" },
  { code: "ko", flag: "🇰🇷", name: "한국어", en: "Korean", region: "asia" },
  { code: "vi", flag: "🇻🇳", name: "Tiếng Việt", en: "Vietnamese", region: "asia" },
  { code: "ms", flag: "🇲🇾", name: "Bahasa Melayu", en: "Malay", region: "asia" },
  { code: "id", flag: "🇮🇩", name: "Bahasa Indonesia", en: "Indonesian", region: "asia" },
  { code: "hi", flag: "🇮🇳", name: "हिन्दी", en: "Hindi", region: "asia" },
  { code: "ur", flag: "🇵🇰", name: "اردو", en: "Urdu", region: "asia" },
  { code: "my", flag: "🇲🇲", name: "မြန်မာ", en: "Burmese", region: "asia" },
  { code: "km", flag: "🇰🇭", name: "ភាសាខ្មែរ", en: "Khmer", region: "asia" },
  { code: "lo", flag: "🇱🇦", name: "ລາວ", en: "Lao", region: "asia" },
  { code: "ne", flag: "🇳🇵", name: "नेपाली", en: "Nepali", region: "asia" },
  { code: "si", flag: "🇱🇰", name: "සිංහල", en: "Sinhala", region: "asia" },
  { code: "bn", flag: "🇧🇩", name: "বাংলা", en: "Bengali", region: "asia" },
  { code: "pa", flag: "🇮🇳", name: "ਪੰਜਾਬੀ", en: "Punjabi", region: "asia" },
  { code: "ta", flag: "🇮🇳", name: "தமிழ்", en: "Tamil", region: "asia" },
  // ยุโรป (25)
  { code: "es", flag: "🇪🇸", name: "Español", en: "Spanish", region: "europe" },
  { code: "fr", flag: "🇫🇷", name: "Français", en: "French", region: "europe" },
  { code: "de", flag: "🇩🇪", name: "Deutsch", en: "German", region: "europe" },
  { code: "it", flag: "🇮🇹", name: "Italiano", en: "Italian", region: "europe" },
  { code: "pt", flag: "🇵🇹", name: "Português", en: "Portuguese", region: "europe" },
  { code: "ru", flag: "🇷🇺", name: "Русский", en: "Russian", region: "europe" },
  { code: "pl", flag: "🇵🇱", name: "Polski", en: "Polish", region: "europe" },
  { code: "nl", flag: "🇳🇱", name: "Nederlands", en: "Dutch", region: "europe" },
  { code: "sv", flag: "🇸🇪", name: "Svenska", en: "Swedish", region: "europe" },
  { code: "da", flag: "🇩🇰", name: "Dansk", en: "Danish", region: "europe" },
  { code: "no", flag: "🇳🇴", name: "Norsk", en: "Norwegian", region: "europe" },
  { code: "fi", flag: "🇫🇮", name: "Suomi", en: "Finnish", region: "europe" },
  { code: "el", flag: "🇬🇷", name: "Ελληνικά", en: "Greek", region: "europe" },
  { code: "cs", flag: "🇨🇿", name: "Čeština", en: "Czech", region: "europe" },
  { code: "hu", flag: "🇭🇺", name: "Magyar", en: "Hungarian", region: "europe" },
  { code: "ro", flag: "🇷🇴", name: "Română", en: "Romanian", region: "europe" },
  { code: "uk", flag: "🇺🇦", name: "Українська", en: "Ukrainian", region: "europe" },
  { code: "bg", flag: "🇧🇬", name: "Български", en: "Bulgarian", region: "europe" },
  { code: "sr", flag: "🇷🇸", name: "Српски", en: "Serbian", region: "europe" },
  { code: "hr", flag: "🇭🇷", name: "Hrvatski", en: "Croatian", region: "europe" },
  { code: "sk", flag: "🇸🇰", name: "Slovenčina", en: "Slovak", region: "europe" },
  { code: "lt", flag: "🇱🇹", name: "Lietuvių", en: "Lithuanian", region: "europe" },
  { code: "lv", flag: "🇱🇻", name: "Latviešu", en: "Latvian", region: "europe" },
  { code: "et", flag: "🇪🇪", name: "Eesti", en: "Estonian", region: "europe" },
  { code: "sq", flag: "🇦🇱", name: "Shqip", en: "Albanian", region: "europe" },
  // ตะวันออกกลาง (10)
  { code: "ar", flag: "🇸🇦", name: "العربية", en: "Arabic", region: "middle_east" },
  { code: "he", flag: "🇮🇱", name: "עברית", en: "Hebrew", region: "middle_east" },
  { code: "fa", flag: "🇮🇷", name: "فارسی", en: "Persian", region: "middle_east" },
  { code: "tr", flag: "🇹🇷", name: "Türkçe", en: "Turkish", region: "europe" },
  { code: "ku", flag: "🇹🇷", name: "Kurdî", en: "Kurdish", region: "middle_east" },
  { code: "az", flag: "🇦🇿", name: "Azərbaycanca", en: "Azerbaijani", region: "middle_east" },
  { code: "ka", flag: "🇬🇪", name: "ქართული", en: "Georgian", region: "europe" },
  { code: "hy", flag: "🇦🇲", name: "Հայերեն", en: "Armenian", region: "europe" },
  { code: "ps", flag: "🇦🇫", name: "پښتو", en: "Pashto", region: "middle_east" },
  { code: "ckb", flag: "🇮🇶", name: "کوردی", en: "Kurdish (Sorani)", region: "middle_east" },
  // แอฟริกา (12)
  { code: "sw", flag: "🇹🇿", name: "Kiswahili", en: "Swahili", region: "africa" },
  { code: "ha", flag: "🇳🇬", name: "Hausa", en: "Hausa", region: "africa" },
  { code: "zu", flag: "🇿🇦", name: "isiZulu", en: "Zulu", region: "africa" },
  { code: "am", flag: "🇪🇹", name: "አማርኛ", en: "Amharic", region: "africa" },
  { code: "yo", flag: "🇳🇬", name: "Yorùbá", en: "Yoruba", region: "africa" },
  { code: "ig", flag: "🇳🇬", name: "Igbo", en: "Igbo", region: "africa" },
  { code: "rw", flag: "🇷🇼", name: "Kinyarwanda", en: "Kinyarwanda", region: "africa" },
  { code: "sn", flag: "🇿🇼", name: "Shona", en: "Shona", region: "africa" },
  { code: "so", flag: "🇸🇴", name: "Soomaali", en: "Somali", region: "africa" },
  { code: "ts", flag: "🇿🇦", name: "Xitsonga", en: "Tsonga", region: "africa" },
  { code: "ve", flag: "🇿🇦", name: "Tshivenḓa", en: "Venda", region: "africa" },
  { code: "nr", flag: "🇿🇦", name: "isiNdebele", en: "Ndebele", region: "africa" },
  // อเมริกา + อื่นๆ (10)
  { code: "tl", flag: "🇵🇭", name: "Tagalog", en: "Tagalog", region: "asia" },
  { code: "mi", flag: "🇳🇿", name: "Māori", en: "Maori", region: "australia" },
  { code: "haw", flag: "🇺🇸", name: "ʻŌlelo Hawaiʻi", en: "Hawaiian", region: "australia" },
  { code: "fj", flag: "🇫🇯", name: "Na Vosa Vakaviti", en: "Fijian", region: "australia" },
  { code: "sm", flag: "🇼🇸", name: "Gagana Samoa", en: "Samoan", region: "australia" },
  { code: "to", flag: "🇹🇴", name: "Tonga", en: "Tongan", region: "australia" },
  { code: "ty", flag: "🇵🇫", name: "Reo Tahiti", en: "Tahitian", region: "australia" },
  { code: "gl", flag: "🇪🇸", name: "Galego", en: "Galician", region: "europe" },
  { code: "eu", flag: "🇪🇸", name: "Euskara", en: "Basque", region: "europe" },
  { code: "ca", flag: "🇪🇸", name: "Català", en: "Catalan", region: "europe" },
]

// ===== ข้อความแปล =====
const COPY: any = {
  th: {
    h1: "AI ที่เข้าใจคุณ ทุกภาษา ทั่วโลก",
    sub: "ถามอะไรก็ได้ — เขียนงาน คิดไอเดีย สรุปเอกสาร วางแผน",
    placeholder: "ถามอะไรก็ได้...",
    searchChat: "ค้นหาเนื้อหาแชท...",
    today: "วันนี้",
    yesterday: "เมื่อวาน",
    days7: "7 วัน",
    badge: "✓ ตรวจสอบแล้วโดย Vihok AI",
    upload: "ลากไฟล์มาวาง",
    remember: "ความจำ",
    newChat: "แชทใหม่",
    thinking: "AI กำลังคิด...",
    typing: "พิมพ์อยู่...",
    noChat: "ยังไม่มีแชท",
    startChat: "เริ่มแชทใหม่กับ Vihok AI",
    clearMemory: "ล้างความจำ",
    memoryCount: "รายการ",
    poweredBy: "ขับเคลื่อนโดย Vihok AI",
    delete: "ลบ",
    confirmDelete: "ยืนยันการลบ",
    cancel: "ยกเลิก",
    fileReady: "พร้อมใช้งาน",
    chooseFile: "เลือกไฟล์",
    allLanguages: "🌍 ทุกภาษา",
    popular: "🇹🇭 ไทย · 🇺🇸 English · 🇨🇳 中文 · 🇯🇵 日本語 · 🇪🇸 Español · 🇫🇷 Français · 🇩🇪 Deutsch",
    selectLanguage: "เลือกภาษา",
    suggestions: [
      "ช่วยเขียนแผนธุรกิจ",
      "ฉันชื่ออะไร?",
      "สเปกเครื่องคอม AI",
      "สรุปโฉนดที่ดิน",
      "แต่งกลอนเกี่ยวกับ AI",
    ],
    singleMode: "⚡ โหมดเดียว",
    compareMode: "📊 เปรียบเทียบ",
    streamMode: "🌊 สตรีมมิ่ง",
    streaming: "กำลังพิมพ์...",
    tools: "เครื่องมือ AI",
    viewAll: "ดูทั้งหมด",
    chatHistory: "ประวัติการแชท",
    upgradePro: "อัปเกรดเป็น Pro",
    unlockAll: "ปลดล็อกทุกความสามารถ ด้วย AI ระดับ Pro",
    online: "ออนไลน์",
    selectModel: "เลือกโมเดล AI",
    more: "ดูเพิ่มเติม",
    typeMessage: "พิมพ์ข้อความของคุณที่นี่...",
    searchWeb: "ค้นหาเว็บ",
    uploadFile: "อัปโหลดไฟล์",
    createImage: "สร้างภาพ AI",
    disclaimer: "AI อาจสร้างข้อมูลที่ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลสำคัญ",
  },
  en: {
    h1: "AI that understands you, in every language",
    sub: "Ask anything — write, brainstorm, summarize, plan",
    placeholder: "Ask anything...",
    searchChat: "Search chats...",
    today: "Today",
    yesterday: "Yesterday",
    days7: "7 days",
    badge: "✓ Verified by Vihok AI",
    upload: "Drop files here",
    remember: "Memory",
    newChat: "New Chat",
    thinking: "AI is thinking...",
    typing: "Typing...",
    noChat: "No chats yet",
    startChat: "Start a new chat with Vihok AI",
    clearMemory: "Clear Memory",
    memoryCount: "items",
    poweredBy: "Powered by Vihok AI",
    delete: "Delete",
    confirmDelete: "Confirm Delete",
    cancel: "Cancel",
    fileReady: "Ready",
    chooseFile: "Choose File",
    allLanguages: "🌍 All Languages",
    popular: "🇹🇭 Thai · 🇺🇸 English · 🇨🇳 Chinese · 🇯🇵 Japanese · 🇪🇸 Spanish · 🇫🇷 French · 🇩🇪 German",
    selectLanguage: "Select Language",
    suggestions: [
      "Write a business plan",
      "What is my name?",
      "AI PC specs",
      "Summarize land title",
      "Write a poem about AI",
    ],
    singleMode: "⚡ Single",
    compareMode: "📊 Compare",
    streamMode: "🌊 Stream",
    streaming: "Streaming...",
    tools: "AI Tools",
    viewAll: "View All",
    chatHistory: "Chat History",
    upgradePro: "Upgrade to Pro",
    unlockAll: "Unlock all features with AI Pro",
    online: "Online",
    selectModel: "Select AI Model",
    more: "See More",
    typeMessage: "Type your message here...",
    searchWeb: "Search Web",
    uploadFile: "Upload File",
    createImage: "Create AI Image",
    disclaimer: "AI may generate inaccurate information. Please verify important information.",
  },
  ja: {
    h1: "あなたを理解するAI、世界中の言語",
    sub: "何でも聞いてください — 執筆、アイデア出し、要約、計画",
    placeholder: "何でも聞いてください...",
    searchChat: "チャットを検索...",
    today: "今日",
    yesterday: "昨日",
    days7: "7日間",
    badge: "✓ Vihok AIが検証済み",
    upload: "ファイルをドロップ",
    remember: "記憶",
    newChat: "新しいチャット",
    thinking: "AIが考えています...",
    typing: "タイピング中...",
    noChat: "チャットはまだありません",
    startChat: "Vihok AIで新しいチャットを始める",
    clearMemory: "記憶をクリア",
    memoryCount: "アイテム",
    poweredBy: "Vihok AI提供",
    delete: "削除",
    confirmDelete: "削除確認",
    cancel: "キャンセル",
    fileReady: "準備完了",
    chooseFile: "ファイルを選択",
    allLanguages: "🌍 すべての言語",
    popular: "🇹🇭 タイ語 · 🇺🇸 英語 · 🇨🇳 中国語 · 🇯🇵 日本語 · 🇪🇸 スペイン語 · 🇫🇷 フランス語 · 🇩🇪 ドイツ語",
    selectLanguage: "言語を選択",
    suggestions: [
      "ビジネスプランを書く",
      "私の名前は何？",
      "AI PCの仕様",
      "土地の権利書を要約",
      "AIについての詩を書く",
    ],
    singleMode: "⚡ シングル",
    compareMode: "📊 比較",
    streamMode: "🌊 ストリーミング",
    streaming: "ストリーミング中...",
    tools: "AIツール",
    viewAll: "すべて表示",
    chatHistory: "チャット履歴",
    upgradePro: "Proにアップグレード",
    unlockAll: "AI Proですべての機能を解放",
    online: "オンライン",
    selectModel: "AIモデルを選択",
    more: "もっと見る",
    typeMessage: "メッセージを入力...",
    searchWeb: "ウェブ検索",
    uploadFile: "ファイルをアップロード",
    createImage: "AI画像を作成",
    disclaimer: "AIは不正確な情報を生成する可能性があります。重要な情報は確認してください。",
  },
  zh: {
    h1: "懂你的AI，全球语言",
    sub: "有问必答 — 写作、头脑风暴、总结、计划",
    placeholder: "问任何问题...",
    searchChat: "搜索聊天...",
    today: "今天",
    yesterday: "昨天",
    days7: "7天",
    badge: "✓ 已由 Vihok AI 验证",
    upload: "拖放文件",
    remember: "记忆",
    newChat: "新聊天",
    thinking: "AI正在思考...",
    typing: "正在输入...",
    noChat: "暂无聊天",
    startChat: "开始与 Vihok AI 的新聊天",
    clearMemory: "清除记忆",
    memoryCount: "项目",
    poweredBy: "由 Vihok AI 提供支持",
    delete: "删除",
    confirmDelete: "确认删除",
    cancel: "取消",
    fileReady: "已准备好",
    chooseFile: "选择文件",
    allLanguages: "🌍 所有语言",
    popular: "🇹🇭 泰语 · 🇺🇸 英语 · 🇨🇳 中文 · 🇯🇵 日语 · 🇪🇸 西班牙语 · 🇫🇷 法语 · 🇩🇪 德语",
    selectLanguage: "选择语言",
    suggestions: [
      "写商业计划",
      "我叫什么名字？",
      "AI PC规格",
      "土地权属书要约",
      "写一首关于AI的诗",
    ],
    singleMode: "⚡ 单模式",
    compareMode: "📊 比较",
    streamMode: "🌊 流式",
    streaming: "流式传输中...",
    tools: "AI工具",
    viewAll: "查看全部",
    chatHistory: "聊天历史",
    upgradePro: "升级到Pro",
    unlockAll: "使用AI Pro解锁所有功能",
    online: "在线",
    selectModel: "选择AI模型",
    more: "查看更多",
    typeMessage: "在此输入您的消息...",
    searchWeb: "搜索网页",
    uploadFile: "上传文件",
    createImage: "创建AI图像",
    disclaimer: "AI可能生成不准确的信息。请验证重要信息。",
  },
  ko: {
    h1: "당신을 이해하는 AI, 전 세계 언어",
    sub: "무엇이든 물어보세요 — 글쓰기, 브레인스토밍, 요약, 계획",
    placeholder: "무엇이든 물어보세요...",
    searchChat: "채팅 검색...",
    today: "오늘",
    yesterday: "어제",
    days7: "7일",
    badge: "✓ Vihok AI가 검증함",
    upload: "파일을 드롭하세요",
    remember: "기억",
    newChat: "새 채팅",
    thinking: "AI가 생각 중...",
    typing: "입력 중...",
    noChat: "채팅이 없습니다",
    startChat: "Vihok AI로 새 채팅 시작",
    clearMemory: "기억 지우기",
    memoryCount: "항목",
    poweredBy: "Vihok AI 제공",
    delete: "삭제",
    confirmDelete: "삭제 확인",
    cancel: "취소",
    fileReady: "준비 완료",
    chooseFile: "파일 선택",
    allLanguages: "🌍 모든 언어",
    popular: "🇹🇭 태국어 · 🇺🇸 영어 · 🇨🇳 중국어 · 🇯🇵 일본어 · 🇪🇸 스페인어 · 🇫🇷 프랑스어 · 🇩🇪 독일어",
    selectLanguage: "언어 선택",
    suggestions: [
      "비즈니스 계획 작성",
      "내 이름은 무엇?",
      "AI PC 사양",
      "토지 문서 요약",
      "AI에 관한 시 쓰기",
    ],
    singleMode: "⚡ 단일",
    compareMode: "📊 비교",
    streamMode: "🌊 스트리밍",
    streaming: "스트리밍 중...",
    tools: "AI 도구",
    viewAll: "전체 보기",
    chatHistory: "채팅 기록",
    upgradePro: "Pro로 업그레이드",
    unlockAll: "AI Pro로 모든 기능 잠금 해제",
    online: "온라인",
    selectModel: "AI 모델 선택",
    more: "더 보기",
    typeMessage: "여기에 메시지를 입력하세요...",
    searchWeb: "웹 검색",
    uploadFile: "파일 업로드",
    createImage: "AI 이미지 생성",
    disclaimer: "AI는 부정확한 정보를 생성할 수 있습니다. 중요한 정보는 확인하세요.",
  },
}

// ===== คำแปลเพิ่มเติม (เมนู, Pro, เครื่องมือ AI) =====
const EXTRA_COPY: Record<string, Record<string, string>> = {
  th: {
    badgeNew: "ใหม่",
    navAllChats: "แชททั้งหมด",
    navModel: "AI โมเดล",
    navVihokModel: "VihokAI Model",
    navImage: "สร้างภาพ (AI Image)",
    navDoc: "สร้างเอกสาร / สรุป",
    navAnalyze: "วิเคราะห์ไฟล์",
    navOps: "โหมดการทำงาน",
    navFav: "รายการโปรด",
    navSetting: "การตั้งค่า",
    memoryEmpty: "ยังไม่มีความจำ",
    freePlan: "แผนฟรี",
    login: "เข้าสู่ระบบ",
    logout: "ออกจากระบบ",
    assistantName: "Vihok AI",
    proLimitless: "✓ ใช้งาน AI ได้ไม่จำกัด",
    proLatestModel: "✓ เข้าถึงโมเดลล่าสุด",
    proBigFile: "✓ อัปโหลดไฟล์ขนาดใหญ่",
    proUnlockDesc: "เข้าถึงโมเดล AI และเครื่องมือขั้นสูง",
    langPlaceholder: "ค้นหาภาษา... / Search language...",
    noLanguageFound: "ไม่พบภาษา / No language found",
    langCountSuffix: "ภาษา",
    tagline: "ผู้ช่วย AI อัจฉริยะ",
    tipSingle: "ตอบโดย AI ตัวเดียว (เร็ว)",
    tipCompare: "เปรียบเทียบทุก AI (ช้า)",
    tipStream: "พิมพ์ทีละคำ (UX ดีที่สุด)",
    toolImage: "สร้างภาพ AI", toolImageDesc: "ข้อความเป็นรูปภาพ",
    toolSummary: "สรุปเอกสาร", toolSummaryDesc: "AI สรุปย่อ",
    toolAnalysis: "วิเคราะห์ข้อมูล", toolAnalysisDesc: "วิเคราะห์ข้อมูล",
    toolTranslate: "แปลภาษา", toolTranslateDesc: "AI นักแปล",
    toolCode: "เขียนโค้ด", toolCodeDesc: "AI โค้ด",
    toolPresentation: "สร้างสไลด์", toolPresentationDesc: "AI สไลด์",
  },
  en: {
    badgeNew: "NEW",
    navAllChats: "All Chats",
    navModel: "AI Models",
    navVihokModel: "VihokAI Model",
    navImage: "Create Image (AI Image)",
    navDoc: "Create Document / Summarize",
    navAnalyze: "Analyze Files",
    navOps: "Operation Modes",
    navFav: "Favorites",
    navSetting: "Settings",
    memoryEmpty: "No memories yet",
    freePlan: "Free Plan",
    login: "Log In",
    logout: "Log Out",
    assistantName: "Vihok AI",
    proLimitless: "✓ Unlimited AI chats",
    proLatestModel: "✓ Access to latest models",
    proBigFile: "✓ Upload large files",
    proUnlockDesc: "Unlock advanced AI models and tools",
    langPlaceholder: "Search language...",
    noLanguageFound: "No language found",
    langCountSuffix: "languages",
    tagline: "Smart AI Assistant",
    tipSingle: "Answer by a single AI (fast)",
    tipCompare: "Compare all AIs (slower)",
    tipStream: "Stream token by token (best UX)",
    toolImage: "Create AI Image", toolImageDesc: "Text to Image",
    toolSummary: "Summarize Document", toolSummaryDesc: "AI Summary",
    toolAnalysis: "Analyze Data", toolAnalysisDesc: "Data Analysis",
    toolTranslate: "Translate", toolTranslateDesc: "AI Translator",
    toolCode: "Write Code", toolCodeDesc: "AI Code",
    toolPresentation: "Create Slides", toolPresentationDesc: "AI Presentation",
  },
  zh: {
    badgeNew: "新",
    navAllChats: "全部聊天",
    navModel: "AI 模型",
    navVihokModel: "VihokAI Model",
    navImage: "AI 绘图",
    navDoc: "生成文档 / 摘要",
    navAnalyze: "文件分析",
    navOps: "工作模式",
    navFav: "收藏",
    navSetting: "设置",
    memoryEmpty: "暂无记忆",
    freePlan: "免费版",
    login: "登录",
    logout: "退出登录",
    assistantName: "Vihok AI",
    proLimitless: "✓ AI 聊天不限量",
    proLatestModel: "✓ 使用最新模型",
    proBigFile: "✓ 上传大文件",
    proUnlockDesc: "解锁高级 AI 模型和工具",
    langPlaceholder: "搜索语言...",
    noLanguageFound: "未找到语言",
    langCountSuffix: "种语言",
    tagline: "智能 AI 助手",
    tipSingle: "由单个 AI 回答（快）",
    tipCompare: "比较所有 AI（较慢）",
    tipStream: "逐字输出（体验最佳）",
    toolImage: "AI 绘图", toolImageDesc: "文字生成图片",
    toolSummary: "文档摘要", toolSummaryDesc: "AI 摘要",
    toolAnalysis: "数据分析", toolAnalysisDesc: "数据分析",
    toolTranslate: "翻译", toolTranslateDesc: "AI 翻译",
    toolCode: "编写代码", toolCodeDesc: "AI 代码",
    toolPresentation: "生成幻灯片", toolPresentationDesc: "AI 演示文稿",
  },
  ja: {
    badgeNew: "新",
    navAllChats: "すべてのチャット",
    navModel: "AIモデル",
    navVihokModel: "VihokAI Model",
    navImage: "AI画像生成",
    navDoc: "ドキュメント生成 / 要約",
    navAnalyze: "ファイル分析",
    navOps: "動作モード",
    navFav: "お気に入り",
    navSetting: "設定",
    memoryEmpty: "メモリはまだありません",
    freePlan: "無料プラン",
    login: "ログイン",
    logout: "ログアウト",
    assistantName: "Vihok AI",
    proLimitless: "✓ AIチャット無制限",
    proLatestModel: "✓ 最新モデルへアクセス",
    proBigFile: "✓ 大容量ファイルをアップロード",
    proUnlockDesc: "高度なAIモデルとツールを解放",
    langPlaceholder: "言語を検索...",
    noLanguageFound: "言語が見つかりません",
    langCountSuffix: "言語",
    tagline: "スマートAIアシスタント",
    tipSingle: "1つのAIが回答（高速）",
    tipCompare: "全AIと比較（低速）",
    tipStream: "トークンごとに表示（最高UX）",
    toolImage: "AI画像生成", toolImageDesc: "テキストから画像生成",
    toolSummary: "文書の要約", toolSummaryDesc: "AI要約",
    toolAnalysis: "データ分析", toolAnalysisDesc: "データ分析",
    toolTranslate: "翻訳", toolTranslateDesc: "AI翻訳",
    toolCode: "コード作成", toolCodeDesc: "AIコード",
    toolPresentation: "スライド作成", toolPresentationDesc: "AIプレゼン",
  },
  ko: {
    badgeNew: "새로운",
    navAllChats: "모든 채팅",
    navModel: "AI 모델",
    navVihokModel: "VihokAI Model",
    navImage: "AI 이미지 생성",
    navDoc: "문서 생성 / 요약",
    navAnalyze: "파일 분석",
    navOps: "작업 모드",
    navFav: "즐겨찾기",
    navSetting: "설정",
    memoryEmpty: "메모리가 없습니다",
    freePlan: "무료 플랜",
    login: "로그인",
    logout: "로그아웃",
    assistantName: "Vihok AI",
    proLimitless: "✓ AI 채팅 무제한",
    proLatestModel: "✓ 최신 모델 이용",
    proBigFile: "✓ 대용량 파일 업로드",
    proUnlockDesc: "고급 AI 모델 및 도구 잠금 해제",
    langPlaceholder: "언어 검색...",
    noLanguageFound: "언어를 찾을 수 없습니다",
    langCountSuffix: "개 언어",
    tagline: "스마트 AI 어시스턴트",
    tipSingle: "단일 AI 응답(빠름)",
    tipCompare: "모든 AI 비교(느림)",
    tipStream: "토큰별 출력(최고 UX)",
    toolImage: "AI 이미지 생성", toolImageDesc: "텍스트로 이미지 만들기",
    toolSummary: "문서 요약", toolSummaryDesc: "AI 요약",
    toolAnalysis: "데이터 분석", toolAnalysisDesc: "데이터 분석",
    toolTranslate: "번역", toolTranslateDesc: "AI 번역",
    toolCode: "코드 작성", toolCodeDesc: "AI 코드",
    toolPresentation: "슬라이드 생성", toolPresentationDesc: "AI 프레젠테이션",
  },
}

// ✅ getCopy fallback สำหรับทุกภาษา
function getCopy(locale: string) {
  const baseKey = COPY[locale]
    ? locale
    : locale.startsWith("zh")
      ? "zh"
      : locale.startsWith("ja")
        ? "ja"
        : locale.startsWith("ko")
          ? "ko"
          : "en"

  return {
    ...(COPY.en || {}),
    ...(COPY[baseKey] || {}),
    ...(EXTRA_COPY[baseKey] || {}),
  }
}

const REGION_NAMES: any = {
  asia: "🌏 เอเชีย / Asia",
  europe: "🌍 ยุโรป / Europe",
  middle_east: "🌏 ตะวันออกกลาง / Middle East",
  africa: "🌍 แอฟริกา / Africa",
  australia: "🌏 โอเชียเนีย / Oceania",
}

type Message = { role: string; content: string; id: string; timestamp?: string }
type ChatItem = { id: string; title: string; group: string; messages: Message[]; created_at?: string }

// ===== AI Models =====
// engine = ชื่อโมเดลจริงบน backend (อ้างอิง META_AI_MODEL/GROQ_MODEL/OPENAI_MODEL/DEEPSEEK_MODEL/KIMI_MODEL)
// kola_prime/kola_swift/spark/qwen = โหมดตาม sitemap AI Models (VihokAI Model page) — backend ai_map รู้จักแล้ว
const AI_MODELS = [
  { id: "vihokai", name: "VihokAI 1.0", desc: "Siri · gpt-5-nano", icon: "👑", color: "text-amber-500", engine: "gpt-5-nano", badge: "SIRI" },
  { id: "auto", name: "Auto", desc: "Smart Selection", icon: "◉", color: "text-orange-500", engine: "gpt-oss-120b · gpt-5-nano" },
  { id: "kola_prime", name: "Kola Prime", desc: "AI Commander · multi-agent", icon: "🦅", color: "text-cyan-400", engine: "gpt-5-nano · gpt-oss-120b" },
  { id: "kola_swift", name: "Kola Swift", desc: "Fast · Qwen team", icon: "⚡", color: "text-orange-400", engine: "gpt-oss-120b" },
  { id: "spark", name: "Muse Spark 1.3", desc: "Orchestrator · Judge", icon: "✦", color: "text-cyan-300", engine: "muse-spark-1.1" },
  { id: "siri", name: "Vihok01 Siri", desc: "Meta AI · muse-glimmer", icon: "🎙️", color: "text-teal-300", engine: "muse-glimmer-30b" },
  { id: "chatgpt", name: "ChatGPT", desc: "Smart & Fast", icon: "◉", color: "text-orange-500", engine: "gpt-5-nano" },
  { id: "gemini", name: "Gemini", desc: "Balanced", icon: "✦", color: "text-blue-500", engine: "gemini-3.1-flash-lite" },
  { id: "deepseek", name: "DeepSeek", desc: "V4.1 Flash", icon: "◈", color: "text-blue-600", engine: "deepseek-flash" },
  { id: "kimi", name: "Kimi", desc: "Creative", icon: "∞", color: "text-purple-500", engine: "kimi-k3" },
  { id: "qwen", name: "Qwen3 8B", desc: "Document AI · RAG", icon: "📄", color: "text-green-500", engine: "qwen/qwen3.8-27b" },
  { id: "meta_ai", name: "Meta AI", desc: "Muse Spark · by Meta", icon: "◍", color: "text-sky-500", engine: "muse-spark-1.1", badge: "NEW" },
  { id: "claude", name: "Claude", desc: "Analytical", icon: "✦", color: "text-red-500", engine: "claude-4" },
]

// ===== AI Tools =====
const AI_TOOLS = [
  { id: "image", name: "สร้างภาพ AI", desc: "Text to Image", icon: ImageIcon, color: "bg-orange-500" },
  { id: "summary", name: "สรุปเอกสาร", desc: "AI Summary", icon: FileText, color: "bg-blue-500" },
  { id: "analysis", name: "วิเคราะห์ข้อมูล", desc: "Data Analysis", icon: BarChart3, color: "bg-blue-600" },
  { id: "translate", name: "แปลภาษา", desc: "AI Translator", icon: Languages, color: "bg-red-500" },
  { id: "code", name: "เขียนโค้ด", desc: "AI Code", icon: Code2, color: "bg-slate-800" },
  { id: "presentation", name: "สร้างสไลด์", desc: "AI Presentation", icon: Presentation, color: "bg-orange-500" },
]

// API_BASE / apiFetch มาจาก @/lib/api — ที่เดียวทั้งแอป

// ===== Timezone helpers: backend ส่ง UTC ISO → แสดงตาม timezone เครื่องผู้ใช้ (Windows/มือถือ) =====
// กฎ: backend เก็บ UTC เสมอ, frontend แปลงเป็นเวลาท้องถิ่นตอนแสดงเท่านั้น (ห้าม hardcode เช่น "10:30")
function toLocalDate(isoDate?: string): Date | null {
  if (!isoDate) return null
  const d = new Date(isoDate)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatMessageTime(isoDate?: string): string {
  const d = toLocalDate(isoDate)
  if (!d) return ""
  // เวลาสั้นแบบแชททั่วไป (HH:MM ตาม timezone เครื่อง) — ถ้าไม่ใช่ของวันนี้เติมวันที่ด้วย
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  return d.toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

function formatChatTime(isoDate?: string, locale = "th-TH"): string {
  const d = toLocalDate(isoDate)
  if (!d) return ""
  return d.toLocaleString(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function groupChatByDate(isoDate?: string): "today" | "yesterday" | "7days" {
  if (!isoDate) return "today"
  const time = new Date(isoDate).getTime()
  if (Number.isNaN(time)) return "today"

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (time >= startOfToday) return "today"
  if (time >= startOfToday - 86_400_000) return "yesterday"
  return "7days"
}

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()

  const rawLocale = params?.locale
  const urlLocale = Array.isArray(rawLocale) ? rawLocale[0] : (rawLocale as string) || "th"

  const [locale, setLocale] = useState(urlLocale)
  const [showLang, setShowLang] = useState(false)
  const [langSearch, setLangSearch] = useState("")
  const [chatSearch, setChatSearch] = useState("")
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chats, setChats] = useState<ChatItem[]>([])
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [mode, setMode] = useState<"single" | "compare" | "stream">("single")
  const [selectedAI, setSelectedAI] = useState("auto")
  const [user, setUser] = useState<any>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [backendStatus, setBackendStatus] = useState("checking...")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const t = getCopy(locale)
  const currentLang = LANGUAGES.find((l) => l.code === locale) || {
    flag: "🌐",
    name: locale,
    code: locale,
  }
  const currentChat = chats.find((c) => c.id === currentChatId) || chats[0]

  const toolTexts: Record<string, { name: string; desc: string }> = {
    image: { name: t.toolImage, desc: t.toolImageDesc },
    summary: { name: t.toolSummary, desc: t.toolSummaryDesc },
    analysis: { name: t.toolAnalysis, desc: t.toolAnalysisDesc },
    translate: { name: t.toolTranslate, desc: t.toolTranslateDesc },
    code: { name: t.toolCode, desc: t.toolCodeDesc },
    presentation: { name: t.toolPresentation, desc: t.toolPresentationDesc },
  }

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google`
  }

  useEffect(() => {
    // ✅ ต้อง login ก่อนใช้งาน — ไม่มี session ที่ใช้ได้จะเดือนไป /auth
    const session = requireLogin()
    if (session) setUser(session)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem("vihok_locale")
    const targetLocale = urlLocale || saved || "th"

    if (targetLocale !== locale) {
      setLocale(targetLocale)
    }
    localStorage.setItem("vihok_locale", targetLocale)
  }, [urlLocale, locale])

  // ✅ รับค่า ?model= จากหน้า VihokAI Model (/models) แล้วเลือกโมเดลให้อัตโนมัติ
  useEffect(() => {
    if (typeof window === "undefined") return
    const wanted = new URLSearchParams(window.location.search).get("model")
    if (!wanted) return
    if (AI_MODELS.some((m) => m.id === wanted)) {
      setSelectedAI(wanted)
      localStorage.setItem("vihok_model", wanted)
    }
  }, [])

  useEffect(() => {
    // ยังไม่มี token = กำลังถูกเดือนไปหน้า login — ไม่ต้องยิง API
    if (!getToken()) return

    fetch(`${API_BASE}/`)
      .then((r) => r.json())
      .then(() => setBackendStatus("✓ Connected"))
      .catch(() => setBackendStatus("✗ Offline"))
    loadMemories()
    loadConversations()
    inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentChat?.messages, isThinking, isStreaming])

  const loadMemories = async () => {
    try {
      // ไม่ต้องส่ง user_id — backend อ่านจาก token
      const res = await apiFetch("/memory/recall")
      const data = await res.json()
      if (data.memories) setMemories(data.memories.slice(-5))
    } catch {}
  }

  const loadConversations = async () => {
    try {
      const res = await apiFetch("/api/conversations?limit=100")
      if (!res.ok) throw new Error(`Backend returned ${res.status}`)

      const data = await res.json()
      const list = Array.isArray(data) ? data : data.conversations || []

      const loadedChats: ChatItem[] = list
        .sort(
          (a: any, b: any) =>
            new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime(),
        )
        .map((conv: any): ChatItem => ({
          id: conv.id,
          title: conv.title || t.newChat,
          group: groupChatByDate(conv.created_at),
          created_at: conv.created_at,
          messages: (conv.messages || []).map((m: any, i: number) => ({
            role: m.role,
            content: m.content,
            id: `${conv.id}-${i}`,
            timestamp: m.timestamp || conv.created_at,
          })),
        }))

      setChats(loadedChats)
      if (loadedChats.length > 0) {
        setCurrentChatId((prev) =>
          loadedChats.some((c) => c.id === prev) ? prev : loadedChats[0].id,
        )
      }
    } catch (error) {
      console.error("loadConversations:", error)
    }
  }

  const filteredChats = useMemo(() => {
    if (!chatSearch) return chats
    return chats.filter((c) => c.title.toLowerCase().includes(chatSearch.toLowerCase()))
  }, [chatSearch, chats])

  const grouped = {
    [t.today]: filteredChats.filter((c) => c.group === "today"),
    [t.yesterday]: filteredChats.filter((c) => c.group === "yesterday"),
    [t.days7]: filteredChats.filter((c) => c.group === "7days"),
  }

  const filteredLanguages = useMemo(() => {
    if (!langSearch) return LANGUAGES
    return LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
        l.en.toLowerCase().includes(langSearch.toLowerCase()) ||
        l.code.includes(langSearch.toLowerCase()),
    )
  }, [langSearch])

  const groupedLanguages = useMemo(() => {
    const groups: any = {}
    filteredLanguages.forEach((l) => {
      if (!groups[l.region]) groups[l.region] = []
      groups[l.region].push(l)
    })
    return groups
  }, [filteredLanguages])

  const createNewChat = async () => {
    try {
      const res = await apiFetch("/api/new-chat", jsonInit({ title: t.newChat }))
      if (!res.ok) throw new Error(`Backend returned ${res.status}`)
      const data = await res.json()
      const newId = data.conversation_id || data.conversation?.id
      if (!newId) throw new Error("Backend did not return a conversation ID")
      const newChat: ChatItem = {
        id: newId,
        title: data.conversation?.title || t.newChat,
        group: "today",
        messages: data.conversation?.messages || [],
      }
      setChats((prev) => [newChat, ...prev])
      setCurrentChatId(newId)
    } catch (error) {
      console.error("Create chat error:", error)
      const newId = Date.now().toString()
      const newChat: ChatItem = {
        id: newId,
        title: t.newChat,
        group: "today",
        messages: [],
      }
      setChats((prev) => [newChat, ...prev])
      setCurrentChatId(newId)
    }
  }

  const deleteChat = async (chatId: string) => {
    try {
      await apiFetch(`/api/conversations/${chatId}`, { method: "DELETE" })
    } catch {}
    setChats((prev) => prev.filter((c) => c.id !== chatId))
    if (currentChatId === chatId) {
      const remaining = chats.filter((c) => c.id !== chatId)
      setCurrentChatId(remaining.length > 0 ? remaining[0].id : null)
    }
    setShowDeleteConfirm(null)
  }

  const clearAllMemories = async () => {
    try {
      await apiFetch("/memory/clear", { method: "POST" })
      setMemories([])
    } catch {}
  }

  const changeLanguage = (code: string) => {
    setLocale(code)
    setShowLang(false)
    localStorage.setItem("vihok_locale", code)

    const newPath = (pathname || `/${locale}`).replace(`/${locale}`, `/${code}`)

    try {
      router.push(newPath)
    } catch (e) {
      console.error("router.push fail", e)
      window.location.href = newPath
    }

    setTimeout(() => {
      const current = window.location.pathname
      if (current !== newPath) {
        window.location.href = newPath
      }
    }, 500)
  }

  const send = async () => {
    if (!input.trim() || isThinking || isStreaming) return
    const q = input
    const userMsg: Message = { role: "user", content: q, id: Date.now().toString(), timestamp: new Date().toISOString() }

    let targetChatId = currentChatId
    if (!targetChatId) {
      const newId = Date.now().toString()
      const newChat: ChatItem = {
        id: newId,
        title: q.slice(0, 35),
        group: "today",
        messages: [],
      }
      setChats((prev) => [newChat, ...prev])
      targetChatId = newId
      setCurrentChatId(newId)
    }

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === targetChatId) {
          const newTitle = c.messages.length === 0 ? q.slice(0, 35) : c.title
          return { ...c, title: newTitle, messages: [...c.messages, userMsg] }
        }
        return c
      }),
    )

    setInput("")

    if (mode === "stream") {
      setIsStreaming(true)
      try {
        const res = await apiFetch(
          "/api/chat/stream",
          jsonInit({
            question: q,
            locale,
            conversation_id: targetChatId,
            mode: "stream",
          }),
        )

        if (!res.ok) throw new Error(`Backend returned ${res.status}`)
        if (!res.body) throw new Error("No response body")
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let fullText = ""
        let pending = ""

        const aiMsgId = (Date.now() + 1).toString()
        const aiMsgTs = new Date().toISOString()
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === targetChatId) {
              return { ...c, messages: [...c.messages, { role: "assistant", content: "", id: aiMsgId, timestamp: aiMsgTs }] }
            }
            return c
          }),
        )

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          pending += decoder.decode(value, { stream: true })
          const lines = pending.split("\n")
          pending = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim()
              if (data === "[DONE]") continue
              fullText += data + " "
              setChats((prev) =>
                prev.map((c) => {
                  if (c.id === targetChatId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) => (m.id === aiMsgId ? { ...m, content: fullText } : m)),
                    }
                  }
                  return c
                }),
              )
            }
          }
        }
        pending += decoder.decode()
        if (pending.startsWith("data: ")) {
          const data = pending.slice(6).trim()
          if (data && data !== "[DONE]") {
            fullText += `${data} `
            setChats((prev) =>
              prev.map((c) => {
                if (c.id === targetChatId) {
                  return {
                    ...c,
                    messages: c.messages.map((m) => (m.id === aiMsgId ? { ...m, content: fullText } : m)),
                  }
                }
                return c
              }),
            )
          }
        }
        await loadMemories()
      } catch (error) {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === targetChatId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.role === "assistant" && m.content === "" ? { ...m, content: `❌ เกิดข้อผิดพลาด: ${error}` } : m,
                ),
              }
            }
            return c
          }),
        )
      } finally {
        setIsStreaming(false)
      }
      return
    }

    setIsThinking(true)
    try {
      const res = await apiFetch(
        "/api/chat",
        jsonInit({
          question: q,
          locale,
          conversation_id: targetChatId,
          mode: mode,
          selected_ai: mode === "single" ? selectedAI : undefined,
        }),
      )
      if (!res.ok) throw new Error(`Backend returned ${res.status}`)
      const data = await res.json()

      let content = data.answer || "ขออภัยครับ ไม่สามารถตอบได้ในขณะนี้"

      if (mode === "compare" && data.all_answers) {
        content = "📊 **เปรียบเทียบคำตอบจากทุก AI:**\n\n"
        const aiNames: Record<string, string> = {
          vihokai: "VihokAI 1.0",
          chatgpt: "ChatGPT",
          gemini: "Gemini",
          deepseek: "DeepSeek",
          kimi: "Kimi",
          meta_ai: "Meta AI",
          claude: "Claude",
        }
        for (const [key, value] of Object.entries(data.all_answers)) {
          const name = aiNames[key] || key
          content += `**${name}:**\n${value}\n\n`
        }
        if (data.final_answer) {
          content += `\n📌 **สรุปโดย Judge:**\n${data.final_answer}`
        }
      }

      const aiMsg: Message = {
        role: "assistant",
        content: content,
        id: (Date.now() + 1).toString(),
        timestamp: new Date().toISOString(),
      }

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === targetChatId) {
            return { ...c, messages: [...c.messages, aiMsg] }
          }
          return c
        }),
      )

      await loadMemories()
    } catch (error) {
      const aiMsg: Message = {
        role: "assistant",
        content: `❌ เกิดข้อผิดพลาด: ${error}`,
        id: (Date.now() + 1).toString(),
        timestamp: new Date().toISOString(),
      }
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === targetChatId) {
            return { ...c, messages: [...c.messages, aiMsg] }
          }
          return c
        }),
      )
    } finally {
      setIsThinking(false)
    }
  }

  const renderChatMessages = () => {
    if (!currentChat || currentChat.messages.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center max-w-[600px] mx-auto">
          <div className="mb-4 drop-shadow-lg">
            <VihokLogoMark size={56} />
          </div>
          <h1 className="text-[28px] font-bold leading-tight text-slate-800 dark:text-white">{t.h1}</h1>
          <p className="text-[13px] text-slate-500 dark:text-white/50 mt-2 max-w-md">{t.sub}</p>
          <div className="mt-4 flex gap-2 text-[11px] text-slate-400 dark:text-white/30">
            <span className="bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">⚡ {t.singleMode}</span>
            <span className="bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">📊 {t.compareMode}</span>
            <span className="bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">🌊 {t.streamMode}</span>
          </div>
          <div className="mt-6 text-[11px] text-slate-400 dark:text-white/30 flex flex-wrap justify-center gap-2">
            {t.popular?.split("·").map((p: string, i: number) => (
              <span key={i} className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                {p.trim()}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-md">
            {t.suggestions?.map((s: string) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="text-left bg-slate-100 dark:bg-[#2f2f2f] hover:bg-slate-200 dark:hover:bg-[#3a3a3a] p-3 rounded-xl text-[12px] text-slate-700 dark:text-white/70 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-[700px] mx-auto space-y-7">
        {currentChat.messages.map((m, index) => {
          const isUser = m.role === "user"
          return (
            <div key={m.id} className={isUser ? "flex justify-end gap-3" : "flex gap-3"}>
              {!isUser && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white dark:bg-white/10 shadow-md overflow-hidden">
                  <VihokLogoMark size={26} />
                </div>
              )}
              <div className={isUser ? "max-w-[75%]" : "max-w-[82%]"}>
                <div
                  className={
                    isUser
                      ? "rounded-2xl rounded-tr-md bg-gradient-to-br from-orange-50 to-orange-100 dark:bg-[#2f2f2f] px-5 py-4 text-slate-800 dark:text-zinc-100"
                      : "rounded-2xl rounded-tl-md bg-gradient-to-br from-blue-50 to-slate-50 dark:bg-[#2a2a2a] px-5 py-4 text-slate-800 dark:text-zinc-100"
                  }
                >
                  <p className="text-sm leading-7 whitespace-pre-wrap">
                    {m.content}
                  </p>
                </div>
                <p className={`mt-1 text-[10px] text-slate-400 dark:text-white/30 ${isUser ? "text-right" : ""}`}>
                  {formatMessageTime(m.timestamp)}
                </p>
              </div>
              {isUser && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-blue-500 text-[10px] font-bold text-white">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>
          )
        })}
        {(isThinking || isStreaming) && (
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white dark:bg-white/10 shadow-md overflow-hidden">
              <VihokLogoMark size={26} />
            </div>
            <div className="max-w-[82%]">
              <div className="rounded-2xl rounded-tl-md bg-gradient-to-br from-blue-50 to-slate-50 dark:bg-[#2a2a2a] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-slate-400 dark:bg-white/60 rounded-full animate-bounce"></span>
                    <span
                      className="w-2 h-2 bg-slate-400 dark:bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-slate-400 dark:bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    ></span>
                  </div>
                  <span className="text-slate-500 dark:text-white/50 text-[12px]">
                    {isStreaming ? t.streaming : t.thinking}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#0f0f0f] text-slate-800 dark:text-white">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 dark:bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-[280px]
          flex-col border-r border-slate-200 dark:border-white/5
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          bg-white dark:bg-[#171717]
        `}
      >
        {/* Logo */}
        <div className="flex h-[88px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <VihokLogoMark size={44} />
            <div>
              <h1 className="text-xl font-bold text-blue-700 dark:text-white">Vihok AI</h1>
              <p className="text-[11px] text-slate-400 dark:text-white/30">{t.tagline}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-6 pb-5">
          <button
            onClick={createNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 py-3.5 font-semibold text-white shadow-lg shadow-orange-100 dark:shadow-none transition hover:scale-[1.01]"
          >
            <Plus size={20} />
            {t.newChat}
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pb-4">
          <div className="relative">
            <span className="absolute left-3.5 top-[10px] text-slate-400 dark:text-white/30">⌕</span>
            <input
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              placeholder={t.searchChat}
              className="w-full bg-slate-100 dark:bg-[#2a2a2a] rounded-full pl-9 pr-4 py-2.5 text-[13px] placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto space-y-1 px-4">
          <NavItem icon={<MessageSquare size={19} />} label={t.navAllChats} active />
          <NavItem
            icon={<Database size={19} />}
            label="Global Library"
            badge="NEW"
            onClick={() => router.push(`/${locale}/library`)}
          />
          <NavItem icon={<Sparkles size={19} />} label={t.navModel} badge={t.badgeNew} />
          {/* ลูกเมนูของ AI Model — หน้า VihokAI Model */}
          <NavItem
            icon={<Crown size={17} />}
            label={t.navVihokModel}
            sub
            onClick={() => router.push(`/${locale}/models`)}
          />
          <NavItem icon={<ImageIcon size={19} />} label={t.navImage} />
          <NavItem icon={<FileText size={19} />} label={t.navDoc} />
          <NavItem icon={<BarChart3 size={19} />} label={t.navAnalyze} />
          <NavItem icon={<Layers3 size={19} />} label={t.navOps} />
          <NavItem icon={<History size={19} />} label={t.chatHistory} />
          <NavItem icon={<Star size={19} />} label={t.navFav} />
          <NavItem icon={<Settings size={19} />} label={t.navSetting} />
        </nav>

        {/* Memory Panel */}
        <div className="mx-4 mb-3 rounded-xl bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-white/5 p-3">
          <div className="text-[11px] font-bold mb-2 flex items-center justify-between">
            <button
              onClick={() => router.push(`/${locale}/memory`)}
              className="flex items-center gap-1.5 hover:text-orange-500 transition"
              title="Kola Memory • Memory & Context"
            >
              <span>🧠 {t.remember}</span>
              <KolaDot />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded-full">
                {memories.length} {t.memoryCount}
              </span>
              {memories.length > 0 && (
                <button
                  onClick={clearAllMemories}
                  className="text-[9px] text-red-400/60 hover:text-red-400 transition"
                >
                  ✕ {t.clearMemory}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {memories.length === 0 ? (
              <div className="text-[11px] text-slate-400 dark:text-white/30 text-center py-2">{t.memoryEmpty}</div>
            ) : (
              memories.map((m, i) => (
                <div key={i} className="text-[11px] bg-white dark:bg-white/5 p-2 rounded-lg truncate">
                  <span className="text-slate-400 dark:text-white/40">{m.question}:</span> {m.answer?.slice(0, 40)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pro Card */}
        <div className="mx-4 mb-3 rounded-2xl border border-orange-200 dark:border-orange-500/20 bg-gradient-to-br from-orange-50 to-white dark:from-orange-500/10 dark:to-transparent p-4">
          <div className="mb-3 flex items-center gap-2">
            <Crown className="text-orange-500" size={21} />
            <span className="font-bold">{t.upgradePro}</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-white/60">
            <p>{t.proLimitless}</p>
            <p>{t.proLatestModel}</p>
            <p>{t.proBigFile}</p>
          </div>
          <button className="mt-3 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-2.5 text-sm font-bold text-white">
            {t.upgradePro}
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-white/5 px-6 py-4">
          <p className="text-xs text-slate-500 dark:text-white/30">{t.poweredBy}</p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-white/20">v4.0</p>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <section className="min-h-screen lg:ml-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white/95 dark:bg-[#212121]/95 px-5 backdrop-blur lg:px-7">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 dark:border-white/10 p-2.5 lg:hidden"
            >
              <Menu size={21} />
            </button>
            <div className="text-[12px] text-slate-500 dark:text-white/40 hidden md:block">
              {backendStatus}
            </div>
            {(isThinking || isStreaming) && (
              <span className="text-[11px] text-orange-500 dark:text-yellow-400 animate-pulse flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-orange-500 dark:bg-yellow-400 rounded-full animate-pulse"></span>
                {isStreaming ? t.streaming : t.thinking}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Mode Selector */}
            <div className="hidden md:flex bg-slate-100 dark:bg-[#2a2a2a] rounded-full p-0.5">
              <button
                onClick={() => setMode("single")}
                className={`px-3 py-1 rounded-full text-[11px] transition ${
                  mode === "single" ? "bg-white dark:bg-white text-black" : "text-slate-600 dark:text-white/60 hover:text-slate-800 dark:hover:text-white"
                }`}
                title={t.tipSingle}
              >
                {t.singleMode}
              </button>
              <button
                onClick={() => setMode("compare")}
                className={`px-3 py-1 rounded-full text-[11px] transition ${
                  mode === "compare" ? "bg-white dark:bg-white text-black" : "text-slate-600 dark:text-white/60 hover:text-slate-800 dark:hover:text-white"
                }`}
                title={t.tipCompare}
              >
                {t.compareMode}
              </button>
              <button
                onClick={() => setMode("stream")}
                className={`px-3 py-1 rounded-full text-[11px] transition ${
                  mode === "stream" ? "bg-white dark:bg-white text-black" : "text-slate-600 dark:text-white/60 hover:text-slate-800 dark:hover:text-white"
                }`}
                title={t.tipStream}
              >
                {t.streamMode}
              </button>
            </div>

            {/* Select AI for Single Mode */}
            {mode === "single" && (
              <select
                value={selectedAI}
                onChange={(e) => setSelectedAI(e.target.value)}
                className="bg-slate-100 dark:bg-[#2a2a2a] text-slate-800 dark:text-white rounded-full px-3 py-1.5 text-[11px] border border-slate-200 dark:border-white/10 focus:outline-none"
              >
                {AI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.icon} {model.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowLang(true)}
              className="bg-slate-100 dark:bg-[#2a2a2a] hover:bg-slate-200 dark:hover:bg-[#333] px-3 py-1.5 rounded-full text-[12px] flex items-center gap-1.5 transition"
            >
              <span>{currentLang.flag}</span>
              <span className="hidden sm:inline">{currentLang.name}</span>
              <span className="text-slate-400 dark:text-white/40">▼</span>
            </button>

            <button className="rounded-xl border border-slate-200 dark:border-white/10 p-2.5 hover:bg-slate-50 dark:hover:bg-white/5">
              <Sun size={19} />
            </button>

            <button className="relative rounded-xl border border-slate-200 dark:border-white/10 p-2.5">
              <Bell size={19} />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">3</span>
            </button>

            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-blue-500 text-sm font-bold text-white">
                      {(user.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left leading-tight">
                    <p className="max-w-[140px] truncate text-sm font-semibold">{user.name || user.email}</p>
                    <p className="text-[11px] text-slate-400 dark:text-white/40">{t.freePlan}</p>
                  </div>
                  <ChevronDown size={16} className={`transition ${showUserMenu ? "rotate-180" : ""}`} />
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] shadow-xl">
                      <div className="border-b border-slate-100 dark:border-white/5 px-4 py-3">
                        <p className="truncate text-sm font-semibold">{user.name || user.email}</p>
                        <p className="truncate text-[11px] text-slate-400 dark:text-white/40">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { setShowUserMenu(false); logoutToHome() }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        ⎋ {t.logout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="hidden md:block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-[12px] font-bold transition"
              >
                {t.login}
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="p-5 lg:p-7">
          {/* Model Selection */}
          <div className="mb-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-orange-500" />
              <h2 className="font-bold">{t.selectModel}</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {AI_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedAI(model.id)}
                  className={`
                    relative flex min-w-[140px] items-center gap-3
                    rounded-xl border bg-white dark:bg-[#1a1a1a] px-4 py-3 text-left
                    transition
                    ${
                      selectedAI === model.id
                        ? "border-orange-400 shadow-md shadow-orange-100 dark:shadow-orange-500/20"
                        : "border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500"
                    }
                  `}
                >
                  <div className={`text-xl font-bold ${model.color}`}>{model.icon}</div>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      {model.name}
                      {(model as any).badge && (
                        <span className="rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-1.5 py-px text-[9px] font-bold text-white">
                          {(model as any).badge}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-white/40">{model.desc}</p>
                    <p className="text-[10px] font-mono text-slate-400/70 dark:text-white/25">{model.engine}</p>
                  </div>
                  {selectedAI === model.id && (
                    <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white">✓</div>
                  )}
                </button>
              ))}
              <button className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-4 text-sm font-semibold">
                {t.more}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_315px]">
            {/* ================= CHAT ================= */}
            <div className="flex min-h-[720px] flex-col rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#1a1a1a] shadow-sm">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-white/10 shadow-sm">
                    <VihokLogoMark size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.assistantName}</p>
                    <p className="text-[11px] text-green-500">
                      ● {t.online} · {AI_MODELS.find(m => m.id === selectedAI)?.name || selectedAI}
                      {AI_MODELS.find(m => m.id === selectedAI)?.engine && (
                        <span className="ml-1 font-mono text-[10px] text-slate-400 dark:text-white/35">
                          ({AI_MODELS.find(m => m.id === selectedAI)?.engine})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button className="rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-white/5">
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {renderChatMessages()}
              </div>

              {/* Composer */}
              <div className="border-t border-slate-100 dark:border-white/5 p-4">
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#2f2f2f] p-3 shadow-sm focus-within:border-blue-400 dark:focus-within:border-blue-400">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={t.typeMessage}
                    className="min-h-[45px] w-full bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-white/30"
                    disabled={isThinking || isStreaming}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                        <Plus size={19} />
                      </button>
                      <button className="hidden items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-4 text-xs font-semibold sm:flex">
                        <Globe size={16} />
                        {t.searchWeb}
                      </button>
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="hidden items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-4 text-xs font-semibold sm:flex"
                      >
                        <Paperclip size={16} />
                        {fileName ? `📎 ${fileName.slice(0, 15)}` : t.uploadFile}
                      </button>
                      <button className="hidden items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-4 text-xs font-semibold md:flex">
                        <Gift size={16} />
                        {t.createImage}
                      </button>
                    </div>
                    <button
                      onClick={send}
                      disabled={isThinking || isStreaming || !input.trim()}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none transition ${
                        isThinking || isStreaming || !input.trim()
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-blue-700"
                      }`}
                    >
                      <Send size={19} />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-white/30">
                  {t.disclaimer}
                </p>
              </div>
            </div>

            {/* ================= RIGHT PANEL ================= */}
            <aside className="space-y-5">
              {/* AI Tools */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-green-500" />
                    <h3 className="font-bold">{t.tools}</h3>
                  </div>
                  <Sparkles size={17} className="text-orange-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {AI_TOOLS.map((tool) => {
                    const Icon = tool.icon
                    const copy = toolTexts[tool.id] || tool
                    return (
                      <button
                        key={tool.id}
                        className="group rounded-xl border border-slate-100 dark:border-white/5 p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-md"
                      >
                        <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-white ${tool.color}`}>
                          <Icon size={18} />
                        </div>
                        <p className="text-xs font-bold">{copy.name}</p>
                        <p className="mt-0.5 text-[9px] text-slate-400 dark:text-white/40">{copy.desc}</p>
                      </button>
                    )
                  })}
                </div>
                <button className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5">
                  {t.viewAll}
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Chat History */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold">{t.chatHistory}</h3>
                  <button className="text-xs font-semibold text-blue-600">{t.viewAll}</button>
                </div>
                <div className="space-y-2">
                  {chats.slice(0, 5).map((chat, index) => (
                    <button
                      key={chat.id}
                      onClick={() => setCurrentChatId(chat.id)}
                      className={`
                        flex w-full items-center gap-3 rounded-xl
                        px-3 py-3 text-left text-xs transition
                        ${
                          currentChat?.id === chat.id
                            ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                            : "hover:bg-slate-50 dark:hover:bg-white/5"
                        }
                      `}
                    >
                      <MessageSquare size={15} className={currentChat?.id === chat.id ? "text-orange-500" : "text-slate-400 dark:text-white/30"} />
                      <span className="flex-1 truncate">{chat.title}</span>
                      <span className="text-[9px] text-slate-400 dark:text-white/30">
                        {formatChatTime(chat.created_at)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pro Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-orange-400 p-6 text-white shadow-lg">
                <div className="relative z-10">
                  <div className="mb-2 flex items-center gap-2">
                    <Zap size={19} />
                    <span className="text-xs font-bold">AI PRO</span>
                  </div>
                  <h3 className="text-xl font-bold leading-tight">
                    {t.unlockAll}
                  </h3>
                  <p className="mt-2 text-xs text-white/80">
                    {t.proUnlockDesc}
                  </p>
                  <button className="mt-5 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-red-500 shadow">
                    {t.upgradePro}
                  </button>
                </div>
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-12 -right-6 flex h-32 w-32 items-center justify-center rounded-full bg-white/10">
                  <div className="rotate-[-25deg] text-5xl">🚀</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Language Modal */}
      {showLang && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowLang(false)}
        >
          <div
            className="bg-white dark:bg-[#1a1a1a] rounded-[28px] w-full max-w-[640px] max-h-[85vh] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[17px]">{t.selectLanguage}</h2>
                <p className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">{t.allLanguages} · {LANGUAGES.length} {t.langCountSuffix}</p>
              </div>
              <button
                onClick={() => setShowLang(false)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 pb-2">
              <div className="relative">
                <span className="absolute left-3.5 top-[9px] text-slate-400 dark:text-white/30">⌕</span>
                <input
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  placeholder={t.langPlaceholder}
                  className="w-full bg-slate-100 dark:bg-[#2a2a2a] rounded-full pl-9 pr-4 py-2.5 text-[13px] placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-3">
              {Object.entries(groupedLanguages).length === 0 ? (
                <div className="text-center text-slate-400 dark:text-white/30 py-8 text-[13px]">{t.noLanguageFound}</div>
              ) : (
                Object.entries(groupedLanguages).map(([region, langs]: [string, any]) => (
                  <div key={region}>
                    <div className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-wider px-2 py-1.5">
                      {REGION_NAMES[region] || region}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {langs.map((l: any) => (
                        <button
                          key={l.code}
                          onClick={() => changeLanguage(l.code)}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 transition ${
                            locale === l.code
                              ? "bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400"
                              : "hover:bg-slate-100 dark:hover:bg-white/10"
                          }`}
                        >
                          <span className="text-[18px]">{l.flag}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-[12px] truncate ${locale === l.code ? "font-medium" : ""}`}>
                              {l.name}
                            </div>
                            <div className={`text-[9px] truncate ${locale === l.code ? "text-orange-500/70 dark:text-orange-400/70" : "text-slate-400 dark:text-white/30"}`}>
                              {l.en}
                            </div>
                          </div>
                          {locale === l.code && <span className="text-[12px] font-bold ml-auto flex-shrink-0">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-white/5 text-center text-[10px] text-slate-400 dark:text-white/20">
              {LANGUAGES.length} {t.langCountSuffix} • {t.poweredBy}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="bg-white dark:bg-[#1e1e1e] rounded-[20px] w-full max-w-[320px] border border-slate-200 dark:border-white/10 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-bold mb-2">{t.confirmDelete}</h3>
            <p className="text-[13px] text-slate-500 dark:text-white/50 mb-4">
              {t.delete} "{chats.find((c) => c.id === showDeleteConfirm)?.title || ""}"?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-slate-100 dark:bg-white/10 py-2 rounded-full text-[13px] hover:bg-slate-200 dark:hover:bg-white/20 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => deleteChat(showDeleteConfirm)}
                className="flex-1 bg-red-500 text-white py-2 rounded-full text-[13px] hover:bg-red-600 transition"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
      />
    </main>
  )
}

// ================= COMPONENTS =================

/** จุดสถานะ Kola Memory (ONLINE = เขียวกระพริบ, OFFLINE = เทา) — ดึงจาก /api/kola/status */
function KolaDot() {
  const [online, setOnline] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    apiFetch("/api/kola/status")
      .then((r) => r.json())
      .then((d) => { if (alive) setOnline(!!d?.online) })
      .catch(() => { if (alive) setOnline(false) })
    return () => { alive = false }
  }, [])
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
        online ? "bg-green-500/10 text-green-500" : "bg-slate-400/10 text-slate-400"
      }`}
      title={online ? "Kola Memory ONLINE" : "Kola Memory OFFLINE"}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "animate-pulse bg-green-500" : "bg-slate-400"}`} />
      {online === null ? "…" : online ? "ONLINE" : "OFFLINE"}
    </span>
  )
}

function NavItem({
  icon,
  label,
  active = false,
  badge,
  sub = false,
  onClick,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  badge?: string
  /** ลูกเมนู — ย่อหน้าต่าง + ตัวอักษรเล็กลง เพื่อให้เห็นว่าอยู่ภายใต้เมนูแม่ */
  sub?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex w-full items-center gap-3 rounded-xl text-sm
        transition
        ${sub ? "ml-4 w-[calc(100%-1rem)] px-3 py-2.5 text-[13px]" : "px-4 py-3"}
        ${
          active
            ? "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-500/20 dark:to-orange-500/10 font-semibold text-orange-600 dark:text-orange-400"
            : "text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5"
        }
      `}
    >
      <span>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[8px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  )
}
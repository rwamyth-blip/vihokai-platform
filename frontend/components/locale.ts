"use client"

// ===== Locale → Font stack กลาง (ใช้ทั้งหน้า main + library) =====
// th: ฟอนต์ไทยก่อน (Sarabun/Prompt/Leelawadee) กันสระลอย
// ja: Hiragino/Noto Sans JP ก่อน
// zh/ko: Noto Sans ของภาษานั้นก่อน
// อื่นๆ: system-ui ปกติ
const FONT_STACKS: Record<string, string> = {
  th: `"Sarabun","Prompt","Leelawadee UI","Tahoma",system-ui,sans-serif`,
  en: `system-ui,-apple-system,"Segoe UI",Roboto,sans-serif`,
  ja: `"Hiragino Kaku Gothic ProN","Hiragino Sans","Noto Sans JP",YuGothic,Meiryo,system-ui,sans-serif`,
  zh: `"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif`,
  ko: `"Noto Sans KR","Malgun Gothic","Apple SD Gothic Neo",system-ui,sans-serif`,
}

const FALLBACK_FONT = FONT_STACKS.en

export function fontForLocale(locale?: string): string {
  const base = (locale || "th").toLowerCase().split("-")[0]
  return FONT_STACKS[base] || FALLBACK_FONT
}

// ===== Locale → ข้อความ UI หน้า Library (ตามภาษาหน้า main) =====
type LibCopy = {
  back: string
  subtitle: string
  sourcesLine: string
  searchPlaceholder: string
  searchBtn: string
  translateLabel: string
  optFollow: (l: string) => string
  optTh: string
  optEn: string
  optOrig: string
  results: string
  items: string
  searching: string
  empty: string
  emptyHint: string
  askTitle: string
  askSub: string
  askPlaceholder: string
  askBtn: string
  refs: string
  disconnected: string
}

const LIB_COPY: Record<string, LibCopy> = {
  th: {
    back: "กลับไปแชท",
    subtitle: "Gateway V1 — ค้นหนังสือ/งานวิจัย/สื่อจากห้องสมุดทั่วโลก",
    sourcesLine: "Open Library + Library of Congress + Crossref + NASA → AI สรุปจาก Context (Python เป็นตัวกลางสืบค้น)",
    searchPlaceholder: "ค้นหนังสือ, งานวิจัย, ภาพถ่าย... เช่น artificial intelligence",
    searchBtn: "ค้นหา",
    translateLabel: "ภาษาคำแปลผลลัพธ์",
    optFollow: (l) => `แปล: ตามหน้านี้ (${l})`,
    optTh: "แปล: ไทย", optEn: "แปล: English", optOrig: "ต้นฉบับ (ไม่แปล)",
    results: "ผลลัพธ์", items: "รายการ",
    searching: "กำลังค้นหา...",
    empty: "ไม่พบผลลัพธ์ — ลองค้นหาด้วยคำอื่น",
    emptyHint: "",
    askTitle: "ถาม AI จาก Global Library",
    askSub: "Python ค้นห้องสมุดให้ก่อน แล้ว AI สรุปจากข้อมูลจริง",
    askPlaceholder: "เช่น อธิบายทฤษฎีหลุมดำให้เข้าใจง่าย...",
    askBtn: "ถาม",
    refs: "📚 แหล่งอ้างอิง",
    disconnected: "❌ ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้",
  },
  en: {
    back: "Back to chat",
    subtitle: "Gateway V1 — books/papers/media from world libraries",
    sourcesLine: "Open Library + Library of Congress + Crossref + NASA → AI summarizes from context (Python searches first)",
    searchPlaceholder: "Search books, papers, photos... e.g. artificial intelligence",
    searchBtn: "Search",
    translateLabel: "Result translation language",
    optFollow: (l) => `Translate: follow page (${l})`,
    optTh: "Translate: Thai", optEn: "Translate: English", optOrig: "Original (no translate)",
    results: "Results", items: "items",
    searching: "Searching...",
    empty: "No results — try other keywords",
    emptyHint: "",
    askTitle: "Ask AI from Global Library",
    askSub: "Python searches the library first, then AI summarizes real data",
    askPlaceholder: "e.g. explain black holes simply...",
    askBtn: "Ask",
    refs: "📚 References",
    disconnected: "❌ Cannot connect to AI right now",
  },
  ja: {
    back: "チャットに戻る",
    subtitle: "Gateway V1 — 世界の図書館から書籍/論文/メディアを検索",
    sourcesLine: "Open Library + 議会図書館 + Crossref + NASA → AIがContextから要約（Pythonが先に検索）",
    searchPlaceholder: "書籍・論文・写真を検索… 例：artificial intelligence",
    searchBtn: "検索",
    translateLabel: "結果の翻訳言語",
    optFollow: (l) => `翻訳: このページに合わせる (${l})`,
    optTh: "翻訳: タイ語", optEn: "翻訳: 英語", optOrig: "原文（翻訳しない）",
    results: "結果", items: "件",
    searching: "検索中...",
    empty: "結果がありません — 別のキーワードで試してください",
    emptyHint: "",
    askTitle: "Global LibraryにAIで質問",
    askSub: "Pythonが先に図書館を検索し、AIが実データから要約",
    askPlaceholder: "例：ブラックホールを分かりやすく説明...",
    askBtn: "質問",
    refs: "📚 参考文献",
    disconnected: "❌ AIに接続できません",
  },
  zh: {
    back: "返回聊天",
    subtitle: "Gateway V1 — 搜索全球图书馆的图书/论文/媒体",
    sourcesLine: "Open Library + 国会图书馆 + Crossref + NASA → AI 根据上下文总结（Python 先检索）",
    searchPlaceholder: "搜索图书、论文、照片… 例如 artificial intelligence",
    searchBtn: "搜索",
    translateLabel: "结果翻译语言",
    optFollow: (l) => `翻译: 跟随本页 (${l})`,
    optTh: "翻译: 泰语", optEn: "翻译: 英语", optOrig: "原文（不翻译）",
    results: "结果", items: "条",
    searching: "搜索中...",
    empty: "没有结果 — 请换关键词试试",
    emptyHint: "",
    askTitle: "向 Global Library AI 提问",
    askSub: "Python 先检索图书馆，AI 再根据真实数据总结",
    askPlaceholder: "例如：简单解释黑洞...",
    askBtn: "提问",
    refs: "📚 参考来源",
    disconnected: "❌ 目前无法连接 AI",
  },
  ko: {
    back: "채팅으로 돌아가기",
    subtitle: "Gateway V1 — 세계 도서관의 도서/논문/미디어 검색",
    sourcesLine: "Open Library + 의회도서관 + Crossref + NASA → AI가 Context에서 요약 (Python이 먼저 검색)",
    searchPlaceholder: "도서, 논문, 사진 검색... 예: artificial intelligence",
    searchBtn: "검색",
    translateLabel: "결과 번역 언어",
    optFollow: (l) => `번역: 이 페이지 따라가기 (${l})`,
    optTh: "번역: 태국어", optEn: "번역: 영어", optOrig: "원문 (번역 안 함)",
    results: "결과", items: "건",
    searching: "검색 중...",
    empty: "결과가 없습니다 — 다른 키워드로 시도하세요",
    emptyHint: "",
    askTitle: "Global Library AI에게 질문",
    askSub: "Python이 먼저 도서관을 검색하고 AI가 실제 데이터로 요약",
    askPlaceholder: "예: 블랙홀을 쉽게 설명...",
    askBtn: "질문",
    refs: "📚 참고 자료",
    disconnected: "❌ 지금 AI에 연결할 수 없습니다",
  },
}

export function libCopyForLocale(locale?: string): LibCopy {
  const base = (locale || "th").toLowerCase().split("-")[0]
  return LIB_COPY[base] || LIB_COPY.en
}

// ===== Locale → ข้อความ UI หน้า VihokAI Model (ตามภาษาหน้า main) =====
type ModelCopy = {
  back: string
  eyebrow: string
  title: string
  subtitle: string
  coreTitle: string
  coreSub: string
  teamTitle: string
  teamSub: string
  compareTitle: string
  compareSub: string
  useModel: string
  useTeam: string
  online: string
  standby: string
  role: string
  engine: string
  bestFor: string
  speed: string
  quality: string
  cost: string
  low: string
  medium: string
  high: string
  fast: string
  balanced: string
  deep: string
  note: string
}

const MODEL_COPY: Record<string, ModelCopy> = {
  th: {
    back: "กลับไปแชท",
    eyebrow: "VIHOKAI MODEL SYSTEM",
    title: "VihokAI Model",
    subtitle: "ทีม AI หลายโมเดลในระบบเดียว — เลือกตัวที่ถนัดงาน แล้วให้หัวหน้าทีมรวมคำตอบ",
    coreTitle: "โมเดลหลัก",
    coreSub: "โมเดลที่พร้อมใช้งานจริงบนแพลตฟอร์ม (อ้างอิง engine บน backend)",
    teamTitle: "AI Team",
    teamSub: "แต่ละตัวรับงานที่ตัวเองถนัด แล้วส่งผลให้ Orchestrator รวมเป็นคำตอบเดียว",
    compareTitle: "เปรียบเทียบความสามารถ",
    compareSub: "เลือกโมเดลให้ตรงกับงาน — เร็ว / สมดุล / วิเคราะห์ลึก",
    useModel: "ใช้โมเดลนี้",
    useTeam: "ใช้ทีม AI (Auto)",
    online: "ออนไลน์",
    standby: "สำรอง",
    role: "บทบาท",
    engine: "Engine",
    bestFor: "เหมาะกับ",
    speed: "ความเร็ว",
    quality: "คุณภาพ",
    cost: "ต้นทุน",
    low: "ต่ำ",
    medium: "กลาง",
    high: "สูง",
    fast: "เร็ว",
    balanced: "สมดุล",
    deep: "วิเคราะห์ลึก",
    note: "หมายเหตุ: ชื่อโมเดลที่แสดงคือ engine จริงที่เรียกผ่าน backend — หากผู้ให้บริการเปลี่ยนชื่อ จะอัปเดตที่ config โดยไม่ต้องแก้หน้าเว็บ",
  },
  en: {
    back: "Back to chat",
    eyebrow: "VIHOKAI MODEL SYSTEM",
    title: "VihokAI Model",
    subtitle: "A multi-model AI team in one system — pick the specialist, let the orchestrator merge the answer",
    coreTitle: "Core Models",
    coreSub: "Models actually available on the platform (real backend engines)",
    teamTitle: "AI Team",
    teamSub: "Each agent handles what it does best, then the Orchestrator merges one final answer",
    compareTitle: "Capability Comparison",
    compareSub: "Match the model to the job — fast / balanced / deep reasoning",
    useModel: "Use this model",
    useTeam: "Use AI Team (Auto)",
    online: "Online",
    standby: "Standby",
    role: "Role",
    engine: "Engine",
    bestFor: "Best for",
    speed: "Speed",
    quality: "Quality",
    cost: "Cost",
    low: "Low",
    medium: "Medium",
    high: "High",
    fast: "Fast",
    balanced: "Balanced",
    deep: "Deep reasoning",
    note: "Note: model names shown are the real engines called through the backend — if a provider renames a model, update config only, no page change needed.",
  },
  zh: {
    back: "返回聊天",
    eyebrow: "VIHOKAI MODEL SYSTEM",
    title: "VihokAI Model",
    subtitle: "多模型 AI 团队集于一个系统 — 选择专长模型，由总控合并最终答案",
    coreTitle: "核心模型",
    coreSub: "平台上真实可用的模型（对应后端 engine）",
    teamTitle: "AI 团队",
    teamSub: "每个智能体负责自己擅长的部分，再由 Orchestrator 合并为单一答案",
    compareTitle: "能力对比",
    compareSub: "按任务选择模型 — 快速 / 均衡 / 深度推理",
    useModel: "使用此模型",
    useTeam: "使用 AI 团队 (Auto)",
    online: "在线",
    standby: "待命",
    role: "角色",
    engine: "引擎",
    bestFor: "适合",
    speed: "速度",
    quality: "质量",
    cost: "成本",
    low: "低",
    medium: "中",
    high: "高",
    fast: "快速",
    balanced: "均衡",
    deep: "深度推理",
    note: "说明：显示的模型名称为后端实际调用的 engine — 若服务商改名，只需更新配置，无需修改页面。",
  },
  ja: {
    back: "チャットに戻る",
    eyebrow: "VIHOKAI MODEL SYSTEM",
    title: "VihokAI Model",
    subtitle: "複数モデルのAIチームを1つのシステムに — 得意なモデルを選び、統括が答えを統合",
    coreTitle: "コアモデル",
    coreSub: "プラットフォームで実際に利用可能なモデル（バックエンドのengine）",
    teamTitle: "AIチーム",
    teamSub: "各エージェントが得意分野を担当し、Orchestratorが1つの回答に統合します",
    compareTitle: "能力比較",
    compareSub: "タスクに合わせて選択 — 高速 / バランス / 深い推論",
    useModel: "このモデルを使う",
    useTeam: "AIチームを使う (Auto)",
    online: "オンライン",
    standby: "待機",
    role: "役割",
    engine: "エンジン",
    bestFor: "得意分野",
    speed: "速度",
    quality: "品質",
    cost: "コスト",
    low: "低",
    medium: "中",
    high: "高",
    fast: "高速",
    balanced: "バランス",
    deep: "深い推論",
    note: "注：表示されるモデル名はバックエンドが実際に呼び出すengineです — 提供元が名称変更した場合は設定のみ更新すればOKです。",
  },
  ko: {
    back: "채팅으로 돌아가기",
    eyebrow: "VIHOKAI MODEL SYSTEM",
    title: "VihokAI Model",
    subtitle: "여러 모델의 AI 팀을 하나의 시스템에 — 전문 모델을 고르면 오케스트레이터가 답을 통합합니다",
    coreTitle: "핵심 모델",
    coreSub: "플랫폼에서 실제 사용 가능한 모델 (백엔드 engine 기준)",
    teamTitle: "AI 팀",
    teamSub: "각 에이전트가 잘하는 일을 맡고 Orchestrator가 하나의 답으로 통합합니다",
    compareTitle: "역량 비교",
    compareSub: "작업에 맞게 선택 — 빠름 / 균형 / 심층 추론",
    useModel: "이 모델 사용",
    useTeam: "AI 팀 사용 (Auto)",
    online: "온라인",
    standby: "대기",
    role: "역할",
    engine: "엔진",
    bestFor: "적합",
    speed: "속도",
    quality: "품질",
    cost: "비용",
    low: "낮음",
    medium: "보통",
    high: "높음",
    fast: "빠름",
    balanced: "균형",
    deep: "심층 추론",
    note: "참고: 표시된 모델명은 백엔드가 실제 호출하는 engine입니다 — 제공사가 이름을 바꾸면 설정만 수정하면 됩니다.",
  },
}

export function modelCopyForLocale(locale?: string): ModelCopy {
  const base = (locale || "th").toLowerCase().split("-")[0]
  return MODEL_COPY[base] || MODEL_COPY.en
}

// ===== Locale → ข้อความโครง Kola หน้า VihokAI Model (ตาม sitemap: Home/Features/AI Models/AI Team/Pricing/Dashboard/Login) =====
export type KolaCopy = {
  navFeatures: string; navModels: string; navTeam: string; navPricing: string; navDashboard: string
  login: string; getStarted: string
  heroBadge: string; heroDesc: string; ctaStart: string; ctaTeam: string; onlineNow: string
  featTitle: string; featSub: string
  fMultiSub: string; fSearchSub: string; fRagSub: string; fCodeSub: string; fAutoSub: string
  formsTitle: string; formsSub: string
  primeDesc: string; primeItems: string[]; usePrime: string
  swiftDesc: string; swiftItems: string[]; useSwift: string
  lineupTitle: string; lineupSub: string
  sparkDesc: string; deepDesc: string; qwenDesc: string
  teamEyebrow: string; teamHeadA: string; teamHeadB: string; teamDesc: string; teamCta: string
  dOrch: string; dRes: string; dCoder: string; dDoc: string; dMem: string
  priceTitle: string; priceSub: string
  freeFeat: string[]; proFeat: string[]; teamFeat: string[]
  freeCta: string; comingSoon: string; perMonth: string; freePrice: string; proPrice: string; teamPrice: string
  missionTitle: string; missionSub: string; openDash: string; sysStatus: string; progress: string; running: string
  ctaTitle: string; ctaSub: string
}

const KOLA_COPY: Record<string, KolaCopy> = {
  th: {
    navFeatures: "Features", navModels: "AI Models", navTeam: "AI Team", navPricing: "Pricing", navDashboard: "Dashboard",
    login: "Login", getStarted: "Get Started",
    heroBadge: "AI COMMANDER FOR A SMARTER TOMORROW",
    heroDesc: "มากกว่า AI คือผู้ช่วยที่คิดแทนคุณ — ทีม AI อัจฉริยะรวมหลายโมเดลในระบบเดียว เพื่อค้นหา วิเคราะห์ เขียนโค้ด และสร้างคำตอบที่ดีที่สุด",
    ctaStart: "เริ่มใช้งาน Kola", ctaTeam: "ดูทีม AI ของเรา", onlineNow: "Kola AI Core Online • Multi-Agent System",
    featTitle: "Features", featSub: "5 ความสามารถหลักในระบบเดียว",
    fMultiSub: "หลายโมเดลในทีมเดียว", fSearchSub: "ค้นหาข้อมูลล่าสุด", fRagSub: "ค้นหาและสรุปเอกสาร", fCodeSub: "เขียนโค้ดและแก้บั๊ก", fAutoSub: "ทำงานอัตโนมัติ",
    formsTitle: "เลือก Kola ที่เหมาะกับคุณ", formsSub: "สองรูปแบบของ AI Commander — งานหนักและงานที่ต้องการความเร็ว",
    primeDesc: "พลังสมองเต็มรูปแบบ สำหรับงานซับซ้อน ต้องการความแม่นยำและคุณภาพสูง",
    primeItems: ["Orchestrator + Judge", "Multi-Agent Team", "Memory & Context", "Deep Research"],
    usePrime: "เริ่มใช้งาน Kola Prime",
    swiftDesc: "เร็ว เบา คุ้มค่า เหมาะกับงานทั่วไปและการใช้งานประจำวัน",
    swiftItems: ["Qwen3 8B", "Low Cost / High Speed", "Semantic Cache", "Simple AI Tasks"],
    useSwift: "เริ่มใช้งาน Kola Swift",
    lineupTitle: "AI Models", lineupSub: "โมเดลผู้เชี่ยวชาญ — ชื่อคือโหมดการทำงาน engine คือ backend จริงที่เรียก",
    sparkDesc: "หัวหน้าทีม — แยกโจทย์ จัดทีม ตัดสินและรวมคำตอบ",
    deepDesc: "สายโค้ด — เขียนโค้ด แก้บั๊ก งานเทคนิคเชิงลึก",
    qwenDesc: "สายเอกสาร — อ่าน PDF สร้าง RAG context และสรุป",
    teamEyebrow: "KOLA INTELLIGENCE TEAM", teamHeadA: "AI ไม่ต้องทำงาน", teamHeadB: "คนเดียวอีกต่อไป",
    teamDesc: "Kola ใช้แนวคิด Multi-Agent ให้ AI แต่ละตัวรับงานที่ถนัด แล้วให้หัวหน้าทีมรวมเป็นคำตอบเดียว",
    teamCta: "ดูรายละเอียด AI Team",
    dOrch: "แยกโจทย์ • จัดทีม • รวมคำตอบ", dRes: "ค้นเว็บ • ข้อมูลล่าสุด", dCoder: "เขียนโค้ด • แก้บั๊ก", dDoc: "อ่านเอกสาร • RAG • สรุป", dMem: "จำบริบท • ต่อเนื่องทุกแชท",
    priceTitle: "Pricing", priceSub: "เริ่มฟรี อัปเกรดเมื่อพร้อม",
    freeFeat: ["55 ครั้ง / 6 ชม.", "AI ครบทุกโมเดล", "Web Search + RAG"],
    proFeat: ["Team 1 คน", "AI Specialists 5 ตัว", "20,000 AI Credits"],
    teamFeat: ["Custom Teams", "150,000 AI Credits", "RAG + Audit Log"],
    freeCta: "เริ่มต้นฟรี", comingSoon: "รอ Kola / Wari ติดตั้ง", perMonth: "/เดือน",
    freePrice: "฿0", proPrice: "฿299", teamPrice: "฿1,490",
    missionTitle: "ดู Kola กำลังทำงาน", missionSub: "Real-time Mission Control — ตัวอย่างการทำงานแบบ Multi-Agent",
    openDash: "เปิด Dashboard", sysStatus: "System Status", progress: "Mission Progress", running: "RUNNING",
    ctaTitle: "ให้ Kola ทำงานแทนคุณ", ctaSub: "หนึ่งคำสั่ง หลาย AI หนึ่งคำตอบที่ผ่านการคิด วิเคราะห์ และตรวจสอบ",
  },
  en: {
    navFeatures: "Features", navModels: "AI Models", navTeam: "AI Team", navPricing: "Pricing", navDashboard: "Dashboard",
    login: "Login", getStarted: "Get Started",
    heroBadge: "AI COMMANDER FOR A SMARTER TOMORROW",
    heroDesc: "More than AI — an assistant that thinks for you. A smart AI team unites multiple models in one system to search, analyze, code and craft the best answer.",
    ctaStart: "Start with Kola", ctaTeam: "Meet our AI team", onlineNow: "Kola AI Core Online • Multi-Agent System",
    featTitle: "Features", featSub: "5 core capabilities in one system",
    fMultiSub: "Many models, one team", fSearchSub: "Fresh web results", fRagSub: "Search & summarize docs", fCodeSub: "Write code & fix bugs", fAutoSub: "Run tasks automatically",
    formsTitle: "Pick the Kola that fits you", formsSub: "Two forms of AI Commander — heavy work and high-speed work",
    primeDesc: "Full brainpower for complex work that needs accuracy and top quality.",
    primeItems: ["Orchestrator + Judge", "Multi-Agent Team", "Memory & Context", "Deep Research"],
    usePrime: "Start with Kola Prime",
    swiftDesc: "Fast, light and cost-effective — perfect for everyday tasks.",
    swiftItems: ["Qwen3 8B", "Low Cost / High Speed", "Semantic Cache", "Simple AI Tasks"],
    useSwift: "Start with Kola Swift",
    lineupTitle: "AI Models", lineupSub: "Specialist models — names are operation modes, engines are the real backends",
    sparkDesc: "Team lead — splits tasks, judges and merges answers.",
    deepDesc: "Code specialist — writes code, fixes bugs, deep technical work.",
    qwenDesc: "Document specialist — reads PDFs, builds RAG context, summarizes.",
    teamEyebrow: "KOLA INTELLIGENCE TEAM", teamHeadA: "AI no longer works", teamHeadB: "alone",
    teamDesc: "Kola uses a multi-agent approach — each AI handles what it does best, then the lead merges one answer.",
    teamCta: "AI Team details",
    dOrch: "Split tasks • assign • merge", dRes: "Web search • fresh data", dCoder: "Write code • fix bugs", dDoc: "Read docs • RAG • summarize", dMem: "Remember context • every chat",
    priceTitle: "Pricing", priceSub: "Start free, upgrade when ready",
    freeFeat: ["55 calls / 6h", "All AI models", "Web Search + RAG"],
    proFeat: ["1-person team", "5 AI Specialists", "20,000 AI Credits"],
    teamFeat: ["Custom teams", "150,000 AI Credits", "RAG + audit log"],
    freeCta: "Start free", comingSoon: "Pending Kola / Wari setup", perMonth: "/month",
    freePrice: "$0", proPrice: "$9", teamPrice: "$49",
    missionTitle: "Watch Kola at work", missionSub: "Real-time Mission Control — a multi-agent demo run",
    openDash: "Open Dashboard", sysStatus: "System Status", progress: "Mission Progress", running: "RUNNING",
    ctaTitle: "Let Kola do the work", ctaSub: "One command, many AIs, one answer that was reasoned, analyzed and verified.",
  },
  zh: {
    navFeatures: "Features", navModels: "AI Models", navTeam: "AI Team", navPricing: "Pricing", navDashboard: "Dashboard",
    login: "Login", getStarted: "Get Started",
    heroBadge: "AI COMMANDER FOR A SMARTER TOMORROW",
    heroDesc: "不只是 AI，更是替你思考的助手 — 多模型智能团队集于一个系统，搜索、分析、写代码，给出最佳答案。",
    ctaStart: "开始使用 Kola", ctaTeam: "认识 AI 团队", onlineNow: "Kola AI Core Online • Multi-Agent System",
    featTitle: "Features", featSub: "一个系统，5 大核心能力",
    fMultiSub: "多模型，一个团队", fSearchSub: "搜索最新信息", fRagSub: "检索并总结文档", fCodeSub: "写代码、修 Bug", fAutoSub: "自动执行任务",
    formsTitle: "选择适合你的 Kola", formsSub: "AI Commander 的两种形态 — 重活与极速",
    primeDesc: "满血大脑，专为复杂任务而生，追求准确与最高质量。",
    primeItems: ["Orchestrator + Judge", "Multi-Agent Team", "Memory & Context", "Deep Research"],
    usePrime: "开始使用 Kola Prime",
    swiftDesc: "快速、轻量、高性价比，适合日常通用任务。",
    swiftItems: ["Qwen3 8B", "Low Cost / High Speed", "Semantic Cache", "Simple AI Tasks"],
    useSwift: "开始使用 Kola Swift",
    lineupTitle: "AI Models", lineupSub: "专家模型 — 名称是工作模式，engine 是真实后端",
    sparkDesc: "团队指挥 — 拆解任务、调度团队、裁决并合并答案。",
    deepDesc: "代码专家 — 写代码、修 Bug、深度技术工作。",
    qwenDesc: "文档专家 — 读 PDF、构建 RAG 上下文并总结。",
    teamEyebrow: "KOLA INTELLIGENCE TEAM", teamHeadA: "AI 不再", teamHeadB: "孤军奋战",
    teamDesc: "Kola 采用 Multi-Agent 理念 — 每个 AI 负责最擅长的事，再由指挥合并为一个答案。",
    teamCta: "AI 团队详情",
    dOrch: "拆解 • 调度 • 合并", dRes: "联网搜索 • 最新数据", dCoder: "写代码 • 修 Bug", dDoc: "读文档 • RAG • 总结", dMem: "记住上下文 • 每一次对话",
    priceTitle: "Pricing", priceSub: "免费开始，随时升级",
    freeFeat: ["55 次 / 6 小时", "全部 AI 模型", "Web Search + RAG"],
    proFeat: ["1 人团队", "5 个 AI 专家", "20,000 AI Credits"],
    teamFeat: ["自定义团队", "150,000 AI Credits", "RAG + 审计日志"],
    freeCta: "免费开始", comingSoon: "等待 Kola / Wari 接入", perMonth: "/月",
    freePrice: "$0", proPrice: "$9", teamPrice: "$49",
    missionTitle: "观看 Kola 工作", missionSub: "Real-time Mission Control — 多智能体演示",
    openDash: "打开 Dashboard", sysStatus: "System Status", progress: "Mission Progress", running: "RUNNING",
    ctaTitle: "让 Kola 替你工作", ctaSub: "一条指令，多个 AI，一个经过思考、分析与验证的答案。",
  },
  ja: {
    navFeatures: "Features", navModels: "AI Models", navTeam: "AI Team", navPricing: "Pricing", navDashboard: "Dashboard",
    login: "Login", getStarted: "Get Started",
    heroBadge: "AI COMMANDER FOR A SMARTER TOMORROW",
    heroDesc: "AIを超える、あなたに代わって考えるアシスタント — 複数モデルを1つのシステムに統合し、検索・分析・コーディングで最良の答えを作ります。",
    ctaStart: "Kolaを始める", ctaTeam: "AIチームを見る", onlineNow: "Kola AI Core Online • Multi-Agent System",
    featTitle: "Features", featSub: "1つのシステムに5つの中核機能",
    fMultiSub: "複数モデル、1つのチーム", fSearchSub: "最新情報を検索", fRagSub: "文書を検索・要約", fCodeSub: "コード作成・バグ修正", fAutoSub: "タスクを自動実行",
    formsTitle: "あなたに合うKolaを選ぶ", formsSub: "AI Commanderの2つの形態 — 重い仕事と高速な仕事",
    primeDesc: "複雑な仕事のためのフルパワー。正確さと最高の品質を追求。",
    primeItems: ["Orchestrator + Judge", "Multi-Agent Team", "Memory & Context", "Deep Research"],
    usePrime: "Kola Primeを始める",
    swiftDesc: "高速・軽量・低コスト — 日常のタスクに最適。",
    swiftItems: ["Qwen3 8B", "Low Cost / High Speed", "Semantic Cache", "Simple AI Tasks"],
    useSwift: "Kola Swiftを始める",
    lineupTitle: "AI Models", lineupSub: "専門家モデル — 名前は動作モード、engineは実際のバックエンド",
    sparkDesc: "チームリーダー — タスクを分解し、判定して回答を統合。",
    deepDesc: "コード専門家 — 実装・バグ修正・深い技術作業。",
    qwenDesc: "文書専門家 — PDFを読み、RAGコンテキストを構築して要約。",
    teamEyebrow: "KOLA INTELLIGENCE TEAM", teamHeadA: "AIはもう", teamHeadB: "一人で働かない",
    teamDesc: "KolaはMulti-Agent方式 — 各AIが得意な仕事を受け持ち、リーダーが1つの回答にまとめます。",
    teamCta: "AIチームの詳細",
    dOrch: "分解 • 采配 • 統合", dRes: "Web検索 • 最新データ", dCoder: "実装 • バグ修正", dDoc: "文書読解 • RAG • 要約", dMem: "文脈を記憶 • 毎回の対話",
    priceTitle: "Pricing", priceSub: "無料で開始、いつでもアップグレード",
    freeFeat: ["55回 / 6時間", "全AIモデル", "Web Search + RAG"],
    proFeat: ["1人チーム", "5人のAI専門家", "20,000 AI Credits"],
    teamFeat: ["カスタムチーム", "150,000 AI Credits", "RAG + 監査ログ"],
    freeCta: "無料で始める", comingSoon: "Kola / Wari 連携待ち", perMonth: "/月",
    freePrice: "$0", proPrice: "$9", teamPrice: "$49",
    missionTitle: "Kolaの仕事を見る", missionSub: "Real-time Mission Control — マルチエージェントのデモ",
    openDash: "Dashboardを開く", sysStatus: "System Status", progress: "Mission Progress", running: "RUNNING",
    ctaTitle: "Kolaに仕事を任せよう", ctaSub: "1つの指示、複数のAI、思考・分析・検証を経た1つの答え。",
  },
  ko: {
    navFeatures: "Features", navModels: "AI Models", navTeam: "AI Team", navPricing: "Pricing", navDashboard: "Dashboard",
    login: "Login", getStarted: "Get Started",
    heroBadge: "AI COMMANDER FOR A SMARTER TOMORROW",
    heroDesc: "AI를 넘어 당신을 대신해 생각하는 비서 — 여러 모델을 하나의 시스템에 모아 검색·분석·코딩으로 최고의 답을 만듭니다.",
    ctaStart: "Kola 시작하기", ctaTeam: "AI 팀 보기", onlineNow: "Kola AI Core Online • Multi-Agent System",
    featTitle: "Features", featSub: "하나의 시스템에 5가지 핵심 기능",
    fMultiSub: "여러 모델, 하나의 팀", fSearchSub: "최신 정보 검색", fRagSub: "문서 검색·요약", fCodeSub: "코드 작성·버그 수정", fAutoSub: "작업 자동 실행",
    formsTitle: "나에게 맞는 Kola 선택", formsSub: "AI Commander의 두 가지 형태 — 무거운 일과 빠른 일",
    primeDesc: "복잡한 일을 위한 풀파워. 정확도와 최고 품질을 추구합니다.",
    primeItems: ["Orchestrator + Judge", "Multi-Agent Team", "Memory & Context", "Deep Research"],
    usePrime: "Kola Prime 시작",
    swiftDesc: "빠르고 가볍고 경제적 — 일상 작업에 최적.",
    swiftItems: ["Qwen3 8B", "Low Cost / High Speed", "Semantic Cache", "Simple AI Tasks"],
    useSwift: "Kola Swift 시작",
    lineupTitle: "AI Models", lineupSub: "전문가 모델 — 이름은 동작 모드, engine은 실제 백엔드",
    sparkDesc: "팀 리더 — 작업 분해·판정·답변 통합.",
    deepDesc: "코드 전문가 — 구현·버그 수정·심층 기술 작업.",
    qwenDesc: "문서 전문가 — PDF 읽기·RAG 컨텍스트 구축·요약.",
    teamEyebrow: "KOLA INTELLIGENCE TEAM", teamHeadA: "AI는 더 이상", teamHeadB: "혼자 일하지 않습니다",
    teamDesc: "Kola는 Multi-Agent 방식 — 각 AI가 잘하는 일을 맡고 리더가 하나의 답으로 합칩니다.",
    teamCta: "AI 팀 자세히",
    dOrch: "분해 • 배정 • 통합", dRes: "웹 검색 • 최신 데이터", dCoder: "구현 • 버그 수정", dDoc: "문서 읽기 • RAG • 요약", dMem: "맥락 기억 • 매 대화",
    priceTitle: "Pricing", priceSub: "무료로 시작, 언제든 업그레이드",
    freeFeat: ["55회 / 6시간", "모든 AI 모델", "Web Search + RAG"],
    proFeat: ["1인 팀", "5 AI 전문가", "20,000 AI Credits"],
    teamFeat: ["커스텀 팀", "150,000 AI Credits", "RAG + 감사 로그"],
    freeCta: "무료 시작", comingSoon: "Kola / Wari 연동 대기", perMonth: "/월",
    freePrice: "$0", proPrice: "$9", teamPrice: "$49",
    missionTitle: "Kola의 일 보기", missionSub: "Real-time Mission Control — 멀티에이전트 데모",
    openDash: "Dashboard 열기", sysStatus: "System Status", progress: "Mission Progress", running: "RUNNING",
    ctaTitle: "Kola에게 일을 맡기세요", ctaSub: "하나의 명령, 여러 AI, 사고·분석·검증을 거친 하나의 답.",
  },
}

export function kolaCopyForLocale(locale?: string): KolaCopy {
  const base = (locale || "th").toLowerCase().split("-")[0]
  return KOLA_COPY[base] || KOLA_COPY.en
}

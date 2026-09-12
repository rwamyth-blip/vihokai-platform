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

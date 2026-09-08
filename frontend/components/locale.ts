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

// frontend/middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// รายชื่อภาษาที่รองรับ
const SUPPORTED_LOCALES = [
  "th", "en", "zh", "ja", "ko", "vi", "ms", "id", "hi", "ur", "my", "km", "lo", "ne", "si", "bn", "pa", "ta",
  "es", "fr", "de", "it", "pt", "ru", "pl", "nl", "sv", "da", "no", "fi", "el", "cs", "hu", "ro", "uk", "bg", "sr", "hr", "sk", "lt", "lv", "et", "sq",
  "ar", "he", "fa", "tr", "ku", "az", "ka", "hy", "ps", "ckb",
  "sw", "ha", "zu", "am", "yo", "ig", "rw", "sn", "so", "ts", "ve", "nr",
  "tl", "mi", "haw", "fj", "sm", "to", "ty", "gl", "eu", "ca",
]
const DEFAULT_LOCALE = "th"

// ไฟล์และโฟลเดอร์ที่ต้องการข้าม (ไม่ต้องเปลี่ยนเส้นทาง)
const IGNORED_PATHS = [
  "/favicon.ico",
  "/_next",
  "/api",
  "/static",
  "/images",
  "/fonts",
  "\\.(ico|png|jpg|jpeg|svg|css|js|json|webp|avif)$"
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ ข้าม favicon.ico และไฟล์ static ทั้งหมด
  if (
    pathname.includes("favicon.ico") ||
    pathname.includes("/_next/") ||
    pathname.includes("/api/") ||
    pathname.includes("/static/") ||
    /\.(ico|png|jpg|jpeg|svg|css|js|json|webp|avif)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Auth pages use their own non-localized routes.
  if (pathname === "/auth" || pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  // ✅ หน้าแรก "/" = landing สาธารณะ (ไม่ต้อง login) — แชทอยู่ /th (บังคับ login ในเพจ)
  if (pathname === "/") {
    return NextResponse.rewrite(new URL("/home", request.url))
  }
  // /home เข้าตรงได้ (landing สาธารณะเช่นกัน)
  if (pathname === "/home" || pathname.startsWith("/home/")) {
    return NextResponse.next()
  }

  // ✅ ตรวจสอบว่า locale ถูกต้องหรือไม่
  const firstSegment = pathname.split("/")[1]
  const secondSegment = pathname.split("/")[2]

  // ถ้า locale ไม่ถูกต้อง และไม่ใช่ไฟล์ static ให้ redirect ไป /th
  if (firstSegment && !SUPPORTED_LOCALES.includes(firstSegment)) {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url))
  }

  // ✅ ถ้าไม่มี locale ใน URL (ไม่ใช่ "/") ให้เพิ่ม locale
  if (!firstSegment) {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url))
  }

  // ป้องกัน URL ภาษาแบบซ้อน เช่น /th/ms ไม่ให้ถูกตีความเป็นหน้าแชท
  if (secondSegment && SUPPORTED_LOCALES.includes(secondSegment)) {
    return NextResponse.redirect(new URL(`/${secondSegment}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  // กำหนดเส้นทางที่ middleware จะทำงาน (ข้ามไฟล์ static ทั้งหมด)
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static (public static files)
     * - .ico, .png, .jpg, .jpeg, .svg, .css, .js, .json, .webp, .avif
     */
    "/((?!api|_next/static|_next/image|favicon.ico|static|.*\\.(?:ico|png|jpg|jpeg|svg|css|js|json|webp|avif)$).*)",
  ],
}
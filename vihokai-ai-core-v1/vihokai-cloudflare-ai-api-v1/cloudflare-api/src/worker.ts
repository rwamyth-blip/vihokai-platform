/**
 * VihokAI edge gate (Cloudflare Worker ตัวจริง).
 *
 * บทบาทมีแค่ 3 อย่าง — ส่วน auth จริงอยู่ที่ backend/api_keys.py:
 *  1. /health ตอบเอง (ไม่ต้องยิง backend)
 *  2. บังคับ X-API-Key รูป vk_<hex> (format check เบาๆ ฝั่ง edge)
 *  3. rate limit เบื้องต้นต่อ key (กันยิงถล่มมาถึง origin) แล้ว forward ไป backend ทั้งก้อน
 *
 * รายละเอียด auth จริง (SHA-256/DB/quota) อยู่ที่ backend —
 * Worker นี้ตั้งใจ "ไม่รู้" ความลับใด นอกจาก shape ของ key
 */

export interface Env {
  BACKEND_URL: string;
  EDGE_RATE_MAX?: string;
  EDGE_RATE_WINDOW?: string;
}

const WINDOW_HITS = new Map<string, number[]>();

function edgeLimited(key: string, limit: number, windowSec: number): boolean {
  const now = Date.now() / 1000;
  const hits = WINDOW_HITS.get(key) ?? [];
  const fresh = hits.filter((t) => now - t < windowSec);
  if (fresh.length >= limit) {
    WINDOW_HITS.set(key, fresh);
    return true;
  }
  fresh.push(now);
  WINDOW_HITS.set(key, fresh);
  return false;
}

function error(status: number, code: string, message: string): Response {
  return Response.json({ detail: { code, message } }, { status });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok", service: "VihokAI API", edge: "Cloudflare" });
    }

    const apiKey = request.headers.get("X-API-Key") || "";
    if (!/^vk_[0-9a-f]{16,64}$/i.test(apiKey)) {
      return error(401, "invalid_api_key", "Invalid API key");
    }

    const limit = Math.max(1, parseInt(env.EDGE_RATE_MAX ?? "60", 10) || 60);
    const windowSec = Math.max(1, parseInt(env.EDGE_RATE_WINDOW ?? "60", 10) || 60);
    if (edgeLimited(apiKey, limit, windowSec)) {
      return error(429, "rate_limited", "API rate limit exceeded, try again later.");
    }

    const backendRequest = new Request(`${env.BACKEND_URL}${url.pathname}${url.search}`, {
      method: request.method,
      headers: {
        "Content-Type": request.headers.get("Content-Type") || "application/json",
        "X-API-Key": apiKey,
        "X-VihokAI-Edge": "cloudflare",
      },
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    });

    let response: Response;
    try {
      response = await fetch(backendRequest);
    } catch {
      return error(502, "backend_unreachable", "Upstream backend is unreachable");
    }

    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("X-VihokAI-Powered-By", "VihokAI");

    return new Response(response.body, { status: response.status, headers });
  },
};

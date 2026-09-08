
# Setup www.vihokai.com

1. ซื้อโดเมนที่ Namecheap/GoDaddy: vihokai.com
2. ไปที่ Vercel Dashboard -> Settings -> Domains -> Add www.vihokai.com
3. Vercel จะให้ CNAME: cname.vercel-dns.com
4. ไปที่ DNS ของโดเมน เพิ่ม:
   - Type: CNAME, Host: www, Value: cname.vercel-dns.com
   - Type: A, Host: @, Value: 76.76.21.21 (Vercel IP)
5. รอ 5 นาที - จะได้ SSL อัตโนมัติ

Backend: api.vihokai.com
- ไปที่ Render -> Custom Domain -> api.vihokai.com
- เพิ่ม CNAME: api -> your-backend.onrender.com

.env อัปเดต:
NEXT_PUBLIC_API_URL=https://api.vihokai.com
FRONTEND_URL=https://www.vihokai.com
RESEND_FROM_EMAIL=ViHok AI <noreply@vihokai.com>

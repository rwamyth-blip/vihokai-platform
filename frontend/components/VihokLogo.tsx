interface VihokLogoMarkProps {
  size?: number
  className?: string
}

/** โลโก้ VihokAI — ตัว V ส้ม-แดงไล่เฉด + จุดฟ้า (ตามภาพแบรนด์) */
export function VihokLogoMark({ size = 44, className = "" }: VihokLogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="VihokAI logo"
    >
      <defs>
        <linearGradient id="vihok-v" x1="8" y1="10" x2="56" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" />
          <stop offset="1" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      {/* ตัว V */}
      <path
        d="M8 12 L26 52 L32 40 L38 52 L56 12 L46 12 L32 42 L18 12 Z"
        fill="url(#vihok-v)"
      />
      {/* จุดฟ้า */}
      <circle cx="50" cy="14" r="5" fill="#38BDF8" />
    </svg>
  )
}

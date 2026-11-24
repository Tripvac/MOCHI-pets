import { useId, type CSSProperties } from "react";
export function isLava(kind: string) {
  return /^lava(?:amber|rose|sage|blue)$/.test(kind);
}
const palettes: Record<string, [string, string, string]> = {
  lavaamber: ["#f8d779", "#f48a28", "#fff0ab"],
  lavarose: ["#d4b4cc", "#dc658d", "#ffe0e9"],
  lavasage: ["#d7dfa5", "#8eac54", "#f0efbd"],
  lavablue: ["#9bbcd2", "#627fc2", "#d3e8f4"],
};
export default function LavaLamp({
  kind,
  animate = true,
  size,
  className = "",
  style,
  decorative = false,
}: {
  kind: string;
  animate?: boolean;
  size?: number;
  className?: string;
  style?: CSSProperties;
  decorative?: boolean;
}) {
  const id = "lava" + useId().replace(/:/g, "");
  const [liquid, wax, shine] = palettes[kind] || palettes.lavaamber;
  return (
    <svg
      className={`lava-lamp ${animate ? "lava-moving" : ""} ${className}`}
      style={style}
      width={size ?? 64}
      height={size ?? 144}
      viewBox="0 0 64 144"
      preserveAspectRatio="xMidYMid meet"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={
        decorative ? undefined : "Лава-лампа с плавно движущимся воском"
      }
    >
      <defs>
        <linearGradient id={id + "metal"}>
          <stop stopColor="#8f662b" />
          <stop offset=".2" stopColor="#e7c66f" />
          <stop offset=".38" stopColor="#b88b38" />
          <stop offset=".65" stopColor="#f1d98a" />
          <stop offset="1" stopColor="#9c702c" />
        </linearGradient>
        <linearGradient id={id + "glass"}>
          <stop stopColor={liquid} />
          <stop offset=".45" stopColor={shine} />
          <stop offset="1" stopColor={liquid} />
        </linearGradient>
        <clipPath id={id + "inside"}>
          <path d="M25 22H39L46 55 53 94Q54 102 46 106H18Q10 102 11 94L18 55Z" />
        </clipPath>
        <filter id={id + "goo"} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" />
          <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 14 -6" />
          <feComposite in="SourceGraphic" operator="atop" />
        </filter>
      </defs>
      <path
        d="M23 19H41L49 55 57 94Q59 104 49 111H15Q5 104 7 94L15 55Z"
        fill={"url(#" + id + "glass)"}
        stroke="#a47c39"
        strokeWidth="1.5"
      />
      <g clipPath={"url(#" + id + "inside)"}>
        <path d="M9 20H56V109H9Z" fill={"url(#" + id + "glass)"} />
        <g fill={wax} filter={"url(#" + id + "goo)"}>
          <ellipse
            className="lava-blob lava-blob-a"
            cx="26"
            cy="89"
            rx="10"
            ry="14"
          />
          <ellipse
            className="lava-blob lava-blob-b"
            cx="39"
            cy="57"
            rx="9"
            ry="12"
          />
          <ellipse
            className="lava-blob lava-blob-c"
            cx="27"
            cy="39"
            rx="7"
            ry="10"
          />
          <ellipse
            className="lava-blob lava-blob-d"
            cx="34"
            cy="100"
            rx="14"
            ry="7"
          />
        </g>
        <path
          d="M24 28 16 90M43 58 49 91"
          fill="none"
          stroke={shine}
          strokeWidth="2.3"
          opacity=".55"
        />
      </g>
      <path
        d="M25 4H39L42 20H22Z"
        fill={"url(#" + id + "metal)"}
        stroke="#9b712d"
        strokeWidth="1.2"
      />
      <path d="M23 5H40M22 19H42" stroke="#f8e8a3" strokeWidth="1.4" />
      <path
        d="M16 108H48L42 124 53 138Q33 144 11 138L22 124Z"
        fill={"url(#" + id + "metal)"}
        stroke="#8b632a"
        strokeWidth="1.4"
      />
      <path
        d="M17 110H47M23 125H41M13 137Q32 141 51 137"
        fill="none"
        stroke="#f6df96"
        strokeWidth="1.3"
      />
      <path
        d="M25 113 27 123 20 135"
        fill="none"
        stroke="#fff0ad"
        strokeWidth="2"
        opacity=".55"
      />
    </svg>
  );
}

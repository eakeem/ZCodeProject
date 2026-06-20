"use client";

import { useEffect, useState } from "react";

/**
 * A small animated candle. `lit` controls whether the flame shows.
 * Used both as a standalone icon and in the candle wall.
 */
export default function Candle({
  lit = true,
  size = 40,
}: {
  lit?: boolean;
  size?: number;
}) {
  const [flick, setFlick] = useState(0);
  useEffect(() => {
    if (!lit) return;
    const id = setInterval(
      () => setFlick((f) => (f + 1) % 2),
      350 + Math.random() * 250,
    );
    return () => clearInterval(id);
  }, [lit]);

  return (
    <span
      className="inline-block align-middle"
      style={{ width: size, height: size * 1.4 }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 56" width={size} height={size * 1.4}>
        {/* flame */}
        {lit && (
          <g className="flame-glow" style={{ transformOrigin: "20px 30px" }}>
            <ellipse
              cx="20"
              cy="18"
              rx="6"
              ry="11"
              fill="#ff9b37"
              opacity="0.95"
              style={{
                transform: flick ? "scale(1.03,0.97)" : "scale(0.97,1.03)",
                transition: "transform 0.3s ease",
              }}
            />
            <ellipse cx="20" cy="20" rx="3" ry="7" fill="#ffe7b0" />
          </g>
        )}
        {/* wick */}
        <rect x="19" y="28" width="2" height="4" fill="#4a4439" />
        {/* candle body */}
        <path
          d="M10 32 h20 v18 a10 10 0 0 1 -20 0 z"
          fill="#f3ece0"
          stroke="#d2cec4"
          strokeWidth="1"
        />
        {/* melted top */}
        <ellipse cx="20" cy="32" rx="10" ry="3" fill="#fbf6ec" />
      </svg>
    </span>
  );
}

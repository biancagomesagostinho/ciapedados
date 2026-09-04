interface RiskRingProps {
  percentual: number;
  colorVar: string;
  size?: number;
}

export function RiskRing({ percentual, colorVar, size = 64 }: RiskRingProps) {
  const raio = (size - 10) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const pct = Math.min(100, Math.max(0, percentual));
  const offset = circunferencia - (pct / 100) * circunferencia;
  const centro = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={centro} cy={centro} r={raio} fill="none" stroke="rgb(var(--border))" strokeWidth="7" />
      <circle
        cx={centro}
        cy={centro}
        r={raio}
        fill="none"
        stroke={`rgb(${colorVar})`}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circunferencia}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${centro} ${centro})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

interface GaugeChartProps {
  label: string;
  displayValue: string;
  percentual: number;
  colorVar?: string;
}

const RAIO = 62;
const CIRCUNFERENCIA = Math.PI * RAIO;

export function GaugeChart({ label, displayValue, percentual, colorVar = "var(--gold)" }: GaugeChartProps) {
  const pct = Math.min(100, Math.max(0, percentual));
  const offset = CIRCUNFERENCIA - (pct / 100) * CIRCUNFERENCIA;

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="96" viewBox="0 0 160 96">
        <path
          d="M 14 84 A 62 62 0 0 1 146 84"
          fill="none"
          stroke="rgb(var(--border))"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 14 84 A 62 62 0 0 1 146 84"
          fill="none"
          stroke={`rgb(${colorVar})`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x="80"
          y="72"
          textAnchor="middle"
          className="fill-text font-serif"
          fontSize="24"
          fontWeight={700}
        >
          {displayValue}
        </text>
      </svg>
      <p className="mt-1 text-center text-sm text-text-muted">{label}</p>
    </div>
  );
}

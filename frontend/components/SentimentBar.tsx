// frontend/components/SentimentBar.tsx
interface SentimentBarProps {
  positive: number;
  neutral: number;
  negative: number;
  rationale?: string;
}

export default function SentimentBar({ positive, neutral, negative, rationale }: SentimentBarProps) {
  const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

  const P = clampPct(positive);
  const N = clampPct(neutral);
  // keep total at 100 visually even if upstream is a bit off
  const Neg = Math.max(0, 100 - P - N);

  return (
    <div className="space-y-3">
      {/* Squared bar (no ovals) */}
      <div
        className="flex overflow-hidden h-6 bg-gray-100 rounded-xl ring-1 ring-gray-200"
        role="img"
        aria-label={`Sentiment distribution: Positive ${P}%, Neutral ${N}%, Negative ${Neg}%.`}
      >
        <div
          className="flex items-center justify-center text-white text-xs font-medium"
          style={{
            width: `${P}%`,
            backgroundColor: 'var(--sage)', // brand green
          }}
          aria-label={`Positive sentiment: ${P}%`}
        >
          {P > 14 && `${P}%`}
        </div>
        <div
          className="flex items-center justify-center text-white text-xs font-medium"
          style={{
            width: `${N}%`,
            backgroundColor: '#94a3b8', // gray-400
            borderLeft: N > 0 && P > 0 ? '1px solid rgba(255,255,255,0.4)' : undefined,
            borderRight: N > 0 && Neg > 0 ? '1px solid rgba(255,255,255,0.4)' : undefined,
          }}
          aria-label={`Neutral sentiment: ${N}%`}
        >
          {N > 14 && `${N}%`}
        </div>
        <div
          className="flex items-center justify-center text-white text-xs font-medium"
          style={{
            width: `${Neg}%`,
            backgroundColor: '#ef4444', // red-500
          }}
          aria-label={`Negative sentiment: ${Neg}%`}
        >
          {Neg > 14 && `${Neg}%`}
        </div>
      </div>

      {/* Legend with square-ish markers */}
      <div className="flex justify-between text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3" style={{ backgroundColor: 'var(--sage)', borderRadius: '6px' }} />
          <span>Positive ({P}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3" style={{ backgroundColor: '#94a3b8', borderRadius: '6px' }} />
          <span>Neutral ({N}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3" style={{ backgroundColor: '#ef4444', borderRadius: '6px' }} />
          <span>Negative ({Neg}%)</span>
        </div>
      </div>

      {rationale && (
        <p className="text-sm text-gray-600">
          {rationale}
        </p>
      )}
    </div>
  );
}

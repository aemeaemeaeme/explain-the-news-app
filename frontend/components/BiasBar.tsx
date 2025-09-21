// frontend/components/BiasBar.tsx
interface BiasBarProps {
  left: number;
  center: number;
  right: number;
  confidence: string;
}

export default function BiasBar({ left, center, right, confidence }: BiasBarProps) {
  const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

  const L = clampPct(left);
  const C = clampPct(center);
  const R = Math.max(0, 100 - L - C); // keep total at 100 visually if upstream is slightly off

  return (
    <div className="space-y-3">
      {/* Squared bar (no pills) */}
      <div
        className="flex overflow-hidden h-6 bg-gray-100 rounded-xl ring-1 ring-gray-200"
        role="img"
        aria-label={`Bias distribution: Left ${L}%, Center ${C}%, Right ${R}%. Confidence ${confidence}.`}
      >
        <div
          className="flex items-center justify-center text-white text-xs font-medium"
          style={{
            width: `${L}%`,
            backgroundColor: '#3b82f6',
          }}
        >
          {L > 14 && `${L}%`}
        </div>
        <div
          className="flex items-center justify-center text-white text-xs font-medium"
          style={{
            width: `${C}%`,
            backgroundColor: '#84a98c',
            borderLeft: C > 0 && L > 0 ? '1px solid rgba(255,255,255,0.4)' : undefined,
            borderRight: C > 0 && R > 0 ? '1px solid rgba(255,255,255,0.4)' : undefined,
          }}
        >
          {C > 14 && `${C}%`}
        </div>
        <div
          className="flex items-center justify-center text-white text-xs font-medium"
          style={{
            width: `${R}%`,
            backgroundColor: '#ef4444',
          }}
        >
          {R > 14 && `${R}%`}
        </div>
      </div>

      {/* Legend with square-ish markers */}
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3" style={{ backgroundColor: '#3b82f6', borderRadius: '6px' }} />
          <span className="text-gray-700">Left ({L}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3" style={{ backgroundColor: '#84a98c', borderRadius: '6px' }} />
          <span className="text-gray-700">Center ({C}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3" style={{ backgroundColor: '#ef4444', borderRadius: '6px' }} />
          <span className="text-gray-700">Right ({R}%)</span>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Confidence: <span className="capitalize font-medium">{confidence}</span>
      </div>
    </div>
  );
}

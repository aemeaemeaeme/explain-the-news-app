interface BiasBarProps {
  left: number;
  center: number;
  right: number;
  confidence: string;
}

export default function BiasBar({ left, center, right, confidence }: BiasBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex rounded-full overflow-hidden h-6 bg-gray-100">
        <div 
          className="bg-[#3b82f6] flex items-center justify-center text-white text-xs font-medium"
          style={{ width: `${left}%` }}
        >
          {left > 15 && `${left}%`}
        </div>
        <div 
          className="bg-[#84a98c] flex items-center justify-center text-white text-xs font-medium"
          style={{ width: `${center}%` }}
        >
          {center > 15 && `${center}%`}
        </div>
        <div 
          className="bg-[#ef4444] flex items-center justify-center text-white text-xs font-medium"
          style={{ width: `${right}%` }}
        >
          {right > 15 && `${right}%`}
        </div>
      </div>
      
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#3b82f6] rounded-full"></div>
          <span className="text-gray-600">Left ({left}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#84a98c] rounded-full"></div>
          <span className="text-gray-600">Center ({center}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#ef4444] rounded-full"></div>
          <span className="text-gray-600">Right ({right}%)</span>
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        Confidence: <span className="capitalize font-medium">{confidence}</span>
      </div>
    </div>
  );
}

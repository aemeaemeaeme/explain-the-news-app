interface SentimentBarProps {
  positive: number;
  neutral: number;
  negative: number;
  rationale?: string;
}

export default function SentimentBar({ positive, neutral, negative, rationale }: SentimentBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex rounded-lg overflow-hidden h-8">
        <div 
          className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
          style={{ width: `${positive}%` }}
          aria-label={`Positive sentiment: ${positive}%`}
        >
          {positive > 15 && `${positive}%`}
        </div>
        <div 
          className="bg-gray-400 flex items-center justify-center text-white text-sm font-medium"
          style={{ width: `${neutral}%` }}
          aria-label={`Neutral sentiment: ${neutral}%`}
        >
          {neutral > 15 && `${neutral}%`}
        </div>
        <div 
          className="bg-red-500 flex items-center justify-center text-white text-sm font-medium"
          style={{ width: `${negative}%` }}
          aria-label={`Negative sentiment: ${negative}%`}
        >
          {negative > 15 && `${negative}%`}
        </div>
      </div>
      
      <div className="flex justify-between text-sm text-gray-600 font-['Inter',system-ui,sans-serif]">
        <span>Positive ({positive}%)</span>
        <span>Neutral ({neutral}%)</span>
        <span>Negative ({negative}%)</span>
      </div>
      
      {rationale && (
        <p className="text-sm text-gray-500 font-['Inter',system-ui,sans-serif]">
          {rationale}
        </p>
      )}
    </div>
  );
}
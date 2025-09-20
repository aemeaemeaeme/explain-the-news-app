import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-[#A3B18A]" />
      <p className="text-gray-600">Analyzing article...</p>
    </div>
  );
}

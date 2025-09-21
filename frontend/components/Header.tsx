import { Newspaper, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-[#A3B18A] bg-opacity-10 rounded-lg">
              <Newspaper className="h-6 w-6 text-[#A3B18A]" />
            </div>
            <span className="text-xl font-bold text-gray-900 font-['Inter',system-ui,sans-serif]">
              Explain the News
            </span>
          </Link>
          
          <Link 
            to="/" 
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors font-['Inter',system-ui,sans-serif]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </header>
  );
}
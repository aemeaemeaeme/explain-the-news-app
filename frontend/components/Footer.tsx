import { Newspaper } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-3 mb-6 md:mb-0">
            <div className="p-2 bg-[#A3B18A] bg-opacity-10 rounded-lg">
              <Newspaper className="h-6 w-6 text-[#A3B18A]" />
            </div>
            <span className="text-xl font-bold text-gray-900 font-['Inter',system-ui,sans-serif]">
              Explain the News
            </span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 text-gray-600 font-['Inter',system-ui,sans-serif]">
            <p className="text-sm">
              AI-powered news analysis for better understanding
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span>Privacy-focused</span>
              <span>•</span>
              <span>Auto-delete</span>
              <span>•</span>
              <span>No tracking</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm font-['Inter',system-ui,sans-serif]">
            © 2024 Explain the News. All content auto-deletes after 24 hours.
          </p>
        </div>
      </div>
    </footer>
  );
}
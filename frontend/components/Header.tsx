import { Newspaper } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-[#8FA573] rounded-lg">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#2C3E50] font-['Inter',system-ui,sans-serif]">
              Explain the News
            </span>
          </Link>
          
          {isHomePage ? (
            <nav className="hidden md:flex items-center gap-8">
              <a 
                href="#how-it-works" 
                className="text-gray-600 hover:text-[#2C3E50] transition-colors font-['Inter',system-ui,sans-serif]"
              >
                How it works
              </a>
              <a 
                href="#examples" 
                className="text-gray-600 hover:text-[#2C3E50] transition-colors font-['Inter',system-ui,sans-serif]"
              >
                Examples
              </a>
              <a 
                href="#contact" 
                className="text-gray-600 hover:text-[#2C3E50] transition-colors font-['Inter',system-ui,sans-serif]"
              >
                Contact
              </a>
            </nav>
          ) : (
            <Link 
              to="/" 
              className="px-4 py-2 bg-[#8FA573] text-white rounded-lg hover:bg-[#7A9162] transition-colors font-['Inter',system-ui,sans-serif]"
            >
              Try Another Link
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
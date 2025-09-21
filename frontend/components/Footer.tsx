import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* First row: Brand and value props */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-8 border-b border-gray-700">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <BookOpen className="h-8 w-8 text-[#8FA573]" />
            <span className="text-2xl font-bold">Unspin</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#8FA573] rounded-full"></div>
              Privacy-focused
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#8FA573] rounded-full"></div>
              Auto-delete
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#8FA573] rounded-full"></div>
              No tracking
            </span>
          </div>
        </div>
        
        {/* Second row: Links and legal */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <Link to="/faq" className="text-gray-300 hover:text-white transition-colors">
              FAQ
            </Link>
            <a href="#contact" className="text-gray-300 hover:text-white transition-colors">
              Contact
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Terms
            </a>
          </div>
          
          <p className="text-gray-400 text-sm">
            © {currentYear} Unspin
          </p>
        </div>
      </div>
    </footer>
  );
}
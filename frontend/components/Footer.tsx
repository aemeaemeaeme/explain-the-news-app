import { Newspaper } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="contact" className="bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center">
          {/* Logo and tagline */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#8FA573] rounded-lg">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#2C3E50] font-['Inter',system-ui,sans-serif]">
              Explain the News
            </span>
          </div>
          
          {/* Value props row */}
          <p className="text-gray-600 mb-8 font-['Inter',system-ui,sans-serif]">
            AI-powered summaries · Bias-aware · Auto-delete · No tracking
          </p>
          
          {/* Links row */}
          <div className="flex items-center gap-6 mb-8">
            <a href="#" className="text-gray-600 hover:text-[#2C3E50] transition-colors font-['Inter',system-ui,sans-serif]">
              About
            </a>
            <a href="#" className="text-gray-600 hover:text-[#2C3E50] transition-colors font-['Inter',system-ui,sans-serif]">
              Privacy
            </a>
            <a href="#" className="text-gray-600 hover:text-[#2C3E50] transition-colors font-['Inter',system-ui,sans-serif]">
              Terms
            </a>
            <a href="#" className="text-gray-600 hover:text-[#2C3E50] transition-colors font-['Inter',system-ui,sans-serif]">
              Contact
            </a>
          </div>
          
          {/* Copyright */}
          <p className="text-gray-500 text-sm font-['Inter',system-ui,sans-serif]">
            © {currentYear} Explain the News
          </p>
        </div>
      </div>
    </footer>
  );
}
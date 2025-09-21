import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer style={{backgroundColor: 'var(--sky)'}}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* First row: Brand and value props */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-8 border-b border-gray-300">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <BookOpen className="h-8 w-8" style={{color: 'var(--sage)'}} />
            <span className="text-2xl headline-font" style={{color: 'var(--ink)'}}>Unspin</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-sm" style={{color: 'var(--ink)'}}>
            <span>Bias-aware analysis</span>
            <span>•</span>
            <span>Privacy-focused</span>
            <span>•</span>
            <span>Auto-delete</span>
            <span>•</span>
            <span>No tracking</span>
          </div>
        </div>
        
        {/* Second row: Links and legal */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <Link to="/how-it-works" className="text-gray-600 hover:text-[var(--ink)] transition-colors font-medium">
              How it Works
            </Link>
            <Link to="/examples" className="text-gray-600 hover:text-[var(--ink)] transition-colors font-medium">
              Examples
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-[var(--ink)] transition-colors font-medium">
              Contact
            </Link>
            <a href="#" className="text-gray-600 hover:text-[var(--ink)] transition-colors font-medium">
              Privacy
            </a>
            <a href="#" className="text-gray-600 hover:text-[var(--ink)] transition-colors font-medium">
              Terms
            </a>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href="#"
              className="btn-blush px-6 py-2 font-semibold text-sm"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Try it free
            </a>
            <p className="text-gray-500 text-sm">
              © {currentYear} Unspin
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
// frontend/components/Footer.tsx
import { BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const handleTryFree = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/');
    // Smooth scroll to the analyzer input if present
    requestAnimationFrame(() => {
      const urlInput = document.querySelector('input[type="url"]') as HTMLInputElement | null;
      if (urlInput) {
        urlInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        urlInput.focus({ preventScroll: true });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Brand + value props */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-8 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-3 group">
            <BookOpen className="h-8 w-8" style={{ color: 'var(--sage)' }} />
            <span
              className="text-2xl font-semibold headline-font tracking-tight"
              style={{ color: 'var(--ink)' }}
              aria-label="Unspin home"
            >
              Unspin<span className="font-bold">.</span>
            </span>
          </Link>

          <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm" style={{ color: 'var(--ink)' }}>
            <li className="px-2 py-1 rounded-full bg-white border border-gray-200">Bias-aware analysis</li>
            <li>•</li>
            <li className="px-2 py-1 rounded-full bg-white border border-gray-200">Multiple perspectives</li>
            <li>•</li>
            <li className="px-2 py-1 rounded-full bg-white border border-gray-200">Privacy-focused</li>
            <li>•</li>
            <li className="px-2 py-1 rounded-full bg-white border border-gray-200">Auto-delete</li>
            <li>•</li>
            <li className="px-2 py-1 rounded-full bg-white border border-gray-200">No tracking</li>
          </ul>
        </div>

        {/* Links + legal */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <nav aria-label="Footer" className="flex items-center gap-6">
            <Link to="/how-it-works" className="text-gray-600 hover:text-[var(--ink)] transition-colors font-medium">
              How it works
            </Link>
            <Link to="/examples" className="text-gray-600 hover:text-[var(--ink)] transition-colors font-medium">
              Examples
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-[var(--ink)] transition-colors font-medium">
              Contact
            </Link>
            <Link to="/privacy" className="text-gray-600 hover:text-[var(--ink)] transition-colors font-medium">
              Privacy
            </Link>
            <Link to="/terms" className="text-gray-600 hover:text-[var(--ink)] transition-colors font-medium">
              Terms
            </Link>
          </nav>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button onClick={handleTryFree} className="btn-sage px-6 py-2 font-semibold text-sm">
              Try it free
            </Button>
            <p className="text-gray-500 text-sm text-center sm:text-left">
              © {currentYear} Unspin. Auto-deletes after 24h · No accounts · No tracking
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

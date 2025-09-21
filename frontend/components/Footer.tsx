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

  const valueProps = [
    'Bias-aware analysis',
    'Multiple perspectives',
    'Privacy-focused',
    'Auto-delete',
    'No tracking',
  ];

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Brand + value props */}
        <div className="mb-6 border-b border-gray-200 pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Brand (smaller) */}
            <Link to="/" className="flex items-center gap-2 group w-fit">
              <BookOpen className="h-7 w-7 shrink-0" style={{ color: 'var(--sage)' }} />
              <span
                className="headline-font text-xl tracking-tight"
                style={{ color: 'var(--ink)' }}
                aria-label="Unspin home"
              >
                Unspin<span className="font-bold">.</span>
              </span>
            </Link>

            {/* Value props */}
            <div className="md:hidden -mx-1 overflow-x-auto">
              <div className="flex items-center gap-3 px-1 text-sm text-gray-700 whitespace-nowrap">
                {valueProps.map((v, i) => (
                  <span key={v} className="shrink-0">
                    {v}
                    {i < valueProps.length - 1 && <span className="mx-2 text-gray-300">•</span>}
                  </span>
                ))}
              </div>
            </div>
            <ul
              className="hidden md:flex flex-wrap items-center gap-2 text-sm"
              style={{ color: 'var(--ink)' }}
            >
              {valueProps.map((v) => (
                <li
                  key={v}
                  className="px-2.5 py-1 rounded-full bg-white border border-gray-200"
                >
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Links + CTA + legal (3-column on desktop) */}
        <div className="grid gap-6 md:grid-cols-[1fr_auto_auto] md:items-center">
          {/* Left: nav links (smaller text, tighter gaps to avoid wrapping) */}
          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] md:text-sm"
          >
            <Link to="/how-it-works" className="text-gray-600 hover:text-[var(--ink)] font-medium">
              How it works
            </Link>
            <Link to="/examples" className="text-gray-600 hover:text-[var(--ink)] font-medium">
              Examples
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-[var(--ink)] font-medium">
              Contact
            </Link>
            <Link to="/privacy" className="text-gray-600 hover:text-[var(--ink)] font-medium">
              Privacy
            </Link>
            <Link to="/terms" className="text-gray-600 hover:text-[var(--ink)] font-medium">
              Terms
            </Link>
          </nav>

          {/* Middle: CTA */}
          <div className="flex md:justify-center">
            <Button onClick={handleTryFree} className="btn-sage px-6 py-2 font-semibold text-sm">
              Try it free
            </Button>
          </div>

          {/* Right: legal (shorter, right-aligned on desktop) */}
          <p className="text-xs md:text-sm text-gray-500 md:text-right">
            © {currentYear} Unspin · No accounts · No tracking
          </p>
        </div>
      </div>
    </footer>
  );
}

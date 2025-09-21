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
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Brand + value props */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-3 group w-fit">
              <BookOpen className="h-8 w-8 shrink-0" style={{ color: 'var(--sage)' }} />
              <span
                className="headline-font text-2xl tracking-tight"
                style={{ color: 'var(--ink)' }}
                aria-label="Unspin home"
              >
                Unspin<span className="font-bold">.</span>
              </span>
            </Link>

            {/* Value props – compact on mobile, pills on desktop */}
            {/* Mobile: single line, scrollable, middot separators */}
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

            {/* Desktop: light pills, no separators */}
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

        {/* Links + legal + CTA */}
        <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between">
          {/* Left: nav links (wrap nicely) */}
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-3">
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

          {/* Right: CTA + legal (stack on mobile) */}
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button onClick={handleTryFree} className="btn-sage px-6 py-2 font-semibold text-sm">
              Try it free
            </Button>
            <p className="text-sm text-gray-500">
              © {currentYear} Unspin · Auto-deletes after 24h · No accounts · No tracking
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

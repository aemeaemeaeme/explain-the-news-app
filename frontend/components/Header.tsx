// frontend/components/Header.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, BookOpen } from 'lucide-react';

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion) return; // Don't auto-hide if user prefers reduced motion

    const THRESHOLD = 8; // small scroll threshold to prevent flicker

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const current = window.scrollY;
        const last = lastScrollYRef.current;

        // Show when scrolling up or near top; hide when scrolling down past threshold
        if (current < 10 || current < last - THRESHOLD) {
          setIsVisible(true);
        } else if (current > last + THRESHOLD) {
          setIsVisible(false);
        }

        lastScrollYRef.current = current;
        tickingRef.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [prefersReducedMotion]);

  const navigationItems = [
    { name: 'How it works', href: '/how-it-works' },
    { name: 'Examples', href: '/examples' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => {
    // simple startsWith match so /examples/xyz still marks Examples
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Skip link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] bg-black text-white px-3 py-2 rounded"
      >
        Skip to content
      </a>

      <header
        className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-transform duration-300 will-change-transform ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2" aria-label="Unspin home">
              <BookOpen className="h-8 w-8" style={{ color: 'var(--sage)' }} />
              <span className="text-xl headline-font" style={{ color: 'var(--ink)' }}>
                Unspin
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8" aria-label="Primary">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`transition-colors font-medium ${
                    isActive(item.href)
                      ? 'text-[var(--ink)]'
                      : 'text-gray-600 hover:text-[var(--ink)]'
                  }`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:block">
              <Button
                onClick={() => navigate('/')}
                className="btn-sage px-6 py-2 font-semibold focus-ring"
              >
                Try it free
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden" aria-label="Open menu">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]" aria-label="Mobile navigation">
                <div className="flex flex-col space-y-4 mt-8">
                  <Link
                    to="/"
                    className="flex items-center space-x-2 pb-4 border-b"
                    onClick={() => setIsOpen(false)}
                    aria-label="Unspin home"
                  >
                    <BookOpen className="h-6 w-6" style={{ color: 'var(--sage)' }} />
                    <span className="text-lg headline-font" style={{ color: 'var(--ink)' }}>
                      Unspin
                    </span>
                  </Link>

                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`transition-colors py-2 font-medium ${
                        isActive(item.href)
                          ? 'text-[var(--ink)]'
                          : 'text-gray-600 hover:text-[var(--ink)]'
                      }`}
                      onClick={() => setIsOpen(false)}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}

                  <Button
                    onClick={() => {
                      navigate('/');
                      setIsOpen(false);
                    }}
                    className="btn-sage mt-4 w-full"
                  >
                    Try it free
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}

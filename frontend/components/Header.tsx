import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, BookOpen } from 'lucide-react';

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      if (current < lastScrollY || current < 10) setIsVisible(true);
      else setIsVisible(false);
      setLastScrollY(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navigationItems = [
    { name: 'How it works', href: '/how-it-works' },
    { name: 'Examples', href: '/examples' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-transform duration-300 will-change-transform ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b`}
      style={{ borderColor: '#eaecef' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <BookOpen className="h-8 w-8 text-[var(--sage)]" />
            <span className="headline-font brand-bold tracking-tight text-2xl text-[var(--ink)]">
              Unspin
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-[var(--gray-600)] hover:text-[var(--ink)] transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Button
              onClick={() => navigate('/')}
              className="btn-blush h-10 px-5 font-semibold focus-ring shadow-sm"
            >
              Try it free
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-8">
                <Link
                  to="/"
                  className="flex items-center gap-2 pb-4 border-b"
                  onClick={() => setIsOpen(false)}
                >
                  <BookOpen className="h-6 w-6 text-[var(--sage)]" />
                  <span className="headline-font brand-bold text-xl tracking-tight text-[var(--ink)]">
                    Unspin
                  </span>
                </Link>

                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-[var(--gray-600)] hover:text-[var(--ink)] transition-colors py-2 font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                <Button
                  onClick={() => {
                    navigate('/');
                    setIsOpen(false);
                  }}
                  className="btn-blush mt-4 w-full font-semibold focus-ring"
                >
                  Try it free
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

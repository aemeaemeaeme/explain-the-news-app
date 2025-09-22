// frontend/components/Hero.tsx
import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PaywallModal from './PaywallModal';
import PasteTextModal from './PasteTextModal';
import backend from '~backend/client';

function normalizeUrl(raw: string): string {
  let u = (raw || '').trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const parsed = new URL(u);
    if (!/^https?:$/i.test(parsed.protocol)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

export default function Hero() {
  const [url, setUrl] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [resetTime, setResetTime] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<string>('');
  const mounted = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Prove the backend client exists
  useEffect(() => {
    mounted.current = true;
    // eslint-disable-next-line no-console
    console.log('[Hero] backend client:', {
      hasBackend: !!backend,
      hasNews: !!(backend as any)?.news,
      hasProcess: typeof (backend as any)?.news?.process === 'function',
      backendKeys: Object.keys(backend || {}),
    });
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if ((location.state as any)?.showPasteModal) {
      setShowPasteModal(true);
      navigate('/', { replace: true });
    }
  }, [location.state, navigate]);

  const processUrlMutation = useMutation({
    mutationFn: async (rawUrl: string) => {
      setStatus('Validating URL…');
      const safe = normalizeUrl(rawUrl);
      if (!safe) throw new Error('Please enter a valid news article URL (http/https).');

      // Sanity: do we even have the generated client method?
      const fn = (backend as any)?.news?.process;
      if (typeof fn !== 'function') {
        // eslint-disable-next-line no-console
        console.error('[Hero] backend.news.process is not a function. backend.news =', (backend as any)?.news);
        throw new Error('Frontend is not linked to backend client (backend.news.process missing).');
      }

      setStatus('Calling backend.news.process…');
      // eslint-disable-next-line no-console
      console.log('[Hero] POST news.process:', { url: safe });

      const res = await fn({ url: safe }); // Encore client call
      // eslint-disable-next-line no-console
      console.log('[Hero] news.process response:', res);
      return res;
    },
    onSuccess: (res: any) => {
      if (!mounted.current) return;
      if (res?.rateLimited) {
        setResetTime(res.resetTime);
        setShowPaywall(true);
        setStatus('Rate limited — showing paywall modal.');
        return;
      }
      if (!res?.success || !res?.id) {
        setStatus(`Backend returned error: ${res?.error || 'unknown error'}`);
        toast({
          title: 'Could not analyze',
          description: res?.error || 'Please try another URL.',
          variant: 'destructive',
        });
        return;
      }
      setStatus(`Success. Navigating to /article/${res.id}`);
      navigate(`/article/${res.id}`);
    },
    onError: (err: any) => {
      const msg = String(err?.message || err || 'Unknown error');
      // eslint-disable-next-line no-console
      console.error('[Hero] Error processing URL:', err);
      setStatus(`Error: ${msg}`);
      toast({
        title: 'Error processing URL',
        description: msg.includes('Failed to fetch')
          ? 'Network / CORS / dev proxy issue. Check browser console → Network tab.'
          : msg,
        variant: 'destructive',
      });
      // Give a loud fallback so it’s obvious something failed
      alert(`Error processing URL:\n${msg}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = url.trim();
    if (!raw) {
      toast({ title: 'Missing URL', description: 'Paste a news article URL to analyze.', variant: 'destructive' });
      return;
    }
    setStatus('Submitting…');
    processUrlMutation.mutate(raw);
  };

  const handlePasteTextSubmit = (_pastedText: string) => {
    toast({
      title: 'Paste text not enabled yet',
      description: 'URL analysis is active. We can wire a pasted-text endpoint next.',
    });
    setShowPasteModal(false);
  };

  return (
    <section className="relative py-24 px-4 bg-[#F7F7F7]">
      <div className="relative max-w-5xl mx-auto text-center">
        <h1 className="display-serif text-5xl md:text-7xl mb-6 leading-tight">
          <span style={{ color: 'var(--ink)' }}>See the Story,</span>
          <br />
          <span style={{ color: 'var(--sage)' }}>Not the Spin</span>
        </h1>

        <p className="text-xl mb-12 max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--gray-600)' }}>
          Drop any news link and get a 30-second summary with bias check, opposing viewpoints, key points and sentiment so you see the whole picture.
        </p>

        <form onSubmit={handleSubmit} className="relative z-10 max-w-2xl mx-auto mb-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                id="url"
                type="url"
                name="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                autoFocus
                placeholder="Paste a news article URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={processUrlMutation.isPending}
                className="w-full h-14 text-lg px-6 rounded-2xl border-2 border-gray-200 bg-white/95 focus:outline-none focus:ring-4 focus:ring-[var(--sage)]/30 focus:border-[var(--sage)] transition-all pointer-events-auto"
                style={{ zIndex: 10, position: 'relative' }}
              />
            </div>
            <Button
              type="submit"
              disabled={!url.trim() || processUrlMutation.isPending}
              className="btn-sage h-14 px-8 font-semibold focus-ring"
              onClick={(e) => {
                // Also wire click to be extra sure the submit fires
                // eslint-disable-next-line no-console
                console.log('[Hero] Explain It clicked');
              }}
            >
              {processUrlMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Explain It'}
            </Button>
          </div>
        </form>

        {/* Tiny status line to prove something is happening */}
        <div className="min-h-[24px] mb-10 text-sm text-gray-500">
          {status && <span>Status: {status}</span>}
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px bg-gray-300 flex-1" />
            <span className="text-sm text-gray-500">or</span>
            <div className="h-px bg-gray-300 flex-1" />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowPasteModal(true)}
            disabled={processUrlMutation.isPending}
            className="w-full h-12 text-base border-2 border-gray-200 bg-white/95 hover:bg-gray-50 transition-all"
          >
            <FileText className="h-5 w-5 mr-2" />
            Paste Article Text Instead
          </Button>
        </div>
      </div>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} resetTime={resetTime} />
      <PasteTextModal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onSubmit={handlePasteTextSubmit}
        isLoading={processUrlMutation.isPending}
      />
    </section>
  );
}

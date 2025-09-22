// frontend/components/Hero.tsx
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PaywallModal from './PaywallModal';
import PasteTextModal from './PasteTextModal';
import backend from '~backend/client';

function normalizeUrl(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    try {
      const u2 = new URL(`https://${s}`);
      return u2.toString();
    } catch {
      return null;
    }
  }
}

function Hero() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<string>('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [resetTime, setResetTime] = useState<number>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if ((location.state as any)?.showPasteModal) {
      setShowPasteModal(true);
      navigate('/', { replace: true });
    }
  }, [location.state, navigate]);

  // -------- URL → backend process (with path fallbacks) --------
  const processUrlMutation = useMutation({
    mutationFn: async (rawUrl: string) => {
      setStatus('Validating URL…');
      const safe = normalizeUrl(rawUrl);
      if (!safe) throw new Error('Please enter a valid news article URL (http/https).');

      // 1) Generated client call
      const fn = (backend as any)?.news?.process;
      if (typeof fn === 'function') {
        setStatus('Calling backend.news.process (client)…');
        try {
          return await fn({ url: safe });
        } catch (e) {
          console.warn('[Hero] client call failed, trying direct fetch…', e);
        }
      } else {
        console.warn('[Hero] backend.news.process not on client, using direct fetch…');
      }

      // 2) Direct path #1
      setStatus('Calling /news/article/process…');
      try {
        const r1 = await fetch('/news/article/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: safe }),
        });
        if (!r1.ok) throw new Error(`HTTP ${r1.status}`);
        return await r1.json();
      } catch (e) {
        console.warn('[Hero] /news/article/process failed, trying /article/process…', e);
      }

      // 3) Direct path #2
      setStatus('Calling /article/process…');
      const r2 = await fetch('/article/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: safe }),
      });
      if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
      return await r2.json();
    },

    onSuccess: (res: any) => {
      if (res?.rateLimited) {
        setResetTime(res.resetTime);
        setShowPaywall(true);
        setStatus('Rate limited — showing paywall.');
        return;
      }
      if (!res?.success || !res?.id) {
        const msg = res?.error || 'Unknown error from backend.';
        setStatus(`Backend error: ${msg}`);
        toast({ title: 'Could not analyze', description: msg, variant: 'destructive' });
        return;
      }
      setStatus('Success. Opening article…');
      navigate(`/article/${res.id}`);
    },

    onError: (err: any) => {
      const msg = String(err?.message || err || 'Unknown error');
      console.error('[Hero] Error processing URL:', err);
      setStatus(`Error: ${msg}`);
      toast({
        title: 'Error processing URL',
        description: msg.includes('Failed to fetch')
          ? 'Network / routing issue. Check your Network tab for the failing request.'
          : msg,
        variant: 'destructive',
      });
      alert(`Error processing URL:\n${msg}`);
    },
  });

  // -------- Paste Text → existing explain endpoint (unchanged) --------
  const processTextMutation = useMutation({
    mutationFn: async (pastedText: string) => {
      setStatus('Submitting pasted text…');
      return backend.news.explain({ url: '', pastedText });
    },
    onSuccess: (response: any) => {
      setShowPasteModal(false);
      navigate('/article/temp', { state: { analysis: response } });
    },
    onError: (error: any) => {
      console.error('[Hero] Error processing pasted text:', error);
      toast({
        title: 'Connection Error',
        description: "Can't reach the server. Check your connection and try again.",
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setStatus('Starting…');
    processUrlMutation.mutate(url);
  };

  const handlePasteTextSubmit = (pastedText: string) => {
    processTextMutation.mutate(pastedText);
  };

  const isPending = processUrlMutation.isPending || processTextMutation.isPending;

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
                disabled={isPending}
                className="w-full h-14 text-lg px-6 rounded-2xl border-2 border-gray-200 bg-white/95 focus:outline-none focus:ring-4 focus:ring-[var(--sage)]/30 focus:border-[var(--sage)] transition-all pointer-events-auto"
                style={{ zIndex: 10, position: 'relative' }}
              />
            </div>
            <Button
              type="submit"
              disabled={!url.trim() || isPending}
              className="btn-sage h-14 px-8 font-semibold focus-ring"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Explain It'}
            </Button>
          </div>
        </form>

        {!!status && (
          <div className="text-sm text-gray-500 mb-8" aria-live="polite">
            {status}
          </div>
        )}

        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px bg-gray-300 flex-1" />
            <span className="text-sm text-gray-500">or</span>
            <div className="h-px bg-gray-300 flex-1" />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowPasteModal(true)}
            disabled={isPending}
            className="w-full h-12 text-base border-2 border-gray-200 bg-white/95 hover:bg-gray-50 transition-all"
          >
            <FileText className="h-5 w-5 mr-2" />
            Paste Article Text Instead
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-3 text-sm mb-4" style={{ color: 'var(--gray-600)' }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full chip-mist">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            Bias-aware
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full chip-mist">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
            Balanced summaries
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full chip-sky">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ec4899' }} />
            Multiple perspectives
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full chip-mist">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#84cc16' }} />
            Key quotes & sources
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full chip-blush">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#a855f7' }} />
            Sentiment & common ground
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full chip-mist">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f97316' }} />
            Works on most sites
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full chip-mist">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#06b6d4' }} />
            Auto-deletes after 24h
          </div>
        </div>
      </div>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} resetTime={resetTime} />
      <PasteTextModal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onSubmit={handlePasteTextSubmit}
        isLoading={isPending}
      />
    </section>
  );
}

export default Hero;

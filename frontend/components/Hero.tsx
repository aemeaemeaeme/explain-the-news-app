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

function normalizeUrl(raw: string): string {
  let u = (raw || '').trim();
  if (!u) return '';
  // If user pasted without scheme, assume https
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  // Still invalid? bail.
  try {
    // will throw if invalid
    const parsed = new URL(u);
    // Only allow http(s)
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

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if ((location.state as any)?.showPasteModal) {
      setShowPasteModal(true);
      navigate('/', { replace: true });
    }
  }, [location.state, navigate]);

  // ⬇️ This mutation calls YOUR backend (Encore client), not the article URL.
  const processUrlMutation = useMutation({
    mutationFn: async (rawUrl: string) => {
      const safe = normalizeUrl(rawUrl);
      if (!safe) {
        throw new Error('Please enter a valid news article URL (http/https).');
      }
      // IMPORTANT: use backend.news.process — this avoids CORS and “Failed to fetch”
      const res = await backend.news.process({ url: safe });
      return res;
    },
    onSuccess: (res: any) => {
      // Handle rate limit response from backend
      if (res?.rateLimited) {
        setResetTime(res.resetTime);
        setShowPaywall(true);
        return;
      }
      if (!res?.success || !res?.id) {
        toast({
          title: 'Could not analyze',
          description: res?.error || 'Please try another URL.',
          variant: 'destructive',
        });
        return;
      }
      // Navigate to the stored article
      navigate(`/article/${res.id}`);
    },
    onError: (err: any) => {
      // This is where browsers used to throw “TypeError: Failed to fetch”
      // because the app tried to fetch the third-party URL directly.
      toast({
        title: 'Error processing URL',
        description: String(err?.message || 'Network error. Please try again.'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast({ title: 'Missing URL', description: 'Paste a news article URL to analyze.', variant: 'destructive' });
      return;
    }
    processUrlMutation.mutate(url);
  };

  // Optional: keep the "Paste Text" flow if you have a backend endpoint for raw text.
  // If you do not, we’ll just show a toast for now.
  const handlePasteTextSubmit = (pastedText: string) => {
    if (!pastedText.trim()) {
      toast({ title: 'No text provided', description: 'Paste the article text to analyze.', variant: 'destructive' });
      return;
    }
    // If you later add a backend endpoint (e.g., backend.news.processText),
    // call it here and navigate to /article/temp with the response.
    toast({
      title: 'Paste text not enabled (yet)',
      description: 'URL analysis works now. Add a backend endpoint for pasted text when ready.',
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

        <form onSubmit={handleSubmit} className="relative z-10 max-w-2xl mx-auto mb-8">
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
            >
              {processUrlMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Explain It'}
            </Button>
          </div>
        </form>

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
        isLoading={processUrlMutation.isPending}
      />
    </section>
  );
}

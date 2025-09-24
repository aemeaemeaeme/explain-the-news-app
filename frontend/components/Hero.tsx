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

type ExplainResponse = {
  meta: { status: 'full' | 'limited' | 'error'; url: string; site?: string | null; source?: string };
  header: { title: string; byline: string | null; read_time_min: number | null; tone: string };
  [k: string]: any;
};

const API_URL = '/api/news/explain'; // Encore endpoints are always under /api/<service>/<path>

export default function Hero() {
  const [url, setUrl] = useState('');
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

  async function callExplain(body: { url?: string; pastedText?: string }): Promise<ExplainResponse> {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });

    const text = await res.text();

    if (/<!doctype html/i.test(text)) {
      throw new Error('Unexpected non-JSON (HTML) from /api/news/explain — request hit the frontend instead of the API.');
    }

    if (!res.ok) {
      try {
        const j = JSON.parse(text);
        const msg = j?.errors?.[0]?.message || j?.message || `${res.status} ${res.statusText}`;
        throw new Error(msg);
      } catch {
        const snippet = text.slice(0, 220).replace(/\s+/g, ' ');
        throw new Error(`HTTP ${res.status} – ${res.statusText}. Preview: ${snippet}`);
      }
    }

    try {
      return JSON.parse(text) as ExplainResponse;
    } catch {
      const snippet = text.slice(0, 220).replace(/\s+/g, ' ');
      throw new Error(`Unexpected non-JSON response from server. Preview: ${snippet}`);
    }
  }

  const processMutation = useMutation({
    mutationFn: async ({ url, pastedText }: { url?: string; pastedText?: string }) => {
      return callExplain({ url, pastedText });
    },
    onSuccess: (response) => {
      if (response?.meta?.status === 'limited' && !response?.meta?.source) {
        toast({
          title: 'Limited Analysis',
          description: 'Access restricted — analysis based on available metadata.',
          variant: 'default',
        });
      }
      // ✅ send user to the new results page
      navigate('/news-result', { state: { analysis: response } });
      setShowPasteModal(false);
    },
    onError: (err: any) => {
      const msg = (err?.message || 'Failed to reach the server').toString();
      alert(`Error processing URL:\n${msg}`);
      toast({ title: 'Request failed', description: msg, variant: 'destructive' });
      console.error('[Hero] Error processing URL:', err);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = url.trim();
    if (!raw) return;
    try {
      const u = new URL(raw);
      if (!/^https?:$/i.test(u.protocol)) throw new Error('URL must start with http or https');
      processMutation.mutate({ url: raw });
    } catch (e: any) {
      toast({
        title: 'Invalid URL',
        description: e?.message || 'Please enter a valid article URL.',
        variant: 'destructive',
      });
    }
  };

  const handlePasteTextSubmit = (pastedText: string) => {
    if (!pastedText?.trim()) {
      toast({ title: 'Empty text', description: 'Paste the article text first.', variant: 'destructive' });
      return;
    }
    processMutation.mutate({ pastedText });
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
                disabled={processMutation.isPending}
                className="w-full h-14 text-lg px-6 rounded-2xl border-2 border-gray-200 bg-white/95 focus:outline-none focus:ring-4 focus:ring-[var(--sage)]/30 focus:border-[var(--sage)] transition-all pointer-events-auto"
                style={{ zIndex: 10, position: 'relative' }}
              />
            </div>
            <Button
              type="submit"
              disabled={!url.trim() || processMutation.isPending}
              className="btn-sage h-14 px-8 font-semibold focus-ring"
            >
              {processMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Explain It'}
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
            disabled={processMutation.isPending}
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
        isLoading={processMutation.isPending}
      />
    </section>
  );
}

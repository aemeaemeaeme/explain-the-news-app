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

  const processUrlMutation = useMutation({
    mutationFn: async ({ url, pastedText }: { url?: string; pastedText?: string }) => {
      // Use the generated Encore client ONLY. No manual fetch.
      if (pastedText && (backend as any).news?.explain) {
        return await (backend as any).news.explain({ url: url ?? '', pastedText });
      }
      if ((backend as any).news?.process) {
        return await (backend as any).news.process({ url: url ?? '' });
      }
      throw new Error('Backend API not available');
    },

    onSuccess: (response: any) => {
      // Ensure we only push serializable data into history state
      let analysis: any;
      try {
        analysis = JSON.parse(JSON.stringify(response));
      } catch {
        analysis = { meta: { status: 'error' }, raw: String(response) };
      }

      if (analysis?.status === 'limited' && analysis?.meta?.source !== 'user_input') {
        toast({
          title: 'Limited Analysis',
          description: 'Access restricted — analysis based on metadata/neutral context.',
          variant: 'default',
        });
      }

      navigate('/article/temp', { state: { analysis } });
      setShowPasteModal(false);
    },

    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error';
      // Keep logs clone-safe (string only)
      console.error('[Hero] Error processing URL:', msg);
      alert(`Error processing URL:\n${msg}`);
      toast({
        title: 'Request failed',
        description: msg.includes('fetch') ? 'Could not reach the API.' : msg,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    try {
      new URL(url);
      processUrlMutation.mutate({ url });
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid news article URL.',
        variant: 'destructive',
      });
    }
  };

  const handlePasteTextSubmit = (pastedText: string) => {
    processUrlMutation.mutate({ pastedText });
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
          Drop any news link and get a 30-second summary with bias check, opposing viewpoints, key
          points and sentiment so you see the whole picture.
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

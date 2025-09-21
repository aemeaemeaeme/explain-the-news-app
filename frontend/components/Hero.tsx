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

  // Open paste-text modal when navigated with state
  useEffect(() => {
    if (location.state?.showPasteModal) {
      setShowPasteModal(true);
      navigate('/', { replace: true });
    }
  }, [location.state, navigate]);

  const processUrlMutation = useMutation({
    mutationFn: async ({ url, pastedText }: { url?: string; pastedText?: string }) => {
      return backend.news.explain({ url: url || '', pastedText });
    },
    onSuccess: (response) => {
      if (response.status === 'limited' && response.meta.source !== 'user_input') {
        toast({
          title: 'Limited Analysis',
          description: 'Access restricted — analysis based on metadata/neutral context.',
          variant: 'default',
        });
      }
      navigate('/article/temp', { state: { analysis: response } });
      setShowPasteModal(false);
    },
    onError: (error: any) => {
      console.error('Error processing URL:', error);
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
        <h1 className="headline-font text-5xl md:text-7xl mb-6 leading-tight">
          <span style={{ color: 'var(--ink)', fontWeight: 'bold' }}>See the Story,</span>
          <br />
          <span style={{ color: 'var(--sage)', fontWeight: 'bold' }}>Not the Spin</span>
        </h1>

        <p
          className="text-xl mb-12 max-w-3xl mx-auto leading-relaxed"
          style={{ color: 'var(--gray-600)' }}
        >
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
                className="w-full h-14 text-lg px-6 rounded-2xl border-2 border-gray-200 bg-white/95 transition-all pointer-events-auto focus-ring"
                style={{ zIndex: 10, position: 'relative' }}
                aria-label="News article URL"
              />
            </div>

            <Button
              type="submit"
              disabled={!url.trim() || processUrlMutation.isPending}
              className="btn-sage h-14 px-8 headline-font text-base font-bold shadow-sm focus-ring"
              aria-label="Explain this article"
            >
              {processUrlMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Explain It'
              )}
            </Button>
          </div>
        </form>

        {/* Alternative option */}
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
            className="btn-blush w-full h-12 text-base font-semibold focus-ring"

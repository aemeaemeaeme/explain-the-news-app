import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

export default function Hero() {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const processUrlMutation = useMutation({
    mutationFn: (url: string) => backend.news.process({ url }),
    onSuccess: (response) => {
      if (response.success && response.id) {
        navigate(`/article/${response.id}`);
      } else {
        console.warn('Process response:', response);
        toast({
          title: 'Processing Failed',
          description: response.error || "We couldn't process this article. Please try another URL.",
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      console.error('Error processing URL:', error);
      toast({
        title: 'Error',
        description: "Can't reach the server. Try again in a moment.",
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      new URL(url); // quick validity check
      processUrlMutation.mutate(url);
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid news article URL.',
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="relative py-24 px-4 bg-[#F7F7F7]">
      <div className="relative max-w-5xl mx-auto text-center">
        <h1 className="display-font text-5xl md:text-7xl mb-6 leading-tight">
          <span style={{color: 'var(--navy)'}}>See the Story,</span>
          <br />
          <span style={{color: 'var(--olive)'}}>Not the Spin</span>
        </h1>

        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Drop any news link and get a 30-second summary with bias check, opposing viewpoints, key points and sentiment so you see the whole picture.
        </p>

        <form onSubmit={handleSubmit} className="relative z-10 max-w-2xl mx-auto mb-12">
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
                className="w-full h-14 text-lg px-6 rounded-2xl border-2 border-gray-200 bg-white/95 focus:outline-none focus:ring-4 focus:ring-[var(--olive)]/30 focus:border-[var(--olive)] transition-all pointer-events-auto"
                style={{zIndex: 10, position: 'relative'}}
              />
            </div>
            <Button
              type="submit"
              disabled={!url.trim() || processUrlMutation.isPending}
              className="btn-olive h-14 px-8 rounded-2xl font-semibold focus-ring"
            >
              {processUrlMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Explain It'
              )}
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{backgroundColor: 'var(--sage)', color: 'var(--navy)'}}>
            <div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--olive)'}}></div>
            Bias-aware, balanced summaries
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{backgroundColor: 'var(--sky)', color: 'var(--navy)'}}>
            <div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--accent-blue)'}}></div>
            Multiple perspectives
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{backgroundColor: 'var(--sage)', color: 'var(--navy)'}}>
            <div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--olive)'}}></div>
            Key quotes & sources
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{backgroundColor: 'var(--sky)', color: 'var(--navy)'}}>
            <div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--accent-red)'}}></div>
            Sentiment & common ground
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{backgroundColor: 'var(--sage)', color: 'var(--navy)'}}>
            <div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--olive)'}}></div>
            Works on any site • Auto-deletes after 24h • No signup
          </div>
        </div>
      </div>
    </section>
  );
}
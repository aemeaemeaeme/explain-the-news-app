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
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 39px,
              #8FA573 40px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 39px,
              #8FA573 40px
            )
          `,
        }}
      />
      
      <div className="relative max-w-5xl mx-auto text-center">
        <h1 className="fraunces-font text-5xl md:text-6xl mb-6 leading-tight">
          <span className="text-[#0B1B2B]">See the Story</span>
          <span className="block text-[#8FA573]">Not the Spin</span>
        </h1>

        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Drop any news link and get a 30-second summary with bias check, opposing viewpoints, key quotes, and sentiment—so you see the whole picture.
        </p>

        <form onSubmit={handleSubmit} className="relative z-10 max-w-2xl mx-auto mb-12">
          <div className="flex gap-4">
            <Input
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
              className="relative flex-1 h-14 text-lg px-6 rounded-2xl border-2 border-gray-200 focus:border-[#A3B18A] bg-white pointer-events-auto z-10"
            />
            <Button
              type="submit"
              disabled={!url.trim() || processUrlMutation.isPending}
              className="h-14 px-8 bg-[#8FA573] hover:bg-[#738a5f] text-white font-semibold rounded-2xl"
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
          <div className="flex items-center gap-2 bg-[#A3B18A]/10 px-4 py-2 rounded-full border border-[#A3B18A]/20">
            <div className="w-2 h-2 bg-[#A3B18A] rounded-full"></div>
            Bias-aware, balanced summaries
          </div>
          <div className="flex items-center gap-2 bg-[#D9EAF7] px-4 py-2 rounded-full border border-[#D9EAF7]">
            <div className="w-2 h-2 bg-[#0B1B2B] rounded-full"></div>
            Multiple perspectives
          </div>
          <div className="flex items-center gap-2 bg-[#A3B18A]/10 px-4 py-2 rounded-full border border-[#A3B18A]/20">
            <div className="w-2 h-2 bg-[#A3B18A] rounded-full"></div>
            Key quotes & sources
          </div>
          <div className="flex items-center gap-2 bg-[#FFE8D6] px-4 py-2 rounded-full border border-[#FFE8D6]">
            <div className="w-2 h-2 bg-[#0B1B2B] rounded-full"></div>
            Sentiment & common ground
          </div>
          <div className="flex items-center gap-2 bg-[#D9EAF7] px-4 py-2 rounded-full border border-[#D9EAF7]">
            <div className="w-2 h-2 bg-[#0B1B2B] rounded-full"></div>
            Auto-deletes after 24h · No signup
          </div>
          <div className="flex items-center gap-2 bg-[#A3B18A]/10 px-4 py-2 rounded-full border border-[#A3B18A]/20">
            <div className="w-2 h-2 bg-[#A3B18A] rounded-full"></div>
            Works on any site
          </div>
        </div>
      </div>
    </section>
  );
}
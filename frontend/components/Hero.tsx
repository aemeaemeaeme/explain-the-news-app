import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Newspaper } from 'lucide-react';
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
      const msg =
        error?.message ||
        error?.response?.data?.error ||
        'Something went wrong. Please try again.';
      toast({
        title: 'Error',
        description: msg,
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
        className="absolute inset-0 opacity-20"
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
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight font-['Inter',system-ui,sans-serif]">
          <span className="text-[#2C3E50]">See the Story,</span>
          <span className="block text-[#8FA573]">Not the Spin.</span>
        </h1>

        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-['Inter',system-ui,sans-serif]">
          Drop any news link and get a 30-second summary with bias check, opposing viewpoints, key insights, and sentiment—so you see the whole picture.
        </p>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-12">
          <div className="flex gap-4">
            <Input
              type="url"
              placeholder="Paste a news article URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 h-14 text-lg px-6 rounded-2xl border-2 border-gray-200 focus:border-[#8FA573] bg-white font-['Inter',system-ui,sans-serif]"
            />
            <Button
              type="submit"
              disabled={(() => {
                if (processUrlMutation.isPending) return true;
                if (!url.trim()) return true;
                try {
                  new URL(url);
                  return false;
                } catch {
                  return true;
                }
              })()}
              className="h-14 px-8 bg-[#8FA573] hover:bg-[#7A9162] text-white font-semibold rounded-2xl font-['Inter',system-ui,sans-serif]"
            >
              {processUrlMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Explain It'
              )}
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-600 font-['Inter',system-ui,sans-serif] mb-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <div className="w-2 h-2 bg-[#8FA573] rounded-full"></div>
            Bias-aware, balanced summaries
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <div className="w-2 h-2 bg-[#5C8CF0] rounded-full"></div>
            Multiple perspectives
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <div className="w-2 h-2 bg-[#8FA573] rounded-full"></div>
            Key quotes & sources
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <div className="w-2 h-2 bg-[#5C8CF0] rounded-full"></div>
            Sentiment & common ground
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <div className="w-2 h-2 bg-[#8FA573] rounded-full"></div>
            Auto-deletes after 24h · No signup
          </div>
        </div>

        <p className="text-sm text-gray-500 font-['Inter',system-ui,sans-serif]">
          Works on most sites
        </p>
      </div>
    </section>
  );
}
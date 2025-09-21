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
    <section className="relative py-24 px-4 bg-[#F7F5F2]">
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 39px,
              #A3B18A 40px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 39px,
              #A3B18A 40px
            )
          `,
        }}
      />
      
      <div className="relative max-w-5xl mx-auto text-center">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-white rounded-full shadow-lg">
            <Newspaper className="h-12 w-12 text-[#A3B18A]" />
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight font-['Inter',system-ui,sans-serif]">
          Understand News
          <span className="block text-[#A3B18A]">In Seconds</span>
        </h1>

        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-['Inter',system-ui,sans-serif]">
          Paste any news article and get instant AI-powered summaries, bias analysis,
          multiple perspectives, and key insights. Perfect for staying informed without the overwhelm.
        </p>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-12">
          <div className="flex gap-4">
            <Input
              type="url"
              placeholder="Paste a news article URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 h-14 text-lg px-6 rounded-2xl border-2 border-gray-200 focus:border-[#A3B18A] bg-white font-['Inter',system-ui,sans-serif]"
              disabled={processUrlMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!url.trim() || processUrlMutation.isPending}
              className="h-14 px-8 bg-[#A3B18A] hover:bg-[#8fa573] text-white font-semibold rounded-2xl font-['Inter',system-ui,sans-serif]"
            >
              {processUrlMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Explain It'
              )}
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 font-['Inter',system-ui,sans-serif]">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-[#A3B18A] rounded-full"></div>
            Neutral summaries
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-[#F4C7C3] rounded-full"></div>
            Auto-delete after 24h
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-[#FFE5B4] rounded-full"></div>
            Works on most sites
          </div>
        </div>
      </div>
    </section>
  );
}
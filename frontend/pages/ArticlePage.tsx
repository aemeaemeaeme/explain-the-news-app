import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import backend from '~backend/client';
import type { Article } from '~backend/news/get';
import ArticleCard from '../components/ArticleCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Header from '../components/Header';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: article,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['article', id],
    queryFn: async (): Promise<Article> => {
      if (!id) throw new Error('No article ID provided');
      const res = await backend.news.getArticle({ id });
      if (!res || !res.article) throw new Error('Article not found or expired');
      return res.article;
    },
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] font-['Inter',system-ui,sans-serif]">
        <Header />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] font-['Inter',system-ui,sans-serif]">
        <Header />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <ErrorMessage
            title="Article Not Found"
            message="This article may have expired or doesn't exist."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] font-['Inter',system-ui,sans-serif]">
      {/* Subtle grid background */}
      <div 
        className="fixed inset-0 opacity-10 pointer-events-none"
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
      
      <Header />
      <main className="relative px-4 py-12">
        <ArticleCard article={article} />
      </main>
      
      {/* Sticky mobile back button */}
      <button
        onClick={() => navigate('/')}
        className="fixed bottom-6 right-6 md:hidden btn-blush p-3 rounded-full shadow-lg z-50"
        aria-label="Back to input"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
// frontend/pages/ArticlePage.tsx
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import backend from '~backend/client';
import type { Article } from '~backend/news/get';
import ArticleCard from '../components/ArticleCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // No ID? Bounce home immediately.
  if (!id) return <Navigate to="/" replace />;

  const {
    data: article,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['article', id],
    queryFn: async (): Promise<Article> => {
      const res = await backend.news.getArticle({ id });
      if (!res?.article) throw new Error('Article not found or expired');
      return res.article;
    },
    enabled: true,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: 1, // one gentle retry for transient backend lag
  });

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#F7F7F7] font-['Inter',system-ui,sans-serif]">
      {/* Subtle grid background (md+ only) */}
      <div
        className="hidden md:block fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 39px, #8FA573 40px),
            repeating-linear-gradient(90deg, transparent, transparent 39px, #8FA573 40px)
          `,
        }}
      />
      <Header />
      {children}
      <Footer />
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

  if (isLoading || isFetching) {
    return (
      <Shell>
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Shell>
    );
  }

  if (error || !article) {
    return (
      <Shell>
        <main className="relative px-4 py-12">
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="space-y-4">
              <ErrorMessage
                title="Article Not Found"
                message="This article may have expired, been deleted, or never finished processing."
              />
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => refetch()}
                  className="btn-blush rounded-md px-4 py-2 font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="rounded-md px-4 py-2 font-medium border border-gray-300 bg-white"
                >
                  Paste another link
                </button>
              </div>
            </div>
          </div>
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      <main id="main" className="relative px-4 py-12" role="main" aria-labelledby="article-title">
        <ArticleCard article={article} />
      </main>
    </Shell>
  );
}

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import backend from '~backend/client';
import type { Article } from '~backend/news/get';
import ArticleCard from '../components/ArticleCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Header from '../components/Header';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: article,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['article', id],
    // ✅ unwrap the backend response so we return Article (not { article: Article })
    queryFn: async (): Promise<Article> => {
      if (!id) throw new Error('No article ID provided');
      const res = await backend.news.getArticle({ id }); // { article: Article | null }
      if (!res || !res.article) throw new Error('Article not found or expired');
      return res.article; // <-- return the actual Article
    },
    enabled: !!id,
    // optional, but helps ensure you always see fresh data:
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage
          title="Article Not Found"
          message="This article may have expired or doesn't exist."
        />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* ✅ ArticleCard now receives a real Article */}
        <ArticleCard article={article} />
      </main>
    </>
  );
}

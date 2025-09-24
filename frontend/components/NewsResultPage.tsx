// frontend/pages/NewsResultPage.tsx
import NewsResults from '../components/seo-results'; 
import { useLocation } from 'react-router-dom';

export default function NewsResultPage() {
  // Get analysis data passed from Hero.tsx
  const location = useLocation();
  const analysis = (location.state as any)?.analysis;

  // If no data was passed, show a fallback message
  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">
          No analysis found. Please go back and paste a link.
        </p>
      </div>
    );
  }

  return <NewsResults analysis={analysis} />;
}

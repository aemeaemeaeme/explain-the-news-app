import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import LandingPage from './pages/LandingPage';
import ArticlePage from './pages/ArticlePage';
import FaqPage from './pages/FaqPage';
import './styles.css';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/article/:id" element={<ArticlePage />} />
            <Route path="/faq" element={<FaqPage />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

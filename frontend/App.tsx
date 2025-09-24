import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LandingPage from './pages/LandingPage';
import ArticlePage from './pages/ArticlePage';
import AnalysisPage from './pages/AnalysisPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ExamplesPage from './pages/ExamplesPage';
import ContactPage from './pages/ContactPage';
import NewsResultPage from './pages/NewsResultPage';   // ✅ import your new page
import './styles.css';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen body-font">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/article/:id" element={<ArticlePage />} />
            <Route path="/article/temp" element={<AnalysisPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/examples" element={<ExamplesPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* ✅ New route for news results */}
            <Route path="/news-result" element={<NewsResultPage />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

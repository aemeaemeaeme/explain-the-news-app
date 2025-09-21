import { useLocation, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AnalysisResult from '../components/AnalysisResult';

export default function AnalysisPage() {
  const location = useLocation();
  const analysis = location.state?.analysis;

  if (!analysis) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <AnalysisResult analysis={analysis} />
      <Footer />
    </div>
  );
}
// frontend/pages/AnalysisPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AnalysisResult from '../components/AnalysisResult';

type AnalysisFromState = React.ComponentProps<typeof AnalysisResult>['analysis'];

const STORAGE_KEY = 'unspin:last-analysis';

export default function AnalysisPage() {
  const location = useLocation();
  const analysisFromNav = (location.state as { analysis?: AnalysisFromState } | null)?.analysis;

  // Persist any incoming analysis so a hard refresh still works
  useEffect(() => {
    if (analysisFromNav) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(analysisFromNav));
      } catch {}
    }
  }, [analysisFromNav]);

  // On first render, try to hydrate from storage if nav state is missing
  const [hydrated, setHydrated] = useState<AnalysisFromState | null>(null);
  useEffect(() => {
    if (!analysisFromNav) {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) setHydrated(JSON.parse(raw));
      } catch {
        setHydrated(null);
      }
    }
  }, [analysisFromNav]);

  const analysis: AnalysisFromState | null = useMemo(
    () => analysisFromNav ?? hydrated ?? null,
    [analysisFromNav, hydrated]
  );

  if (!analysis) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] font-['Inter',system-ui,sans-serif]">
      {/* Subtle grid background (md+ only) */}
      <div
        className="hidden md:block fixed inset-0 opacity-5 pointer-events-none"
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
      <main id="main" role="main" className="relative">
        <AnalysisResult analysis={analysis} />
      </main>
      <Footer />
    </div>
  );
}

// frontend/components/AnalysisResult.tsx
import { ArrowLeft, Clock, ExternalLink, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BiasBar from './BiasBar';
import SentimentBar from './SentimentBar';
import { useNavigate } from 'react-router-dom';

interface AnalysisProps {
  status: 'full' | 'limited';
  meta: {
    title: string;
    source: string;
    author: string | null;
    published: string | null;
    reading_minutes: number;
    tone: 'factual' | 'analytical' | 'opinion' | 'mixed';
    provider: 'gemini' | 'openai';
    model: string;
    fallback_used: boolean;
  };
  tldr: string;
  eli5: string;
  why_it_matters: string[];
  key_points: Array<{
    tag: 'fact' | 'numbers' | 'timeline' | 'stakeholders' | 'quote';
    text: string;
  }>;
  bias_analysis: {
    left: number;
    center: number;
    right: number;
    confidence: 'low' | 'med' | 'high';
    notes: string;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    notes: string;
  };
  perspectives: {
    left_view: string[];
    center_view: string[];
    right_view: string[];
  };
  common_ground: string[];
  glossary: Array<{ term: string; definition: string }>;
  followups: string[];
  processing_notes: string[];
}

interface AnalysisResultProps {
  analysis: AnalysisProps;
}

export default function AnalysisResult({ analysis }: AnalysisResultProps) {
  const navigate = useNavigate();

  // Defensive defaults so UI never crashes on partial data
  const meta = analysis?.meta ?? {
    title: 'Untitled',
    source: 'unknown',
    author: null,
    published: null,
    reading_minutes: 0,
    tone: 'factual',
    provider: 'gemini',
    model: '',
    fallback_used: false,
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'fact':
        return 'bg-blue-100 text-blue-800';
      case 'timeline':
        return 'bg-green-100 text-green-800';
      case 'numbers':
        return 'bg-purple-100 text-purple-800';
      case 'stakeholders':
        return 'bg-orange-100 text-orange-800';
      case 'quote':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'factual':
        return 'bg-blue-100 text-blue-800';
      case 'analytical':
        return 'bg-green-100 text-green-800';
      case 'mixed':
        return 'bg-yellow-100 text-yellow-800';
      case 'opinion':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePasteText = () => {
    navigate('/', { state: { showPasteModal: true } });
  };

  const left = analysis?.perspectives?.left_view ?? [];
  const center = analysis?.perspectives?.center_view ?? [];
  const right = analysis?.perspectives?.right_view ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>

            <Badge
              variant="outline"
              className={analysis?.status === 'full' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
            >
              {analysis?.status === 'full' ? 'Full Analysis' : 'Limited Analysis'}
            </Badge>

            {meta.fallback_used && (
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Fallback Used
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold mb-2">{meta.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {meta.author && <span>By {meta.author}</span>}

            {meta.reading_minutes ? (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{meta.reading_minutes} min read</span>
              </div>
            ) : null}

            <span className="capitalize">{meta.source}</span>

            <Badge className={getToneColor(meta.tone)}>{meta.tone}</Badge>

            {meta.source && meta.source !== 'user_input' && (
              <a
                href={`https://${meta.source}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-3 w-3" />
                Original Article
              </a>
            )}
          </div>

          <div className="mt-4">
            <Badge variant="secondary" className="text-xs">
              {meta.provider === 'openai' ? 'OpenAI' : 'Gemini'} • {meta.model || 'model'}
              {meta.fallback_used && ' (fallback)'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Limited banner */}
        {analysis?.status === 'limited' && (
          <Card className="border-yellow-200 bg-yellow-50 rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-yellow-800 mb-3">
                    Access restricted—analysis based on metadata/neutral context.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePasteText}
                      className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 rounded-lg"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Paste Article Text
                    </Button>
                    {meta.source !== 'user_input' && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 rounded-lg"
                      >
                        <a href={`https://${meta.source}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Original
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TL;DR */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>TL;DR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{analysis?.tldr || 'Summary unavailable.'}</p>
          </CardContent>
        </Card>

        {/* ELI5 */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Explain Like I&apos;m 5</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{analysis?.eli5 || 'Simplified explanation not available.'}</p>
          </CardContent>
        </Card>

        {/* Why It Matters */}
        {Array.isArray(analysis?.why_it_matters) && analysis.why_it_matters.length > 0 && (
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Why It Matters</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.why_it_matters.map((matter, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{matter}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Key Points */}
        {Array.isArray(analysis?.key_points) && analysis.key_points.length > 0 && (
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Key Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.key_points.map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Badge className={getTagColor(point.tag)} variant="secondary">
                      {point.tag}
                    </Badge>
                    <span className="flex-1">{point.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bias */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Bias Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <BiasBar
              left={analysis?.bias_analysis?.left ?? 0}
              center={analysis?.bias_analysis?.center ?? 0}
              right={analysis?.bias_analysis?.right ?? 0}
              confidence={analysis?.bias_analysis?.confidence ?? 'low'}
            />
            {analysis?.bias_analysis?.notes && (
              <p className="text-sm text-gray-600 mt-3">{analysis.bias_analysis.notes}</p>
            )}
          </CardContent>
        </Card>

        {/* Sentiment */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentBar
              positive={analysis?.sentiment?.positive ?? 0}
              neutral={analysis?.sentiment?.neutral ?? 0}
              negative={analysis?.sentiment?.negative ?? 0}
            />
            {analysis?.sentiment?.notes && (
              <p className="text-sm text-gray-600 mt-3">{analysis.sentiment.notes}</p>
            )}
          </CardContent>
        </Card>

        {/* Different Perspectives – squared rounded cards (no ovals) */}
        {(left.length > 0 || right.length > 0 || center.length > 0) && (
          <>
            <h2 className="headline-font text-3xl md:text-4xl text-ink mb-6">Different Perspectives</h2>

            <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2">
              {left.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-xl md:text-2xl font-semibold text-ink mb-3">Left-Leaning View</h3>
                  <ul className="space-y-2 text-base">
                    {left.map((pt, i) => (
                      <li key={`left-${i}`}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {right.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-xl md:text-2xl font-semibold text-ink mb-3">Right-Leaning View</h3>
                  <ul className="space-y-2 text-base">
                    {right.map((pt, i) => (
                      <li key={`right-${i}`}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {center.length > 0 && (
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle>Centrist View</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-base">
                    {center.map((pt, i) => (
                      <li key={`center-${i}`} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Common Ground */}
        {Array.isArray(analysis?.common_ground) && analysis.common_ground.length > 0 && (
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Common Ground</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.common_ground.map((ground, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{ground}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Glossary */}
        {Array.isArray(analysis?.glossary) && analysis.glossary.length > 0 && (
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Glossary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.glossary.map((item, i) => (
                  <div key={i} className="border-l-4 border-blue-200 pl-4">
                    <h4 className="font-semibold text-sm">{item.term}</h4>
                    <p className="text-sm text-gray-600">{item.definition}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Follow-ups */}
        {Array.isArray(analysis?.followups) && analysis.followups.length > 0 && (
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Follow-up Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.followups.map((question, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">?</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Processing Notes */}
        {Array.isArray(analysis?.processing_notes) && analysis.processing_notes.length > 0 && (
          <Card className="border-gray-200 bg-gray-50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-gray-800">Processing Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-gray-700">
                {analysis.processing_notes.map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

import { ArrowLeft, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BiasBar from './BiasBar';
import SentimentBar from './SentimentBar';
import GlossaryTooltip from './GlossaryTooltip';
import { useNavigate } from 'react-router-dom';

interface AnalysisProps {
  meta: {
    provider: "openai" | "gemini";
    model: string;
    elapsed_ms: number;
    site: string | null;
    url: string;
    status: "full" | "limited" | "error";
  };
  header: {
    title: string;
    byline: string | null;
    read_time_min: number | null;
    tone: "factual" | "neutral" | "mixed" | "opinion" | "unknown";
  };
  tldr: string;
  eli5: string;
  why_it_matters: string[];
  key_points: Array<{
    tag: "fact" | "timeline" | "numbers" | "stakeholders";
    text: string;
  }>;
  bias: {
    left_pct: number;
    center_pct: number;
    right_pct: number;
    confidence: "low" | "medium" | "high";
    note: string;
  };
  sentiment: {
    positive_pct: number;
    neutral_pct: number;
    negative_pct: number;
    note: string;
  };
  perspectives: {
    left_view: string[];
    center_view: string[];
    right_view: string[];
  };
  common_ground: string[];
  glossary: Array<{
    term: string;
    definition: string;
  }>;
  errors: Array<{
    code: string;
    message: string;
  }>;
}

interface AnalysisResultProps {
  analysis: AnalysisProps;
}

export default function AnalysisResult({ analysis }: AnalysisResultProps) {
  const navigate = useNavigate();

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'fact': return 'bg-blue-100 text-blue-800';
      case 'timeline': return 'bg-green-100 text-green-800';
      case 'numbers': return 'bg-purple-100 text-purple-800';
      case 'stakeholders': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'factual': return 'bg-blue-100 text-blue-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      case 'mixed': return 'bg-yellow-100 text-yellow-800';
      case 'opinion': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
              className={`${analysis.meta.status === 'full' ? 'bg-green-100 text-green-800' : 
                analysis.meta.status === 'limited' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'}`}
            >
              {analysis.meta.status === 'full' ? 'Full Analysis' : 
               analysis.meta.status === 'limited' ? 'Limited Analysis' : 'Error'}
            </Badge>
          </div>

          <h1 className="text-2xl font-bold mb-2">{analysis.header.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {analysis.header.byline && (
              <span>By {analysis.header.byline}</span>
            )}
            {analysis.header.read_time_min && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{analysis.header.read_time_min} min read</span>
              </div>
            )}
            <span className="capitalize">{analysis.meta.site}</span>
            <Badge className={getToneColor(analysis.header.tone)}>
              {analysis.header.tone}
            </Badge>
            <a 
              href={analysis.meta.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-3 w-3" />
              Original Article
            </a>
          </div>

          {/* Provider Badge */}
          <div className="mt-4">
            <Badge variant="secondary" className="text-xs">
              {analysis.meta.provider === 'openai' ? 'OpenAI' : 'Gemini'} • {analysis.meta.model}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Error Banner for Limited Analysis */}
        {analysis.meta.status === 'limited' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-yellow-800">
                Limited Analysis — some sites restrict automated access. We used reliable metadata and neutral context.
              </p>
            </CardContent>
          </Card>
        )}

        {/* TLDR */}
        <Card>
          <CardHeader>
            <CardTitle>TL;DR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{analysis.tldr}</p>
          </CardContent>
        </Card>

        {/* ELI5 */}
        <Card>
          <CardHeader>
            <CardTitle>Explain Like I'm 5</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{analysis.eli5}</p>
          </CardContent>
        </Card>

        {/* Why It Matters */}
        <Card>
          <CardHeader>
            <CardTitle>Why It Matters</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.why_it_matters.map((matter, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{matter}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Key Points */}
        <Card>
          <CardHeader>
            <CardTitle>Key Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.key_points.map((point, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Badge className={getTagColor(point.tag)} variant="secondary">
                    {point.tag}
                  </Badge>
                  <span className="flex-1">{point.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bias Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Bias Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <BiasBar 
              left={analysis.bias.left_pct}
              center={analysis.bias.center_pct}
              right={analysis.bias.right_pct}
              confidence={analysis.bias.confidence}
            />
            <p className="text-sm text-gray-600 mt-3">{analysis.bias.note}</p>
          </CardContent>
        </Card>

        {/* Sentiment Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentBar 
              positive={analysis.sentiment.positive_pct}
              neutral={analysis.sentiment.neutral_pct}
              negative={analysis.sentiment.negative_pct}
            />
            <p className="text-sm text-gray-600 mt-3">{analysis.sentiment.note}</p>
          </CardContent>
        </Card>

        {/* Perspectives */}
        <Card>
          <CardHeader>
            <CardTitle>Different Perspectives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {analysis.perspectives.left_view.length > 0 && (
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2">Left-leaning view</h4>
                  <ul className="space-y-1 text-sm">
                    {analysis.perspectives.left_view.map((view, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{view}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.perspectives.center_view.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">Centrist view</h4>
                  <ul className="space-y-1 text-sm">
                    {analysis.perspectives.center_view.map((view, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{view}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.perspectives.right_view.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">Right-leaning view</h4>
                  <ul className="space-y-1 text-sm">
                    {analysis.perspectives.right_view.map((view, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span>{view}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Common Ground */}
        {analysis.common_ground.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Common Ground</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.common_ground.map((ground, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{ground}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Glossary */}
        {analysis.glossary.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Glossary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.glossary.map((item, index) => (
                  <div key={index} className="border-l-4 border-blue-200 pl-4">
                    <h4 className="font-semibold text-sm">{item.term}</h4>
                    <p className="text-sm text-gray-600">{item.definition}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Errors (if any) */}
        {analysis.errors.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Processing Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-red-700">
                {analysis.errors.map((error, index) => (
                  <li key={index}>• {error.message}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
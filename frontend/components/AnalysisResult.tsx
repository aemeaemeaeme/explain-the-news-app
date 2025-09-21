import { ArrowLeft, Clock, ExternalLink, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BiasBar from './BiasBar';
import SentimentBar from './SentimentBar';
import GlossaryTooltip from './GlossaryTooltip';
import { useNavigate } from 'react-router-dom';

interface AnalysisProps {
  status: "full" | "limited";
  meta: {
    title: string;
    source: string;
    author: string | null;
    published: string | null;
    reading_minutes: number;
    tone: "factual" | "analytical" | "opinion" | "mixed";
    provider: "gemini" | "openai";
    model: string;
    fallback_used: boolean;
  };
  tldr: string;
  eli5: string;
  why_it_matters: string[];
  key_points: Array<{
    tag: "fact" | "numbers" | "timeline" | "stakeholders" | "quote";
    text: string;
  }>;
  bias_analysis: {
    left: number;
    center: number;
    right: number;
    confidence: "low" | "med" | "high";
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
  glossary: Array<{
    term: string;
    definition: string;
  }>;
  followups: string[];
  processing_notes: string[];
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
      case 'quote': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'factual': return 'bg-blue-100 text-blue-800';
      case 'analytical': return 'bg-green-100 text-green-800';
      case 'mixed': return 'bg-yellow-100 text-yellow-800';
      case 'opinion': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePasteText = () => {
    // Navigate back to home with paste mode enabled
    navigate('/', { state: { showPasteModal: true } });
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
              className={`${analysis.status === 'full' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
            >
              {analysis.status === 'full' ? 'Full Analysis' : 'Limited Analysis'}
            </Badge>
            {analysis.meta.fallback_used && (
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Fallback Used
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold mb-2">{analysis.meta.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {analysis.meta.author && (
              <span>By {analysis.meta.author}</span>
            )}
            {analysis.meta.reading_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{analysis.meta.reading_minutes} min read</span>
              </div>
            )}
            <span className="capitalize">{analysis.meta.source}</span>
            <Badge className={getToneColor(analysis.meta.tone)}>
              {analysis.meta.tone}
            </Badge>
            {analysis.meta.source !== 'user_input' && (
              <a 
                href={`https://${analysis.meta.source}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-3 w-3" />
                Original Article
              </a>
            )}
          </div>

          {/* Provider Badge */}
          <div className="mt-4">
            <Badge variant="secondary" className="text-xs">
              {analysis.meta.provider === 'openai' ? 'OpenAI' : 'Gemini'} • {analysis.meta.model}
              {analysis.meta.fallback_used && ' (fallback)'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Error Banner for Limited Analysis */}
        {analysis.status === 'limited' && (
          <Card className="border-yellow-200 bg-yellow-50">
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
                      className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Paste Article Text
                    </Button>
                    {analysis.meta.source !== 'user_input' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                      >
                        <a href={`https://${analysis.meta.source}`} target="_blank" rel="noopener noreferrer">
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
              left={analysis.bias_analysis.left}
              center={analysis.bias_analysis.center}
              right={analysis.bias_analysis.right}
              confidence={analysis.bias_analysis.confidence}
            />
            <p className="text-sm text-gray-600 mt-3">{analysis.bias_analysis.notes}</p>
          </CardContent>
        </Card>

        {/* Sentiment Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentBar 
              positive={analysis.sentiment.positive}
              neutral={analysis.sentiment.neutral}
              negative={analysis.sentiment.negative}
            />
            <p className="text-sm text-gray-600 mt-3">{analysis.sentiment.notes}</p>
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

        {/* Follow-up Questions */}
        {analysis.followups && analysis.followups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.followups.map((question, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">?</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Processing Notes */}
        {analysis.processing_notes && analysis.processing_notes.length > 0 && (
          <Card className="border-gray-200 bg-gray-50">
            <CardHeader>
              <CardTitle className="text-gray-800">Processing Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-gray-700">
                {analysis.processing_notes.map((note, index) => (
                  <li key={index}>• {note}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
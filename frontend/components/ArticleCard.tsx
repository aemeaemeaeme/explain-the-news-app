import { Share, Clock, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import BiasBar from './BiasBar';
import FollowUpQuestions from './FollowUpQuestions';
import type { Article } from '~backend/news/get';

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const { toast } = useToast();

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.share({
        title: article.meta.title,
        text: article.tldr.headline,
        url: url,
      });
    } catch {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "The article link has been copied to your clipboard.",
      });
    }
  };

  const handleCopy = async () => {
    const text = `${article.meta.title}\n\n${article.tldr.headline}\n\n${article.tldr.subhead}\n\nRead the full analysis: ${window.location.href}`;
    await navigator.clipboard.writeText(text);
    toast({
      title: "Content copied!",
      description: "The article summary has been copied to your clipboard.",
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {article.meta.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span>{article.source_mix}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.reading_time_minutes} min read
            </span>
            <span className="capitalize">Tone: {article.tone}</span>
          </div>
          <div className="text-xs text-[#A3B18A] bg-[#A3B18A]/10 px-3 py-1 rounded-full inline-block">
            🔒 {article.privacy_note}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">TL;DR</h2>
            <p className="text-lg font-medium text-gray-900 leading-relaxed mb-2">{article.tldr.headline}</p>
            <p className="text-gray-700 leading-relaxed">{article.tldr.subhead}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Explain Like I'm 5</h2>
            <p className="text-gray-700 leading-relaxed mb-3">{article.eli5.summary}</p>
            {article.eli5.analogy && (
              <div className="bg-[#FFE5B4]/20 p-4 rounded-lg border-l-4 border-[#FFE5B4]">
                <p className="text-sm text-gray-600 italic">{article.eli5.analogy}</p>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Why It Matters</h2>
            <ul className="space-y-2">
              {Array.isArray(article.why_it_matters) &&
                article.why_it_matters.map((matter, index) => (
                  <li key={index} className="text-gray-700 leading-relaxed flex items-start gap-2">
                    <span className="text-[#A3B18A] font-bold">•</span>
                    {matter}
                  </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Key Points</h2>
            <div className="space-y-3">
              {Array.isArray(article.key_points) &&
                article.key_points.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                      point.tag === 'fact' ? 'bg-blue-100 text-blue-700' :
                      point.tag === 'timeline' ? 'bg-green-100 text-green-700' :
                      point.tag === 'stakeholders' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {point.tag}
                    </span>
                    <p className="text-gray-700 leading-relaxed flex-1">{point.text}</p>
                  </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Bias Analysis</h2>
            <BiasBar 
              left={article.bias.left}
              center={article.bias.center}
              right={article.bias.right}
              confidence={article.bias.confidence}
            />
            <p className="text-sm text-gray-600 mt-3">{article.bias.rationale}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Sentiment Analysis</h2>
            <div className="flex gap-1 h-2 rounded-lg overflow-hidden mb-3">
              <div className="bg-green-400" style={{ width: `${article.sentiment.positive}%` }} />
              <div className="bg-gray-400" style={{ width: `${article.sentiment.neutral}%` }} />
              <div className="bg-red-400" style={{ width: `${article.sentiment.negative}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Positive: {article.sentiment.positive}%</span>
              <span>Neutral: {article.sentiment.neutral}%</span>
              <span>Negative: {article.sentiment.negative}%</span>
            </div>
            <p className="text-sm text-gray-600">{article.sentiment.rationale}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Different Perspectives</h2>
            <div className="space-y-4">
              {Array.isArray(article.perspectives) &&
                article.perspectives.map((perspective, index) => (
                  <section key={index} className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-800">{perspective.label}</h3>
                    <p className="text-gray-700 leading-relaxed">{perspective.summary}</p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      {Array.isArray(perspective.bullets) &&
                        perspective.bullets.map((bullet, i) => (
                          <li key={i} className="text-gray-700">{bullet}</li>
                      ))}
                    </ul>
                  </section>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Common Ground</h2>
            <ul className="space-y-2">
              {Array.isArray(article.common_ground) &&
                article.common_ground.map((ground, index) => (
                  <li key={index} className="text-gray-700 leading-relaxed flex items-start gap-2">
                    <span className="text-[#84a98c] font-bold">•</span>
                    {ground}
                  </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Glossary</h2>
            <div className="space-y-3">
              {Array.isArray(article.glossary) && article.glossary.length > 0 ? (
                article.glossary.map((entry, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{entry.term}</span>
                      {entry.link && (
                        <a
                          href={entry.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{entry.definition}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No glossary terms available.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <FollowUpQuestions
        questions={Array.isArray(article.follow_up_questions) ? article.follow_up_questions : []}
      />
    </div>
  );
}

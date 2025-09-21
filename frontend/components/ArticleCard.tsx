// frontend/components/ArticleCard.tsx
import React from 'react';
import { Clock, Share, Handshake, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BiasBar from './BiasBar';
import SentimentBar from './SentimentBar';
import FollowUpQuestions from './FollowUpQuestions';
import type { Article } from '~backend/news/get';

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const navigate = useNavigate();
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.tldr.headline,
        text: article.tldr.subhead,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Set page title and OG meta for sharing
  React.useEffect(() => {
    document.title = article.tldr.headline;
    
    // Update OG meta tags
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', `/api/og/${window.location.pathname.split('/').pop()}`);
    
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', article.tldr.headline);
    
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', article.tldr.subhead);
  }, [article]);

  return (
    <article className="bg-white rounded-xl card-shadow p-8 md:p-12 max-w-4xl mx-auto">
      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2 text-sm mb-4">
        <div className="chip-mist px-2 py-1 rounded">
          <span>{article.meta.byline || 'Unknown'}</span>
        </div>
        <div className="chip-mist px-2 py-1 rounded">
          <span>{article.meta.domain}</span>
        </div>
        <div className="chip-mist px-2 py-1 rounded flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{article.reading_time_minutes} min read</span>
        </div>
        <div className="chip-sky px-2 py-1 rounded text-xs font-medium">
          Tone: {article.tone}
        </div>
      </div>
      
      {/* Title */}
      <div className="mb-6">
        <h1 className="article-title headline-font text-3xl md:text-4xl mb-4 leading-tight">
          {article.meta.title}
        </h1>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-[var(--ink)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to input
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-[var(--ink)] transition-colors"
        >
          <Share className="h-4 w-4" />
          Share
        </button>
      </div>

      <div className="space-y-10">
        {/* TL;DR */}
        <section>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--ink)' }}>TL;DR</h2>
          <div className="space-y-4">
            {article.tldr.paragraphs && article.tldr.paragraphs.length > 0 ? (
              article.tldr.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed">{paragraph}</p>
              ))
            ) : (
              <>
                <p className="text-lg text-gray-700">{article.tldr.headline}</p>
                <p className="text-gray-600">{article.tldr.subhead}</p>
              </>
            )}
          </div>
        </section>

        {/* ELI5 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--ink)' }}>Explain Like I'm 5</h2>
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">{article.eli5.summary}</p>
            {article.eli5.analogy && (
              <div className="p-4 rounded-xl chip-mist">
                <p className="text-gray-700">
                  <strong>Analogy:</strong> {article.eli5.analogy}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Why It Matters */}
        <section>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--ink)' }}>Why It Matters</h2>
          {article.why_it_matters.length > 0 ? (
            <ul className="space-y-3">
              {article.why_it_matters.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--sage)' }}></div>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No items available.</p>
          )}
        </section>

        {/* Key Points */}
        <section>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--ink)' }}>Key Points</h2>
          {article.key_points.length > 0 ? (
            <div className="grid gap-3">
              {article.key_points.map((point, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 font-medium tag-${point.tag}`}>
                    {point.tag}
                  </span>
                  <span className="text-gray-700">{point.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No items available.</p>
          )}
        </section>

        {/* Bias Analysis */}
        <section>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--ink)' }}>Bias Analysis</h2>
          <BiasBar
            left={article.bias.left}
            center={article.bias.center}
            right={article.bias.right}
            confidence={article.bias.confidence}
          />
          {article.bias.rationale && (
            <p className="mt-3 text-sm text-gray-600">
              {article.bias.rationale}
            </p>
          )}
        </section>

        {/* Sentiment Analysis */}
        <section>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--ink)' }}>Sentiment</h2>
          <SentimentBar
            positive={article.sentiment.positive}
            neutral={article.sentiment.neutral}
            negative={article.sentiment.negative}
          />
          {article.sentiment.rationale && (
            <p className="mt-3 text-sm text-gray-600">
              {article.sentiment.rationale}
            </p>
          )}
        </section>

        {/* Perspectives */}
        <section>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--ink)' }}>Different Perspectives</h2>
          {article.perspectives.length >= 2 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {article.perspectives.slice(0, 2).map((perspective, index) => (
                <div key={index} className="p-6 rounded-xl chip-sky">
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--ink)' }}>{perspective.label}</h3>
                  {perspective.summary && <p className="text-gray-700 mb-3">{perspective.summary}</p>}
                  {perspective.bullets.length > 0 && (
                    <ul className="space-y-2">
                      {perspective.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--ink)' }}></div>
                          <span className="text-gray-600 text-sm">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No items available.</p>
          )}
        </section>

        {/* Common Ground */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
            <Handshake className="h-6 w-6" style={{ color: 'var(--sage)' }} />
            Common Ground
          </h2>
          {article.common_ground.length > 0 ? (
            <ul className="space-y-3">
              {article.common_ground.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--sage)' }}></div>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No items available.</p>
          )}
        </section>

        {/* Glossary */}
        <section>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--ink)' }}>Glossary</h2>
          {article.glossary.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {article.glossary.map((item, index) => (
                <div key={index} className="p-4 rounded-lg chip-mist">
                  <dt className="font-semibold" style={{ color: 'var(--ink)' }}>{item.term}</dt>
                  <dd className="text-gray-700 text-sm mt-1">{item.definition}</dd>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No items available.</p>
          )}
        </section>

        {/* Follow-up Questions */}
        <section>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--ink)' }}>Follow-up Questions</h2>
          <FollowUpQuestions questions={article.follow_up_questions} />
        </section>
      </div>
    </article>
  );
}

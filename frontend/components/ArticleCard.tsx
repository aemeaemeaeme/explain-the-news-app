import React from 'react';
import { Clock, Share, Handshake, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BiasBar from './BiasBar';
import SentimentBar from './SentimentBar';
import GlossaryTooltip from './GlossaryTooltip';
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
    <article className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-[#0B1B2B] mb-4 leading-tight">
          {article.meta.title}
        </h1>
        
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-2">
          <span>{article.meta.byline || 'Staff reporting'}</span>
          <span>•</span>
          <span>{article.meta.domain}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {article.reading_time_minutes} min read
          </span>
          <span>•</span>
          <span>Tone: {article.tone}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to input
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Share className="h-4 w-4" />
          Share
        </button>
      </div>

      <div className="space-y-10">
        {/* TL;DR */}
        <section>
          <h2 className="text-2xl font-semibold text-[#0B1B2B] mb-4">TL;DR</h2>
          <div className="space-y-3">
            {article.tldr.paragraphs && article.tldr.paragraphs.length > 0 ? (
              article.tldr.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-gray-700 font-['Inter',system-ui,sans-serif]">{paragraph}</p>
              ))
            ) : (
              <>
                <p className="text-lg text-gray-700 font-['Inter',system-ui,sans-serif]">{article.tldr.headline}</p>
                <p className="text-gray-600 font-['Inter',system-ui,sans-serif]">{article.tldr.subhead}</p>
              </>
            )}
          </div>
        </section>

        {/* ELI5 */}
        <section>
          <h2 className="text-2xl font-semibold text-[#0B1B2B] mb-4">Explain Like I'm 5</h2>
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed font-['Inter',system-ui,sans-serif]">{article.eli5.summary}</p>
            {article.eli5.analogy && (
              <div className="bg-[#E6F0FF] p-4 rounded-xl border border-[#5C8CF0]/20">
                <p className="text-gray-700 font-['Inter',system-ui,sans-serif]">
                  <strong>Analogy:</strong> {article.eli5.analogy}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Why It Matters */}
        <section>
          <h2 className="text-2xl font-semibold text-[#0B1B2B] mb-4">Why It Matters</h2>
          {article.why_it_matters.length > 0 ? (
            <ul className="space-y-3">
              {article.why_it_matters.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#8FA573] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 font-['Inter',system-ui,sans-serif]">{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic font-['Inter',system-ui,sans-serif]">No items available.</p>
          )}
        </section>

        {/* Key Points */}
        <section>
          <h2 className="text-2xl font-semibold text-[#0B1B2B] mb-4">Key Points</h2>
          {article.key_points.length > 0 ? (
            <div className="grid gap-3">
              {article.key_points.map((point, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 font-['Inter',system-ui,sans-serif] ${
                    point.tag === 'fact' ? 'bg-[#E6F0FF] text-[#5C8CF0]' :
                    point.tag === 'numbers' ? 'bg-[#E8F5E8] text-[#8FA573]' :
                    point.tag === 'timeline' ? 'bg-orange-100 text-orange-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {point.tag}
                  </span>
                  <span className="text-gray-700 font-['Inter',system-ui,sans-serif]">{point.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic font-['Inter',system-ui,sans-serif]">No items available.</p>
          )}
        </section>

        {/* Bias Analysis */}
        <section>
          <h2 className="text-2xl font-semibold text-[#0B1B2B] mb-4">Bias Analysis</h2>
          <BiasBar 
            left={article.bias.left}
            center={article.bias.center}
            right={article.bias.right}
            confidence={article.bias.confidence}
          />
          {article.bias.rationale && (
            <p className="mt-3 text-sm text-gray-600 font-['Inter',system-ui,sans-serif]">
              {article.bias.rationale}
            </p>
          )}
        </section>

        {/* Sentiment Analysis */}
        <section>
          <h2 className="text-2xl font-semibold text-[#0B1B2B] mb-4">Sentiment Analysis</h2>
          <SentimentBar 
            positive={article.sentiment.positive}
            neutral={article.sentiment.neutral}
            negative={article.sentiment.negative}
            rationale={article.sentiment.rationale}
          />
        </section>

        {/* Perspectives */}
        <section>
          <h2 className="text-2xl font-semibold text-[#0B1B2B] mb-4">Different Perspectives</h2>
          {article.perspectives.length >= 2 ? (
            <>
              {/* Mobile/Tablet: Card layout */}
              <div className="grid gap-6 lg:hidden md:grid-cols-2">
                {article.perspectives.slice(0, 2).map((perspective, index) => (
                  <div key={index} className="bg-[#D9EAF7] p-6 rounded-xl border border-[#D9EAF7]">
                    <h3 className="font-semibold text-[#0B1B2B] mb-2">{perspective.label}</h3>
                    <p className="text-gray-700 mb-3">{perspective.summary}</p>
                    {perspective.bullets.length > 0 && (
                      <ul className="space-y-2">
                        {perspective.bullets.map((bullet, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-[#0B1B2B] rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-600 text-sm">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Desktop: Table layout */}
              <div className="hidden lg:block">
                <div className="bg-[#D9EAF7]/30 rounded-xl overflow-hidden border border-[#D9EAF7]">
                  <div className="grid grid-cols-2 bg-[#D9EAF7] text-[#0B1B2B] font-semibold">
                    {article.perspectives.slice(0, 2).map((perspective, index) => (
                      <div key={index} className="p-4 text-center border-r border-[#0B1B2B]/10 last:border-r-0">
                        {perspective.label}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2">
                    {article.perspectives.slice(0, 2).map((perspective, index) => (
                      <div key={index} className="p-6 border-r border-[#D9EAF7] last:border-r-0">
                        <p className="text-gray-700 mb-4">{perspective.summary}</p>
                        {perspective.bullets.length > 0 && (
                          <ul className="space-y-2">
                            {perspective.bullets.map((bullet, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-[#0B1B2B] rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-gray-600 text-sm">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500 italic">No items available.</p>
          )}
        </section>

        {/* Common Ground */}
        <section>
          <h2 className="text-2xl font-semibold text-[#0B1B2B] mb-4 flex items-center gap-2">
            <Handshake className="h-6 w-6 text-[#8FA573]" />
            Common Ground
          </h2>
          {article.common_ground.length > 0 ? (
            <ul className="space-y-3">
              {article.common_ground.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#8FA573] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 font-['Inter',system-ui,sans-serif]">{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic font-['Inter',system-ui,sans-serif]">No items available.</p>
          )}
        </section>

        {/* Glossary */}
        <section>
          <h2 className="text-2xl font-semibold text-[#0B1B2B] mb-4">Glossary</h2>
          {article.glossary.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {article.glossary.map((item, index) => (
                <GlossaryTooltip
                  key={index}
                  term={item.term}
                  definition={item.definition}
                  link={item.link}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic font-['Inter',system-ui,sans-serif]">No items available.</p>
          )}
        </section>

        {/* Follow-up Questions */}
        <section>
          <h2 className="text-2xl font-semibold text-[#0B1B2B] mb-4">Follow-up Questions</h2>
          <FollowUpQuestions questions={article.follow_up_questions} />
        </section>
      </div>
    </article>
  );
}
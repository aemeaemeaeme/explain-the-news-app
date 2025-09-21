// frontend/components/Demo.tsx
import { useState } from 'react';
import BiasBar from './BiasBar';
import SentimentBar from './SentimentBar';
import { Clock, Share, Copy, ChevronDown, ChevronUp, Handshake } from 'lucide-react';

export default function Demo() {
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

  const toggleQuestion = (index: number) => {
    setExpandedQuestions(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const demoArticle = {
    title: "Global Climate Summit Reaches Historic Agreement",
    tldr: {
      headline: "195 countries agree to reduce carbon emissions by 50% by 2030 in landmark climate deal.",
      paragraphs: [
        "In a historic breakthrough, 195 countries have committed to slashing carbon emissions in half by 2030, marking the most ambitious climate agreement since the Paris Accord. The deal includes unprecedented $100 trillion in funding commitments.",
        "Unlike previous agreements, this pact includes legally binding enforcement mechanisms and mandatory annual reviews. Developing nations will receive priority access to green technology funding and transition support.",
        "The agreement addresses long-standing equity concerns while setting aggressive timelines that scientists say are necessary to prevent catastrophic warming beyond 1.5°C."
      ]
    },
    eli5: {
      summary:
        "Almost all countries in the world promised to pollute less to help save the planet. They want to cut pollution in half by 2030, and they're putting a lot of money into clean energy. Think of it like everyone in your neighborhood agreeing to use half as much electricity and all pitching in to buy solar panels for every house!",
      analogy:
        "It's like everyone in your neighborhood agreeing to use half as much electricity and all pitching in to buy solar panels for every house! 🏠☀️"
    },
    whyMatters: [
      "First legally binding global climate agreement since Paris Accord",
      "Could prevent catastrophic 1.5°C warming if fully implemented",
      "Represents largest economic transformation in human history",
      "Sets stage for renewable energy revolution worldwide",
      "May influence upcoming national elections globally"
    ],
    keyPoints: [
      { text: "195 countries signed the agreement", tag: "numbers" },
      { text: "50% emission cuts required by 2030", tag: "numbers" },
      { text: "Agreement negotiated over 2 weeks", tag: "timeline" },
      { text: "$100 trillion investment commitment", tag: "numbers" },
      { text: "Developing nations receive priority funding", tag: "stakeholders" },
      { text: "Enforcement mechanisms included for first time", tag: "fact" },
      { text: "Implementation begins January 2025", tag: "timeline" },
      { text: "Annual progress reviews mandated", tag: "fact" }
    ],
    perspectives: [
      {
        label: "Environmental Advocates",
        summary:
          "This represents the most significant climate action in decades and offers hope for avoiding worst-case scenarios.",
        bullets: [
          "Binding targets provide real accountability",
          "Funding commitments address historical inequities",
          "Timeline is aggressive enough to make a difference",
          "Creates momentum for even stronger future action"
        ]
      },
      {
        label: "Industry Representatives",
        summary:
          "While supportive of climate goals, many express concerns about implementation timelines and economic impacts.",
        bullets: [
          "Transition timeline may be too aggressive for some sectors",
          "Significant job displacement in fossil fuel industries",
          "Investment requirements could strain developing economies",
          "Technology gaps still exist for some emission targets"
        ]
      }
    ],
    commonGround: [
      "Climate change requires urgent global action",
      "Transition must balance environmental and economic needs"
    ],
    glossary: [
      { term: "Carbon emissions", definition: "Gases released when burning fossil fuels that trap heat in atmosphere 🌡️" },
      { term: "Paris Accord", definition: "2015 agreement where countries committed to limit global warming 🌍" },
      { term: "Renewable energy", definition: "Power from sources that naturally replenish like wind and solar ⚡" },
      { term: "Developing nations", definition: "Countries with growing economies that need climate support 🏗️" },
      { term: "Binding targets", definition: "Goals that countries are legally required to meet 📋" }
    ],
    bias: { left: 28, center: 52, right: 20, confidence: "high" as const },
    sentiment: { positive: 65, neutral: 25, negative: 10 },
    readingTime: 4,
    sourceInfo: "Wire service – Reuters",
    followupQuestions: [
      {
        question: "What happens if countries don't meet their targets?",
        answer:
          "The agreement includes stepped enforcement mechanisms, starting with public accountability reports and potentially escalating to trade restrictions."
      },
      {
        question: "How will this affect gas prices and energy costs?",
        answer:
          "Short-term costs may increase as fossil fuel supply is limited, but long-term renewable energy investments should lower overall energy costs."
      },
      {
        question: "Which technologies are most promising for reaching these goals?",
        answer:
          "Solar and wind power, battery storage, electric vehicles, and green hydrogen are seen as the key technologies for meeting emission targets."
      }
    ]
  };

  return (
    <section
      id="examples"
      className="relative py-20 px-4 bg-[#F7F7F7]"
      aria-labelledby="see-it-in-action-heading"
    >
      {/* Subtle grid background (now contained by the section) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10 -z-10"
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
          `
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="see-it-in-action-heading" className="text-4xl md:text-5xl font-bold text-[#0B1B2B] mb-6">
            See It In Action
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-['Inter',system-ui,sans-serif]">
            Here's what you get when you analyze a news article with us.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-[#0B1B2B] mb-2">
                {demoArticle.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 font-['Inter',system-ui,sans-serif]">
                <span>{demoArticle.sourceInfo}</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {demoArticle.readingTime} min read
                </span>
                <span className="hidden sm:inline">•</span>
                <span>reuters.com</span>
                <span className="hidden sm:inline">•</span>
                <span>Tone: factual</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-1 rounded hover:bg-gray-100 transition-colors" aria-label="Copy link">
                <Copy className="h-5 w-5 text-gray-500" />
              </button>
              <button className="p-1 rounded hover:bg-gray-100 transition-colors" aria-label="Share">
                <Share className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {/* TL;DR */}
            <div>
              <h4 className="text-lg font-semibold text-[#0B1B2B] mb-3">TL;DR</h4>
              <div className="space-y-3">
                {demoArticle.tldr.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-gray-700 font-['Inter',system-ui,sans-serif]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* ELI5 */}
            <div>
              <h4 className="text-lg font-semibold text-[#0B1B2B] mb-3">Explain Like I'm 5</h4>
              <p className="text-gray-700 mb-3 font-['Inter',system-ui,sans-serif]">
                {demoArticle.eli5.summary}
              </p>
              <div className="bg-[#E6F0FF] p-4 rounded-xl border border-[#5C8CF0]/20">
                <p className="text-gray-700 font-['Inter',system-ui,sans-serif]">
                  <strong>Analogy:</strong> {demoArticle.eli5.analogy}
                </p>
              </div>
            </div>

            {/* Why It Matters */}
            <div>
              <h4 className="text-lg font-semibold text-[#0B1B2B] mb-3">Why It Matters</h4>
              <ul className="space-y-2">
                {demoArticle.whyMatters.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: 'var(--sage)' }}
                    />
                    <span className="text-gray-700 font-['Inter',system-ui,sans-serif]">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Points */}
            <div>
              <h4 className="text-lg font-semibold text-[#0B1B2B] mb-3">Key Points</h4>
              <div className="grid gap-3">
                {demoArticle.keyPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full flex-shrink-0 font-medium ${
                        point.tag === 'fact'
                          ? 'bg-[#E6F0FF] text-[#5C8CF0]'
                          : point.tag === 'numbers'
                          ? 'bg-[#E8F5E8] text-[#8FA573]'
                          : point.tag === 'timeline'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {point.tag}
                    </span>
                    <span className="text-gray-700 font-['Inter',system-ui,sans-serif]">{point.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bias Analysis */}
            <div>
              <h4 className="text-lg font-semibold text-[#0B1B2B] mb-3">Bias Analysis</h4>
              <BiasBar
                left={demoArticle.bias.left}
                center={demoArticle.bias.center}
                right={demoArticle.bias.right}
                confidence={demoArticle.bias.confidence}
              />
            </div>

            {/* Sentiment Analysis (now using shared component) */}
            <div>
              <h4 className="text-lg font-semibold text-[#0B1B2B] mb-3">Sentiment Analysis</h4>
              <SentimentBar
                positive={demoArticle.sentiment.positive}
                neutral={demoArticle.sentiment.neutral}
                negative={demoArticle.sentiment.negative}
              />
            </div>

            {/* Different Perspectives */}
            <div>
              <h4 className="text-lg font-semibold text-[#0B1B2B] mb-3">Different Perspectives</h4>
              <div className="grid md:grid-cols-2 gap-6">
                {demoArticle.perspectives.map((perspective, index) => (
                  <div
                    key={index}
                    className="bg-[#E6F0FF] p-6 rounded-xl border border-[#5C8CF0]/20"
                  >
                    <h5 className="font-semibold text-[#2C3E50] mb-2 font-['Inter',system-ui,sans-serif]">
                      {perspective.label}
                    </h5>
                    <p className="text-gray-700 mb-3 font-['Inter',system-ui,sans-serif]">
                      {perspective.summary}
                    </p>
                    <ul className="space-y-2">
                      {perspective.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                            style={{ backgroundColor: 'var(--ink)' }}
                          />
                          <span className="text-gray-600 text-sm font-['Inter',system-ui,sans-serif]">
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Ground */}
            <div>
              <h4 className="text-lg font-semibold text-[#0B1B2B] mb-3 flex items-center gap-2">
                <Handshake className="h-5 w-5" style={{ color: 'var(--sage)' }} />
                Common Ground
              </h4>
              <ul className="space-y-2">
                {demoArticle.commonGround.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: 'var(--sage)' }}
                    />
                    <span className="text-gray-700 font-['Inter',system-ui,sans-serif]">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Glossary */}
            <div>
              <h4 className="text-lg font-semibold text-[#0B1B2B] mb-3">Glossary</h4>
              <div className="flex flex-wrap gap-2">
                {demoArticle.glossary.map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-2 bg-[#E8F5E8] text-[#8FA573] rounded-full text-sm cursor-help font-['Inter',system-ui,sans-serif] border border-[#8FA573]/20"
                    title={item.definition}
                  >
                    {item.term}
                  </span>
                ))}
              </div>
            </div>

            {/* Follow-up Questions (collapsible) */}
            <div>
              <h4 className="text-lg font-semibold text-[#0B1B2B] mb-3">Follow-up Questions</h4>
              <div className="space-y-3">
                {demoArticle.followupQuestions.map((item, index) => {
                  const open = expandedQuestions.includes(index);
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        onClick={() => toggleQuestion(index)}
                        aria-expanded={open}
                      >
                        {open ? (
                          <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-gray-700 font-medium">{item.question}</span>
                      </button>
                      {open && (
                        <div className="p-4 bg-white border-t border-gray-200">
                          <p className="text-gray-600">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 mt-8 font-['Inter',system-ui,sans-serif]">
          Auto-deletes after 24h · No accounts · No tracking
        </p>
      </div>
    </section>
  );
}

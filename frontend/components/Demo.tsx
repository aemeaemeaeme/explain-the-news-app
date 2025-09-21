import BiasBar from './BiasBar';
import { Clock, Share, Eye, Handshake, Copy, ChevronDown } from 'lucide-react';

export default function Demo() {
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
      summary: "Almost all countries in the world promised to pollute less to help save the planet. They want to cut pollution in half by 2030, and they're putting a lot of money into clean energy. Think of it like everyone in your neighborhood agreeing to use half as much electricity and all pitching in to buy solar panels for every house!",
      analogy: "It's like everyone in your neighborhood agreeing to use half as much electricity and all pitching in to buy solar panels for every house! 🏠☀️"
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
        summary: "This represents the most significant climate action in decades and offers hope for avoiding worst-case scenarios.",
        bullets: [
          "Binding targets provide real accountability",
          "Funding commitments address historical inequities", 
          "Timeline is aggressive enough to make a difference",
          "Creates momentum for even stronger future action"
        ]
      },
      {
        label: "Industry Representatives", 
        summary: "While supportive of climate goals, many express concerns about implementation timelines and economic impacts.",
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
    bias: { left: 28, center: 52, right: 20, confidence: "high" },
    sentiment: { positive: 65, neutral: 25, negative: 10 },
    readingTime: 4,
    sourceInfo: "Wire service – Reuters",
    followupQuestions: [
      "What happens if countries don't meet their targets?",
      "How will this affect gas prices and energy costs?", 
      "Which technologies are most promising for reaching these goals?"
    ]
  };

  return (
    <section id="examples" className="py-20 px-4 bg-[#F7F7F7]">
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-10"
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
      
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#2C3E50] mb-6 font-['Inter',system-ui,sans-serif]">
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
              <h3 className="text-2xl font-bold text-[#2C3E50] mb-2 font-['Inter',system-ui,sans-serif]">
                {demoArticle.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 font-['Inter',system-ui,sans-serif]">
                <span>{demoArticle.sourceInfo}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {demoArticle.readingTime} min read
                </span>
                <span>•</span>
                <span>Tone: factual</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Copy className="h-5 w-5 text-gray-400 cursor-pointer hover:text-[#8FA573] transition-colors" />
              <Share className="h-5 w-5 text-gray-400 cursor-pointer hover:text-[#8FA573] transition-colors" />
            </div>
          </div>

          <div className="space-y-8">
            {/* TL;DR */}
            <div>
              <h4 className="text-lg font-semibold text-[#2C3E50] mb-3 font-['Inter',system-ui,sans-serif]">TL;DR</h4>
              <div className="space-y-3">
                {demoArticle.tldr.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-gray-700 font-['Inter',system-ui,sans-serif]">{paragraph}</p>
                ))}
              </div>
            </div>

            {/* ELI5 */}
            <div>
              <h4 className="text-lg font-semibold text-[#2C3E50] mb-3 font-['Inter',system-ui,sans-serif]">Explain Like I'm 5</h4>
              <p className="text-gray-700 mb-3 font-['Inter',system-ui,sans-serif]">{demoArticle.eli5.summary}</p>
              <div className="bg-[#E6F0FF] p-4 rounded-xl border border-[#5C8CF0]/20">
                <p className="text-gray-700 font-['Inter',system-ui,sans-serif]">
                  <strong>Analogy:</strong> {demoArticle.eli5.analogy}
                </p>
              </div>
            </div>

            {/* Why It Matters */}
            <div>
              <h4 className="text-lg font-semibold text-[#2C3E50] mb-3 font-['Inter',system-ui,sans-serif]">Why It Matters</h4>
              <ul className="space-y-2">
                {demoArticle.whyMatters.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#8FA573] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 font-['Inter',system-ui,sans-serif]">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Points */}
            <div>
              <h4 className="text-lg font-semibold text-[#2C3E50] mb-3 font-['Inter',system-ui,sans-serif]">Key Points</h4>
              <div className="grid gap-3">
                {demoArticle.keyPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
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
            </div>

            {/* Bias Analysis */}
            <div>
              <h4 className="text-lg font-semibold text-[#2C3E50] mb-3 font-['Inter',system-ui,sans-serif]">Bias Analysis</h4>
              <BiasBar 
                left={demoArticle.bias.left}
                center={demoArticle.bias.center}
                right={demoArticle.bias.right}
                confidence={demoArticle.bias.confidence}
              />
            </div>

            {/* Sentiment Analysis */}
            <div>
              <h4 className="text-lg font-semibold text-[#2C3E50] mb-3 font-['Inter',system-ui,sans-serif]">Sentiment Analysis</h4>
              <div className="flex rounded-lg overflow-hidden h-8 mb-2">
                <div 
                  className="bg-[#8FA573] flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${demoArticle.sentiment.positive}%` }}
                >
                  {demoArticle.sentiment.positive > 15 && `${demoArticle.sentiment.positive}%`}
                </div>
                <div 
                  className="bg-gray-400 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${demoArticle.sentiment.neutral}%` }}
                >
                  {demoArticle.sentiment.neutral > 15 && `${demoArticle.sentiment.neutral}%`}
                </div>
                <div 
                  className="bg-[#ef4444] flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${demoArticle.sentiment.negative}%` }}
                >
                  {demoArticle.sentiment.negative > 15 && `${demoArticle.sentiment.negative}%`}
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 font-['Inter',system-ui,sans-serif]">
                <span>Positive ({demoArticle.sentiment.positive}%)</span>
                <span>Neutral ({demoArticle.sentiment.neutral}%)</span>
                <span>Negative ({demoArticle.sentiment.negative}%)</span>
              </div>
            </div>

            {/* Perspectives */}
            <div>
              <h4 className="text-lg font-semibold text-[#2C3E50] mb-3 font-['Inter',system-ui,sans-serif]">Different Perspectives</h4>
              <div className="grid md:grid-cols-2 gap-6">
                {demoArticle.perspectives.map((perspective, index) => (
                  <div key={index} className="bg-[#E6F0FF] p-6 rounded-xl border border-[#5C8CF0]/20">
                    <h5 className="font-semibold text-[#2C3E50] mb-2 font-['Inter',system-ui,sans-serif]">{perspective.label}</h5>
                    <p className="text-gray-700 mb-3 font-['Inter',system-ui,sans-serif]">{perspective.summary}</p>
                    <ul className="space-y-2">
                      {perspective.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-[#5C8CF0] rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-600 text-sm font-['Inter',system-ui,sans-serif]">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Ground */}
            <div>
              <h4 className="text-lg font-semibold text-[#2C3E50] mb-3 flex items-center gap-2 font-['Inter',system-ui,sans-serif]">
                <Handshake className="h-5 w-5 text-[#8FA573]" />
                Common Ground
              </h4>
              <ul className="space-y-2">
                {demoArticle.commonGround.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#8FA573] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 font-['Inter',system-ui,sans-serif]">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Glossary */}
            <div>
              <h4 className="text-lg font-semibold text-[#2C3E50] mb-3 font-['Inter',system-ui,sans-serif]">Glossary</h4>
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

            {/* Follow-up Questions */}
            <div>
              <h4 className="text-lg font-semibold text-[#2C3E50] mb-3 font-['Inter',system-ui,sans-serif]">Follow-up Questions</h4>
              <div className="space-y-3">
                {demoArticle.followupQuestions.map((question, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 font-['Inter',system-ui,sans-serif]">{question}</span>
                  </div>
                ))}
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
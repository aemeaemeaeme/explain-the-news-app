import BiasBar from './BiasBar';
import SentimentBar from './SentimentBar';
import { Clock, User, Globe } from 'lucide-react';

export default function SeeItInAction() {
  const demoAnalysis = {
    meta: {
      title: "Climate Summit Reaches Historic Agreement Despite Industry Opposition",
      domain: "reuters.com",
      byline: "Maria Rodriguez",
      readingTime: 4,
      tone: "factual"
    },
    tldr: {
      paragraphs: [
        "World leaders at COP28 reached a landmark agreement to transition away from fossil fuels, marking the first time such language has appeared in a global climate deal.",
        "The agreement calls for tripling renewable energy capacity by 2030 and establishes a $100 billion fund to help developing nations adapt to climate change.",
        "Oil and gas companies lobbied heavily against the deal, while environmental groups hailed it as a breakthrough moment for climate action."
      ]
    },
    eli5: {
      summary: "Think of Earth like a house that's getting too hot because we're burning too much coal and oil for energy. World leaders just agreed to switch to cleaner energy like wind and solar power instead.",
      analogy: "It's like switching from a wood-burning stove to solar panels to heat your house 🌱"
    },
    whyItMatters: [
      "First global agreement to explicitly mention moving away from fossil fuels",
      "Creates framework for $100 billion in climate adaptation funding",
      "Sets binding targets for renewable energy expansion by 2030",
      "Signals major shift in international climate policy approach"
    ],
    keyPoints: [
      { text: "196 countries signed the final agreement", tag: "fact" },
      { text: "Triple renewable capacity by 2030", tag: "timeline" },
      { text: "Oil companies spent $50M on lobbying", tag: "numbers" },
      { text: "Developing nations get priority funding", tag: "stakeholders" },
      { text: "Agreement reached after 2 weeks of negotiations", tag: "timeline" },
      { text: "Environmental groups call it 'historic breakthrough'", tag: "fact" }
    ],
    perspectives: [
      {
        label: "Climate Action Advocates",
        bullets: [
          "Historic breakthrough after decades of advocacy",
          "Clear signal that fossil fuel era is ending",
          "Strong funding commitments for vulnerable nations",
          "Binding targets create accountability framework"
        ]
      },
      {
        label: "Industry & Economic Concerns",
        bullets: [
          "Transition timeline may be too aggressive for infrastructure",
          "Economic disruption in fossil fuel-dependent regions",
          "Technology challenges for rapid renewable scaling",
          "Concerns about energy security during transition"
        ]
      }
    ],
    commonGround: [
      "Need for global action on climate change is widely accepted",
      "Importance of supporting developing nations in energy transition",
      "Recognition that clean energy creates economic opportunities"
    ],
    glossary: [
      { term: "COP28", definition: "28th Conference of the Parties - annual UN climate summit 🌍" },
      { term: "Fossil fuels", definition: "Coal, oil, and gas that release CO2 when burned ⛽" },
      { term: "Renewable energy", definition: "Clean power from wind, solar, and water sources ♻️" },
      { term: "Climate adaptation", definition: "Preparing for unavoidable climate change impacts 🛡️" },
      { term: "Carbon emissions", definition: "Greenhouse gases released into the atmosphere 💨" }
    ],
    bias: { left: 30, center: 45, right: 25, confidence: "medium" },
    sentiment: { positive: 55, neutral: 30, negative: 15 },
    followUpQuestions: [
      { q: "How will this agreement be enforced?", a: "The UN will monitor progress through annual reporting and peer review mechanisms." },
      { q: "What happens to oil and gas workers?", a: "The agreement includes provisions for 'just transition' programs to retrain workers for clean energy jobs." },
      { q: "Will this actually stop climate change?", a: "This is a significant step, but scientists say more aggressive action is still needed to limit warming to 1.5°C." }
    ]
  };

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="headline-font text-4xl md:text-5xl mb-6 font-bold" style={{color: 'var(--sage)'}}>
            See It In Action
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Here's what you get when you analyze a news article with us.
          </p>
        </div>

        {/* Demo Article Card */}
        <div className="bg-white rounded-3xl card-shadow p-8 md:p-12 max-w-4xl mx-auto">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 text-sm mb-4 text-gray-700">
            <div className="flex items-center gap-1 chip-peach px-2 py-1 rounded">
              <User className="h-3 w-3" />
              <span>{demoAnalysis.meta.byline}</span>
            </div>
            <div className="flex items-center gap-1 chip-peach px-2 py-1 rounded">
              <Globe className="h-3 w-3" />
              <span>{demoAnalysis.meta.domain}</span>
            </div>
            <div className="flex items-center gap-1 chip-peach px-2 py-1 rounded">
              <Clock className="h-3 w-3" />
              <span>{demoAnalysis.meta.readingTime} min read</span>
            </div>
            <div className="chip-peach px-2 py-1 rounded text-xs font-medium">
              {demoAnalysis.meta.tone}
            </div>
          </div>
          
          {/* Title */}
          <h1 className="headline-font text-3xl md:text-4xl mb-4 leading-tight text-gray-800 font-bold">
            <span className="text-sage-600 underline decoration-sage-300" style={{ textDecorationColor: 'var(--sage)' }}>
              {demoAnalysis.meta.title}
            </span>
          </h1>
          
          {/* Provider Badge */}
          <div className="mb-6">
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
              OpenAI • gpt-4o-mini
            </span>
          </div>

          <div className="space-y-10">
            {/* TL;DR */}
            <section>
              <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--ink)'}}>TL;DR</h3>
              <div className="space-y-3">
                {demoAnalysis.tldr.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-gray-700 leading-relaxed">{paragraph}</p>
                ))}
              </div>
            </section>

            {/* ELI5 */}
            <section>
              <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--ink)'}}>Explain Like I'm 5</h3>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{demoAnalysis.eli5.summary}</p>
                <div className="p-4 rounded-xl chip-mist">
                  <p className="text-gray-700">
                    <strong>Analogy:</strong> {demoAnalysis.eli5.analogy}
                  </p>
                </div>
              </div>
            </section>

            {/* Why It Matters */}
            <section>
              <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--ink)'}}>Why It Matters</h3>
              <ul className="space-y-2">
                {demoAnalysis.whyItMatters.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{backgroundColor: 'var(--sage)'}}></div>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Key Points */}
            <section>
              <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--ink)'}}>Key Points</h3>
              <div className="grid gap-3">
                {demoAnalysis.keyPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 font-medium tag-${point.tag}`}>
                      {point.tag}
                    </span>
                    <span className="text-gray-700">{point.text}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Bias and Sentiment */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--ink)'}}>Bias Analysis</h3>
                <BiasBar 
                  left={demoAnalysis.bias.left}
                  center={demoAnalysis.bias.center}
                  right={demoAnalysis.bias.right}
                  confidence={demoAnalysis.bias.confidence}
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--ink)'}}>Sentiment</h3>
                <SentimentBar 
                  positive={demoAnalysis.sentiment.positive}
                  neutral={demoAnalysis.sentiment.neutral}
                  negative={demoAnalysis.sentiment.negative}
                />
              </div>
            </div>

            {/* Different Perspectives */}
            <section>
              <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--ink)'}}>Different Perspectives</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {demoAnalysis.perspectives.map((perspective, index) => (
                  <div key={index} className="p-6 rounded-xl chip-sky">
                    <h4 className="font-semibold mb-3" style={{color: 'var(--ink)'}}>{perspective.label}</h4>
                    <ul className="space-y-2">
                      {perspective.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{backgroundColor: 'var(--ink)'}}></div>
                          <span className="text-gray-600 text-sm">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Common Ground */}
            <section>
              <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--ink)'}}>Common Ground</h3>
              <ul className="space-y-2">
                {demoAnalysis.commonGround.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{backgroundColor: 'var(--sage)'}}></div>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Glossary */}
            <section>
              <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--ink)'}}>Glossary</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {demoAnalysis.glossary.map((item, index) => (
                  <div key={index} className="p-4 rounded-lg chip-mist">
                    <dt className="font-semibold" style={{color: 'var(--ink)'}}>{item.term}</dt>
                    <dd className="text-gray-700 text-sm mt-1">{item.definition}</dd>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="#"
            className="btn-blush px-8 py-4 font-semibold inline-block transition-all hover:transform hover:translate-y-[-2px]"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('input[type="url"]')?.scrollIntoView({ behavior: 'smooth' });
              (document.querySelector('input[type="url"]') as HTMLInputElement)?.focus();
            }}
          >
            Try it with your own article
          </a>
        </div>
      </div>
    </section>
  );
}
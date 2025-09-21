// frontend/pages/ExamplesPage.tsx
import Header from '../components/Header';
import Footer from '../components/Footer';
import BiasBar from '../components/BiasBar';
import SentimentBar from '../components/SentimentBar';
import { Clock, User, Globe } from 'lucide-react';

export default function ExamplesPage() {
  const examples = [
    {
      id: 'climate-policy',
      meta: {
        title: 'New Climate Bill Passes Senate With Bipartisan Support',
        domain: 'politicsnews.com',
        byline: 'Sarah Chen',
        readingTime: 4,
      },
      tldr: {
        headline: 'Senate approves comprehensive climate legislation',
        paragraphs: [
          'The Senate passed a major climate bill yesterday with 68 votes, including 12 Republicans who broke ranks to support the legislation after months of negotiations.',
          'The bill allocates $350 billion over 10 years for clean energy infrastructure, carbon capture technology, and green jobs training programs.',
          'Key compromises included provisions for nuclear energy expansion and exemptions for certain agricultural practices, addressing concerns from rural state senators.',
        ],
      },
      perspectives: [
        {
          label: 'Progressive Climate Action',
          bullets: [
            'Bill represents urgent response to climate crisis',
            'Investment scale matches scientific recommendations',
            'Creates pathway to carbon neutrality by 2035',
            'Prioritizes environmental justice communities',
          ],
        },
        {
          label: 'Economic Transition Approach',
          bullets: [
            'Emphasizes job creation in clean energy sector',
            'Includes protections for fossil fuel workers',
            'Balances environmental goals with economic stability',
            'Promotes American energy independence',
          ],
        },
      ],
      bias: { left: 25, center: 50, right: 25, confidence: 'high' },
      sentiment: { positive: 60, neutral: 25, negative: 15 },
      tone: 'factual',
    },
    {
      id: 'tech-regulation',
      meta: {
        title: 'EU Announces Sweeping AI Regulation Framework',
        domain: 'techreport.eu',
        byline: 'Marcus Rodriguez',
        readingTime: 6,
      },
      tldr: {
        headline: 'European Union unveils first major AI governance rules',
        paragraphs: [
          'The European Commission announced comprehensive AI regulations targeting high-risk applications in healthcare, finance, and law enforcement.',
          'Companies using AI systems must demonstrate transparency, accountability, and human oversight, with penalties up to 6% of global revenue for violations.',
          'The rules include specific protections for biometric identification and requirements for algorithmic auditing in sensitive sectors.',
        ],
      },
      perspectives: [
        {
          label: 'Innovation Protection',
          bullets: [
            'Regulations may stifle European AI competitiveness',
            'Compliance costs could burden startups and SMEs',
            'Risk of driving innovation to less regulated markets',
            'Need for flexibility as technology evolves rapidly',
          ],
        },
        {
          label: 'Rights-Based Framework',
          bullets: [
            'Essential safeguards for fundamental human rights',
            'Prevents discriminatory algorithmic decision-making',
            'Establishes global leadership in ethical AI',
            'Protects citizens from automated harm',
          ],
        },
      ],
      bias: { left: 40, center: 35, right: 25, confidence: 'medium' },
      sentiment: { positive: 30, neutral: 45, negative: 25 },
      tone: 'neutral',
    },
    {
      id: 'housing-crisis',
      meta: {
        title:
          'City Council Approves Affordable Housing Initiative Despite Developer Opposition',
        domain: 'localcitynews.org',
        byline: 'Jennifer Walsh',
        readingTime: 5,
      },
      tldr: {
        headline:
          'Municipal government mandates affordable units in new developments',
        paragraphs: [
          'The city council voted 7-4 to require new residential developments over 50 units to include 20% affordable housing or pay equivalent fees.',
          'The ordinance aims to address the housing crisis where median rent has increased 40% over three years while wages remained stagnant.',
          'Real estate developers warn the mandate could reduce overall housing supply and increase costs for market-rate buyers.',
        ],
      },
      perspectives: [
        {
          label: 'Housing Justice Advocacy',
          bullets: [
            'Addresses urgent affordability crisis for working families',
            'Ensures economic diversity in new neighborhoods',
            'Prevents displacement of long-term residents',
            'Creates sustainable communities for all income levels',
          ],
        },
        {
          label: 'Market-Based Solutions',
          bullets: [
            'Regulation could reduce overall housing development',
            'Market forces better determine optimal housing mix',
            'Added costs may be passed to other buyers',
            'Could discourage investment in local real estate',
          ],
        },
      ],
      bias: { left: 55, center: 30, right: 15, confidence: 'medium' },
      sentiment: { positive: 35, neutral: 40, negative: 25 },
      tone: 'opinionated',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Subtle grid background (md+ only) */}
      <div
        className="hidden md:block fixed inset-0 opacity-10 pointer-events-none"
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

      <main
        id="main"
        role="main"
        className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="headline-font text-4xl sm:text-5xl lg:text-6xl mb-6">
            <span style={{ color: 'var(--ink)' }}>Example</span>{' '}
            <span style={{ color: 'var(--sage)' }}>Analyses</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how Unspin breaks down real news articles with balanced
            perspectives, bias detection, and clear summaries.
          </p>
        </div>

        {/* Examples Grid */}
        <div className="space-y-12">
          {examples.map((example) => (
            <article
              key={example.id}
              className="bg-white rounded-2xl card-shadow p-8"
              aria-labelledby={`${example.id}-title`}
            >
              {/* Meta Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{example.meta.byline}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span>{example.meta.domain}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{example.meta.readingTime} min read</span>
                </div>
                <div
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{ backgroundColor: 'var(--sage)', color: 'var(--navy)' }}
                >
                  {example.tone}
                </div>
              </div>

              {/* Title */}
              <h2
                id={`${example.id}-title`}
                className="text-2xl font-bold mb-6"
                style={{ color: 'var(--navy)' }}
              >
                {example.meta.title}
              </h2>

              {/* TL;DR */}
              <section aria-label="TLDR" className="mb-8">
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: 'var(--navy)' }}
                >
                  TL;DR
                </h3>
                <div className="space-y-3">
                  {example.tldr.paragraphs.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-gray-700">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>

              {/* Perspectives */}
              <section aria-label="Different Perspectives" className="mb-8">
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: 'var(--navy)' }}
                >
                  Different Perspectives
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {example.perspectives.map((perspective, pIndex) => (
                    <div
                      key={pIndex}
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: 'var(--sky)' }}
                    >
                      <h4
                        className="font-semibold mb-3"
                        style={{ color: 'var(--navy)' }}
                      >
                        {perspective.label}
                      </h4>
                      <ul className="space-y-2">
                        {perspective.bullets.map((bullet, bIndex) => (
                          <li key={bIndex} className="text-gray-700 text-sm">
                            • {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Bias and Sentiment */}
              <div className="grid md:grid-cols-2 gap-8">
                <section aria-label="Bias Analysis">
                  <h4
                    className="font-semibold mb-3"
                    style={{ color: 'var(--navy)' }}
                  >
                    Bias Analysis
                  </h4>
                  <BiasBar
                    left={example.bias.left}
                    center={example.bias.center}
                    right={example.bias.right}
                    confidence={example.bias.confidence}
                  />
                </section>
                <section aria-label="Sentiment">
                  <h4
                    className="font-semibold mb-3"
                    style={{ color: 'var(--navy)' }}
                  >
                    Sentiment
                  </h4>
                  <SentimentBar
                    positive={example.sentiment.positive}
                    neutral={example.sentiment.neutral}
                    negative={example.sentiment.negative}
                  />
                </section>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div
            className="rounded-2xl p-8 card-shadow"
            style={{ backgroundColor: 'var(--sage)' }}
          >
            <h3
              className="display-font text-2xl mb-4"
              style={{ color: 'var(--navy)' }}
            >
              Try it with your own articles
            </h3>
            <p className="text-gray-600 mb-6">
              Get the same detailed analysis for any news article. Just paste a
              link and see the story from all angles.
            </p>
            <a
              href="/"
              className="btn-blush px-8 py-3 font-semibold inline-block transition-all hover:transform hover:translate-y-[-2px]"
            >
              Analyze an article
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

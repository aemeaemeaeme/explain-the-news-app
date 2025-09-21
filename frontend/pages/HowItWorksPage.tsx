import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link2, Cpu, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const steps = [
    {
      icon: Link2,
      title: "Paste link",
      description: "Drop any news article URL into our input box. We work with virtually any news site, blog, or publication.",
      detail: "Our system accepts URLs from major news outlets, independent blogs, and international publications. Just copy the link and paste it in."
    },
    {
      icon: Cpu,
      title: "We analyze",
      description: "Our AI reads the article and processes it through multiple perspectives to identify bias, tone, and key insights.",
      detail: "Using advanced language models, we extract the main points, identify different viewpoints, and analyze the writing style and potential bias."
    },
    {
      icon: Eye,
      title: "You get clarity",
      description: "Receive a comprehensive breakdown with TL;DR, bias analysis, opposing viewpoints, and clear explanations.",
      detail: "Get everything you need: summaries, different perspectives, key quotes, sentiment analysis, and follow-up questions to deepen your understanding."
    }
  ];

  const faqs = [
    {
      question: "Why could a site fail to analyze?",
      answer: "Some sites have paywalls, strong anti-bot protection, or technical barriers that prevent our system from reading the content. We're constantly improving our extraction methods, but some content may remain inaccessible."
    },
    {
      question: "Do you store my links?",
      answer: "We temporarily store analyzed articles for 24 hours to provide you with the analysis results, then automatically delete them. We don't track which links you submit or build profiles of your reading habits."
    },
    {
      question: "Will results be neutral?",
      answer: "We strive for balanced analysis by examining multiple perspectives and clearly labeling potential bias. Our AI is designed to present different viewpoints fairly, though perfect neutrality is challenging. We're transparent about our methods and limitations."
    },
    {
      question: "How do you make money?",
      answer: "Currently, our basic service is free with automatic deletion after 24 hours. We plan to offer paid tiers in the future with features like longer retention, workspaces, and advanced analytics for users who want more comprehensive tools."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="headline-font text-4xl sm:text-5xl lg:text-6xl mb-6">
            <span style={{color: 'var(--ink)'}}>How</span>{' '}
            <span style={{color: 'var(--sage)'}}>Unspin</span>{' '}
            <span style={{color: 'var(--ink)'}}>Works</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From article URL to comprehensive analysis in seconds. Here's how we help you see the story, not the spin.
          </p>
        </div>

        {/* Steps Section */}
        <div className="mb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div 
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 card-shadow"
                    style={{backgroundColor: 'var(--sage)'}}
                  >
                    <step.icon className="h-8 w-8" style={{color: 'var(--olive)'}} />
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200 transform translate-x-8"></div>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-3" style={{color: 'var(--navy)'}}>
                  {index + 1}. {step.title}
                </h3>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <p className="text-sm text-gray-500">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="headline-font text-3xl text-center mb-12" style={{color: 'var(--ink)'}}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg card-shadow overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold" style={{color: 'var(--navy)'}}>
                    {faq.question}
                  </h3>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div 
            className="rounded-2xl p-8 card-shadow"
            style={{backgroundColor: 'var(--sage)'}}
          >
            <h3 className="display-font text-2xl mb-4" style={{color: 'var(--navy)'}}>
              Ready to see the story behind the spin?
            </h3>
            <p className="text-gray-600 mb-6">
              Try Unspin with any news article and get instant, balanced analysis.
            </p>
            <a
              href="/"
              className="btn-blush px-8 py-3 font-semibold inline-block transition-all hover:transform hover:translate-y-[-2px]"
            >
              Start analyzing
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function FaqPage() {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      question: "How does Unspin protect my privacy?",
      answer: "We automatically delete all article analyses after 24 hours. We don't require accounts, track users, or store personal information. Your browsing data stays private."
    },
    {
      question: "What news sources does Unspin work with?",
      answer: "Unspin works with most major news websites including CNN, Reuters, BBC, Associated Press, NPR, The Guardian, and hundreds of other publications. If a site blocks automated reading, we'll let you know."
    },
    {
      question: "What happens after the 24-hour deletion period?",
      answer: "All article content, analyses, and associated data are permanently removed from our servers. You'll need to re-process the article if you want to view the analysis again."
    },
    {
      question: "Which websites work best with this tool?",
      answer: "Sites with standard article formats work best. News sites, blogs, and most online publications are supported. Paywalled content or sites with strong anti-bot protection may not be accessible."
    },
    {
      question: "How is bias analysis computed?",
      answer: "Our AI models analyze language patterns, source selection, framing, and perspective to assess political lean. We use multiple analysis passes and provide confidence levels and rationale for transparency."
    },
    {
      question: "How can I report errors or provide feedback?",
      answer: "Contact us through the support channel with specific examples of incorrect analyses. We continuously improve our models based on user feedback and accuracy reports."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0B1B2B] mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about using Unspin for news analysis
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 last:border-b-0">
              <button
                className="w-full px-6 py-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                onClick={() => toggleItem(index)}
              >
                <h2 className="text-lg font-semibold text-[#0B1B2B] pr-4">
                  {faq.question}
                </h2>
                {expandedItems.includes(index) ? (
                  <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              
              {expandedItems.includes(index) && (
                <div className="px-6 pb-6">
                  <p className="text-gray-700 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Have a question that's not answered here?
          </p>
          <a 
            href="mailto:support@unspin.news"
            className="inline-flex items-center px-6 py-3 bg-[#8FA573] hover:bg-[#738a5f] text-white font-semibold rounded-lg transition-colors"
          >
            Contact Support
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
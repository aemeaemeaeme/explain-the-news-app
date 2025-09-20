import BiasBar from './BiasBar';
import { Clock, Share, Eye } from 'lucide-react';

export default function Demo() {
  const demoArticle = {
    title: "Global Climate Summit Reaches Historic Agreement",
    tldr: "195 countries agree to reduce carbon emissions by 50% by 2030 in landmark climate deal.",
    eli5: "Almost all countries in the world promised to pollute less to help save the planet. They want to cut pollution in half by 2030.",
    whyMatters: [
      "First legally binding global climate agreement since Paris Accord",
      "Could prevent 1.5°C warming if fully implemented",
      "Represents $100 trillion in climate investments over next decade"
    ],
    biasLeft: 30,
    biasCenter: 45,
    biasRight: 25,
    biasConfidence: "high",
    readingTime: 4,
    sourceInfo: "Reuters staff reporting"
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            See It In Action
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Here's what you get when you analyze a news article with our AI
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {demoArticle.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {demoArticle.sourceInfo}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {demoArticle.readingTime} min read
                </span>
              </div>
            </div>
            <Share className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>

          <div className="space-y-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">TL;DR</h4>
              <p className="text-gray-700 text-lg">{demoArticle.tldr}</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Explain Like I'm 5</h4>
              <p className="text-gray-700">{demoArticle.eli5}</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Why It Matters</h4>
              <ul className="space-y-2">
                {demoArticle.whyMatters.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#A3B18A] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Bias Analysis</h4>
              <BiasBar 
                left={demoArticle.biasLeft}
                center={demoArticle.biasCenter}
                right={demoArticle.biasRight}
                confidence={demoArticle.biasConfidence}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

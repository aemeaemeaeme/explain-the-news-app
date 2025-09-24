import { analyzeSeo } from "@/app/actions";
import { ExternalLink } from "lucide-react";
import { TabsContainer } from "./seo-tabs";

export async function SeoResults({ url }: { url: string }) {
  const results = await analyzeSeo(url);

  // Calculate overall score
  const overallScore = Math.round(
    (results.metaTagsScore +
      results.contentScore +
      results.performanceScore +
      results.mobileScore) /
      4
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#00C853]";
    if (score >= 60) return "text-[#FFB300]";
    return "text-[#FF5757]";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-[#00C853]";
    if (score >= 60) return "bg-[#FFB300]";
    return "bg-[#FF5757]";
  };

  return (
    <div className="space-y-8">
      <div className="neo-card bg-white rotate-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{new URL(url).hostname}</h2>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-bold hover:underline"
            >
              {url} <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black">
              <span className={getScoreColor(overallScore)}>
                {overallScore}
              </span>
              /100
            </div>
            <div className={`neo-badge ${getScoreBg(overallScore)} text-white`}>
              {overallScore >= 80
                ? "GOOD"
                : overallScore >= 60
                ? "NEEDS WORK"
                : "POOR"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScoreCard
          title="Meta Tags"
          score={results.metaTagsScore}
          rotation="-rotate-1"
        />
        <ScoreCard
          title="Content"
          score={results.contentScore}
          rotation="rotate-1"
        />
        <ScoreCard
          title="Performance"
          score={results.performanceScore}
          rotation="-rotate-1"
        />
        <ScoreCard
          title="Mobile"
          score={results.mobileScore}
          rotation="rotate-1"
        />
      </div>
      <TabsContainer results={results} />
    </div>
  );
}

function ScoreCard({
  title,
  score,
  rotation,
}: {
  title: string;
  score: number;
  rotation: string;
}) {
  const getBg = (score: number) => {
    if (score >= 80) return "bg-[#00C853]";
    if (score >= 60) return "bg-[#FFB300]";
    return "bg-[#FF5757]";
  };

  return (
    <div className={`neo-card ${rotation}`}>
      <div className="text-center">
        <p className="text-xl font-bold uppercase mb-2">{title}</p>
        <p className="text-4xl font-black mb-2">{score}</p>
        <div className={`w-full h-4 neo-border ${getBg(score)}`}></div>
      </div>
    </div>
  );
}

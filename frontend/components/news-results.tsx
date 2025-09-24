// frontend/components/NewsResults.tsx
import { ExternalLink } from "lucide-react";

type Analysis = {
  meta?: {
    title: string;
    site: string;
    byline: string | null;
    readMinutes: number;
    tone: string;
  };
  tldr?: string;
  eli5?: string;
  whyItMatters?: string[];
  keyPoints?: { label: string; text: string }[];
  biasAnalysis?: { left: number; center: number; right: number; confidence: string; rationale: string };
  sentiment?: { positive: number; neutral: number; negative: number; note: string };
  perspectives?: { title: string; bullets: string[] }[];
  commonGround?: string[];
  glossary?: { term: string; definition: string }[];
  followUps?: string[];
};

export default function NewsResults({ analysis }: { analysis: Analysis }) {
  const meta = analysis.meta;

  return (
    <div className="space-y-10 max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="neo-card p-6">
        <h1 className="text-3xl font-bold mb-2">{meta?.title}</h1>
        <p className="text-gray-600">
          {meta?.site} {meta?.byline && `· by ${meta.byline}`}{" "}
          {meta?.readMinutes && `· ${meta.readMinutes} min read`}
        </p>
        <p className="italic text-sm text-gray-500">Tone: {meta?.tone}</p>
      </div>

      {/* TLDR */}
      {analysis.tldr && (
        <Section title="TL;DR">
          <p className="text-lg leading-relaxed">{analysis.tldr}</p>
        </Section>
      )}

      {/* ELI5 */}
      {analysis.eli5 && (
        <Section title="Explain Like I'm 5">
          <p className="text-lg leading-relaxed">{analysis.eli5}</p>
        </Section>
      )}

      {/* Why It Matters */}
      {analysis.whyItMatters && (
        <Section title="Why It Matters">
          <ul className="list-disc pl-5 space-y-2">
            {analysis.whyItMatters.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Key Points */}
      {analysis.keyPoints && (
        <Section title="Key Points">
          <ul className="space-y-2">
            {analysis.keyPoints.map((kp, i) => (
              <li key={i} className="p-2 border rounded">
                <span className="font-semibold capitalize">{kp.label}:</span> {kp.text}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Bias */}
      {analysis.biasAnalysis && (
        <Section title="Bias Analysis">
          <p className="mb-2">Confidence: {analysis.biasAnalysis.confidence}</p>
          <div className="flex gap-4">
            <BiasBar label="Left" value={analysis.biasAnalysis.left} color="bg-blue-500" />
            <BiasBar label="Center" value={analysis.biasAnalysis.center} color="bg-gray-400" />
            <BiasBar label="Right" value={analysis.biasAnalysis.right} color="bg-red-500" />
          </div>
          <p className="mt-3 text-sm text-gray-600">{analysis.biasAnalysis.rationale}</p>
        </Section>
      )}

      {/* Sentiment */}
      {analysis.sentiment && (
        <Section title="Sentiment Analysis">
          <div className="flex gap-4">
            <SentimentBar label="Positive" value={analysis.sentiment.positive} color="bg-green-500" />
            <SentimentBar label="Neutral" value={analysis.sentiment.neutral} color="bg-yellow-400" />
            <SentimentBar label="Negative" value={analysis.sentiment.negative} color="bg-red-500" />
          </div>
          <p className="mt-3 text-sm text-gray-600">{analysis.sentiment.note}</p>
        </Section>
      )}

      {/* Perspectives */}
      {analysis.perspectives && (
        <Section title="Different Perspectives">
          {analysis.perspectives.map((p, i) => (
            <div key={i} className="mb-4">
              <h4 className="font-semibold">{p.title}</h4>
              <ul className="list-disc pl-5">
                {p.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {/* Common Ground */}
      {analysis.commonGround && (
        <Section title="Common Ground">
          <ul className="list-disc pl-5">
            {analysis.commonGround.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Glossary */}
      {analysis.glossary && (
        <Section title="Glossary">
          <ul className="space-y-2">
            {analysis.glossary.map((g, i) => (
              <li key={i}>
                <span className="font-semibold">{g.term}:</span> {g.definition}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Follow-ups */}
      {analysis.followUps && (
        <Section title="Follow-Up Questions">
          <ul className="list-disc pl-5">
            {analysis.followUps.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="neo-card p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function BiasBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1">
      <p className="text-sm mb-1">{label} ({value}%)</p>
      <div className="w-full h-3 bg-gray-200 rounded">
        <div className={`h-3 ${color} rounded`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SentimentBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1">
      <p className="text-sm mb-1">{label} ({value}%)</p>
      <div className="w-full h-3 bg-gray-200 rounded">
        <div className={`h-3 ${color} rounded`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

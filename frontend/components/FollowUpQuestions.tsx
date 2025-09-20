import { HelpCircle } from 'lucide-react';

interface FollowUpQuestionsProps {
  questions: string[];
}

export default function FollowUpQuestions({ questions }: FollowUpQuestionsProps) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-[#A3B18A]" />
        Follow-up Questions
      </h2>
      <div className="bg-gradient-to-r from-[#A3B18A]/10 to-[#F4C7C3]/10 rounded-xl p-6">
        <p className="text-sm text-gray-600 mb-4">
          Curious to learn more? Here are some natural next questions:
        </p>
        <ul className="space-y-3">
          {questions.map((question, index) => (
            <li key={index} className="text-gray-700 flex items-start gap-2">
              <span className="text-[#A3B18A] font-bold mt-1">?</span>
              <span className="leading-relaxed">{question}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 p-3 bg-white/50 rounded-lg border border-[#A3B18A]/20">
          <p className="text-xs text-gray-500 italic">
            💡 Premium feature: Ask AI follow-up questions about this article
          </p>
        </div>
      </div>
    </section>
  );
}
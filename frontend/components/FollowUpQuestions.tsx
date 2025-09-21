import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FollowUpQuestionsProps {
  questions: string[];
}

export default function FollowUpQuestions({ questions }: FollowUpQuestionsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!questions || questions.length === 0) {
    return (
      <div className="text-gray-500 italic font-['Inter',system-ui,sans-serif]">
        No follow-up questions available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.slice(0, 3).map((question, index) => (
        <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span className="font-medium text-gray-900 font-['Inter',system-ui,sans-serif]">
              {question}
            </span>
            {openIndex === index ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          
          {openIndex === index && (
            <div className="px-6 py-4 bg-white border-t border-gray-200">
              <p className="text-gray-600 font-['Inter',system-ui,sans-serif]">
                This question helps you think deeper about the article's implications and context. 
                Consider researching this topic further from multiple sources to develop a well-rounded understanding.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
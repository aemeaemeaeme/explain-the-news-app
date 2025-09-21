import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FollowUpQuestionsProps {
  questions: Array<{ q: string; a: string }> | string[];
}

export default function FollowUpQuestions({ questions }: FollowUpQuestionsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!questions || questions.length === 0) {
    return (
      <div className="text-gray-500 italic">
        No follow-up questions available.
      </div>
    );
  }
  
  // Normalize questions to object format
  const normalizedQuestions = questions.map((item) => {
    if (typeof item === 'string') {
      return {
        q: item,
        a: 'This question helps you think deeper about the article\'s implications and context. Consider researching this topic further from multiple sources to develop a well-rounded understanding.'
      };
    }
    return item;
  });

  return (
    <div className="space-y-3">
      {normalizedQuestions.slice(0, 3).map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span className="font-medium text-gray-900 pr-4">
              {item.q}
            </span>
            {openIndex === index ? (
              <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
            )}
          </button>
          
          {openIndex === index && (
            <div className="px-6 py-4 bg-white border-t border-gray-200">
              <p className="text-gray-600">
                {item.a}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
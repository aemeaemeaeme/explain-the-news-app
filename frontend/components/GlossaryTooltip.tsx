import { useState } from 'react';

interface GlossaryTooltipProps {
  term: string;
  definition: string;
  link?: string;
}

export default function GlossaryTooltip({ term, definition, link }: GlossaryTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <span
        className="px-3 py-1 bg-[#CFE8CF] text-[#2d5a2d] rounded-full text-sm cursor-help font-['Inter',system-ui,sans-serif] hover:bg-[#A3B18A] hover:text-white transition-colors duration-200"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        {term}
      </span>
      
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10">
          <p className="font-['Inter',system-ui,sans-serif]">{definition}</p>
          {link && (
            <a 
              href={link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 underline mt-1 block"
            >
              Learn more
            </a>
          )}
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
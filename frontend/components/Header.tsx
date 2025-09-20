import { Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3"
          >
            <Newspaper className="h-8 w-8 text-[#A3B18A]" />
            <span className="text-xl font-bold text-gray-900">Explain the News</span>
          </button>
          
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="border-[#A3B18A] text-[#A3B18A] hover:bg-[#A3B18A] hover:text-white"
          >
            Try Another Article
          </Button>
        </div>
      </div>
    </header>
  );
}

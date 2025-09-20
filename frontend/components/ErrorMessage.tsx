import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ErrorMessageProps {
  title: string;
  message: string;
}

export default function ErrorMessage({ title, message }: ErrorMessageProps) {
  const navigate = useNavigate();

  return (
    <div className="text-center max-w-md mx-auto">
      <div className="p-4 bg-red-50 rounded-full w-fit mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      <Button 
        onClick={() => navigate('/')}
        className="bg-[#A3B18A] hover:bg-[#8fa573] text-white"
      >
        Try Another Article
      </Button>
    </div>
  );
}

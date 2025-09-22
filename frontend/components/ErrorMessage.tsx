import { AlertCircle } from 'lucide-react';
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

      <button
        type="button"
        onClick={() => navigate('/')}
        className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-white bg-[#A3B18A] hover:bg-[#8fa573] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A3B18A]"
      >
        Try Another Article
      </button>
    </div>
  );
}

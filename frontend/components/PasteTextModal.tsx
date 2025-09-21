import { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface PasteTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  isLoading?: boolean;
}

export default function PasteTextModal({ isOpen, onClose, onSubmit, isLoading = false }: PasteTextModalProps) {
  const [pastedText, setPastedText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (pastedText.trim().length > 1000) {
      onSubmit(pastedText.trim());
    }
  };

  const wordCount = pastedText.trim().split(/\s+/).filter(Boolean).length;
  const isValid = pastedText.trim().length > 1000 && wordCount > 200;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle>Paste Article Text</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Paste the full article text here for analysis. This bypasses any site restrictions.</p>
            <p className="mt-2">
              <strong>Minimum:</strong> 1,000 characters (~200 words) required for analysis
            </p>
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Paste the full article text here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="min-h-[300px] resize-none"
              disabled={isLoading}
            />
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">
                {pastedText.length.toLocaleString()} characters, ~{wordCount} words
              </span>
              
              <span className={`${isValid ? 'text-green-600' : 'text-orange-600'} font-medium`}>
                {isValid ? '✓ Ready for analysis' : 
                 pastedText.length > 0 ? 'Need more content' : 'Start pasting...'}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isValid || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Text'}
            </Button>
          </div>

          <div className="text-xs text-gray-500 pt-2">
            <p>
              <strong>Note:</strong> Your pasted content is processed temporarily and not stored. 
              Analysis will be performed using our AI systems with the same quality as URL-based analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
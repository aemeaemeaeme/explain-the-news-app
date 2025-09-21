import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Check } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  resetTime?: number;
}

export default function PaywallModal({ isOpen, onClose, resetTime }: PaywallModalProps) {
  const formatResetTime = (timestamp?: number) => {
    if (!timestamp) return 'tomorrow';
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return 'later today';
    } else {
      return 'tomorrow';
    }
  };

  const features = [
    'Unlimited article analysis',
    'Extended retention (7 days)',
    'Priority processing',
    'Advanced insights',
    'Export options'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl" style={{color: 'var(--ink)'}}>
            <Zap className="h-5 w-5" style={{color: 'var(--sage)'}} />
            Keep going with Unspin Pro
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="text-3xl font-bold mb-2" style={{color: 'var(--ink)'}}>
              3 free analyses used
            </div>
            <p className="text-gray-600">
              You can try again {formatResetTime(resetTime)}, or upgrade for unlimited access.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold" style={{color: 'var(--ink)'}}>Pro features:</h3>
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4" style={{color: 'var(--sage)'}} />
                <span className="text-gray-600">{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              className="w-full btn-sage py-3 rounded-lg font-semibold"
              onClick={() => {
                // TODO: Implement upgrade flow
                console.log('Upgrade to Pro clicked');
              }}
            >
              Upgrade to Pro - $9/month
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={onClose}
            >
              Try again {formatResetTime(resetTime)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
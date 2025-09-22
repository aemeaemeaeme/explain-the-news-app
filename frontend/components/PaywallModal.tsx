import { useEffect, useCallback } from 'react';
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
    return date.toDateString() === now.toDateString() ? 'later today' : 'tomorrow';
  };

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onKeyDown]);

  if (!isOpen) return null;

  const features = [
    'Unlimited article analysis',
    'Extended retention (7 days)',
    'Priority processing',
    'Advanced insights',
    'Export options',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="paywall-title"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Dialog panel */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4">
          <h2
            id="paywall-title"
            className="flex items-center gap-2 text-xl font-semibold"
            style={{ color: 'var(--ink)' }}
          >
            <Zap className="h-5 w-5" style={{ color: 'var(--sage)' }} />
            Keep going with Unspin Pro
          </h2>
        </div>

        {/* Body */}
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="text-3xl font-bold mb-2" style={{ color: 'var(--ink)' }}>
              3 free analyses used
            </div>
            <p className="text-gray-600">
              You can try again {formatResetTime(resetTime)}, or upgrade for unlimited access.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold" style={{ color: 'var(--ink)' }}>
              Pro features:
            </h3>
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4" style={{ color: 'var(--sage)' }} />
                <span className="text-gray-600">{feature}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-3">
            <button
              type="button"
              className="w-full rounded-lg py-3 font-semibold text-white btn-blush bg-[#E07A5F] hover:bg-[#cf6f56] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E07A5F]"
              onClick={() => {
                // TODO: Implement upgrade flow
                console.log('Upgrade to Pro clicked');
              }}
            >
              Upgrade to Pro - $9/month
            </button>

            <button
              type="button"
              className="w-full rounded-lg py-3 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
              onClick={onClose}
            >
              Try again {formatResetTime(resetTime)}
            </button>
          </div>
        </div>

        {/* Close (X) button for accessibility (optional) */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
        >
          <span className="sr-only">Close</span>
          ✕
        </button>
      </div>
    </div>
  );
}

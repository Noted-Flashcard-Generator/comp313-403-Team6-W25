'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function UpgradeAlert({ 
  resourceType = 'summary', 
  count, 
  limit = 3,
  showClose = true,
  fullWidth = false
}) {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();
  
  if (dismissed) return null;
  
  // Calculate progress percentage
  const progressPercentage = Math.min((count / limit) * 100, 100);
  
  // Determine alert type based on usage
  let alertType = 'info';
  if (count >= limit) {
    alertType = 'error';
  } else if (count >= limit * 0.7) { // 70% or more of limit
    alertType = 'warning';
  }
  
  // Style based on alert type
  const alertStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    error: 'bg-red-50 border-red-200 text-red-700'
  };
  
  const handleUpgrade = () => {
    router.push('/dashboard/account');
  };
  
  const resourceName = resourceType === 'summary' ? 'summaries' : 'flashcard decks';
  
  return (
    <div className={`${alertStyles[alertType]} border rounded-lg p-4 ${fullWidth ? 'w-full' : ''} relative`}>
      {showClose && (
        <button 
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Dismiss"
        >
          <FiX />
        </button>
      )}
      
      <div className="flex items-start">
        <FiAlertTriangle className="h-5 w-5 mr-3 mt-0.5" />
        <div className="flex-1">
          {count >= limit ? (
            <div>
              <h3 className="font-medium">Free tier limit reached</h3>
              <p className="text-sm mt-1">
                You've used all {limit} {resourceName} available in the free tier.
                Upgrade to premium for unlimited {resourceName}!
              </p>
            </div>
          ) : (
            <div>
              <h3 className="font-medium">Free tier usage</h3>
              <p className="text-sm mt-1">
                You've used {count} of {limit} {resourceName} available in the free tier.
              </p>
            </div>
          )}
          
          {/* Progress bar */}
          <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full ${count >= limit ? 'bg-red-500' : count >= limit * 0.7 ? 'bg-yellow-500' : 'bg-blue-500'}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {/* CTA button */}
          <Button
            onClick={handleUpgrade}
            className={`mt-3 ${count >= limit ? 'bg-rose-500 hover:bg-rose-600' : ''}`}
          >
            Upgrade to Premium
          </Button>
        </div>
      </div>
    </div>
  );
}
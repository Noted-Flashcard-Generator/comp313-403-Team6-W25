'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { FiAlertTriangle, FiLock, FiCheck } from 'react-icons/fi';

export default function UpgradeRequiredModal({ isOpen, onClose, resourceType = 'summary' }) {
  const router = useRouter();
  
  const handleUpgrade = () => {
    router.push('/dashboard/account');
    onClose();
  };
  
  const resourceTypeText = resourceType === 'summary' ? 'summaries' : 'flashcard decks';
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <FiAlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-white">
            Free Tier Limit Reached
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            You've reached the maximum of 3 {resourceTypeText} available in the free tier.
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Upgrade to Premium and get:
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <FiCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span>Unlimited {resourceTypeText}</span>
            </li>
        </ul>
        </div>
        
        <div className="space-y-2">
          <Button
            onClick={handleUpgrade}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white"
          >
            Upgrade to Premium
          </Button>
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
      </div>
    </Modal>
  );
}
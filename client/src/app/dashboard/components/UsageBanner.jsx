'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { FiTrendingUp, FiFileText, FiLayers } from 'react-icons/fi';
import { getUserUsageStats } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function UsageBanner() {
  const { user,isPaidUser } = useAuth();
  const router = useRouter();
  const [usageStats, setUsageStats] = useState({
    summaryCount: 0,
    flashcardCount: 0,
    loading: true
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getUserUsageStats();
        if (response.success) {
          setUsageStats({
            summaryCount: response.summaryCount,
            flashcardCount: response.flashcardCount,
            freeLimit: response.freeLimit,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error fetching usage stats:', error);
        setUsageStats(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchStats();
  }, [user]);
  
  if (usageStats.loading) return null;
  
  // If the user is a paid user, don't show free tier limits
  if (isPaidUser) return null;
  
  const freeLimit = usageStats.freeLimit || 3;
  const summaryPercentage = Math.min((usageStats.summaryCount / freeLimit) * 100, 100);
  const flashcardPercentage = Math.min((usageStats.flashcardCount / freeLimit) * 100, 100);
  
  // Don't show if user hasn't created anything yet
  if (usageStats.summaryCount === 0 && usageStats.flashcardCount === 0) return null;
  
  const anyLimitReached = usageStats.summaryCount >= freeLimit || usageStats.flashcardCount >= freeLimit;
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
          <FiTrendingUp className="mr-2" />
          Your Usage
        </h3>
        
        {anyLimitReached && (
          <Button
            onClick={() => router.push('/dashboard/account')}
            className="mt-2 sm:mt-0 bg-rose-500 hover:bg-rose-600 text-white"
            size="sm"
          >
            Upgrade Now
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <FiFileText className="mr-2 text-blue-500" />
              <span className="text-sm font-medium">Summaries</span>
            </div>
            <span className="text-sm font-medium">
              {usageStats.summaryCount} / {freeLimit}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div 
              className={`h-full ${usageStats.summaryCount >= freeLimit ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${summaryPercentage}%` }}
            ></div>
          </div>
          {usageStats.summaryCount >= freeLimit && (
            <p className="mt-1 text-xs text-red-500">Limit reached</p>
          )}
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <FiLayers className="mr-2 text-green-500" />
              <span className="text-sm font-medium">Flashcard Decks</span>
            </div>
            <span className="text-sm font-medium">
              {usageStats.flashcardCount} / {freeLimit}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div 
              className={`h-full ${usageStats.flashcardCount >= freeLimit ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${flashcardPercentage}%` }}
            ></div>
          </div>
          {usageStats.flashcardCount >= freeLimit && (
            <p className="mt-1 text-xs text-red-500">Limit reached</p>
          )}
        </div>
      </div>
    </div>
  );
}
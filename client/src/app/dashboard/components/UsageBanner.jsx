'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { FiTrendingUp, FiFileText, FiLayers } from 'react-icons/fi';
import {FaCrown} from 'react-icons/fa';



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
  

  const summaryLimit = isPaidUser ? 1000 : (usageStats.freeLimit || 3);
  const flashcardLimit = isPaidUser ? 1000 : (usageStats.freeLimit || 3);

  const summaryPercentage = Math.min((usageStats.summaryCount / summaryLimit) * 100, 100);
  const flashcardPercentage = Math.min((usageStats.flashcardCount / flashcardLimit) * 100, 100);
  
  // Don't show if user hasn't created anything yet
  if (usageStats.summaryCount === 0 && usageStats.flashcardCount === 0) return null;
  
 // const anyLimitReached = usageStats.summaryCount >= freeLimit || usageStats.flashcardCount >= freeLimit;
  
 return (
  <div className={`bg-white dark:bg-gray-800 border rounded-lg p-4 mb-6 shadow-sm ${
    isPaidUser 
      ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20" 
      : "border-gray-200 dark:border-gray-700"
  }`}>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
      <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
        {isPaidUser ? (
          <>
          <FaCrown className="mr-2 text-amber-500" />
          
          </>
        ) : (
          <>
          <FiTrendingUp className="mr-2" />
        
          </>
        )}
        {isPaidUser ? "Your Premium Usage" : "Your Usage"}
      </h3>
      
      {!isPaidUser && (usageStats.summaryCount >= summaryLimit || usageStats.flashcardCount >= flashcardLimit) && (
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
              {usageStats.summaryCount} / {isPaidUser ? "1000+" : summaryLimit}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                !isPaidUser && usageStats.summaryCount >= summaryLimit 
                  ? 'bg-red-500' 
                  : isPaidUser 
                    ? 'bg-amber-400' 
                    : 'bg-blue-500'
              }`}
              style={{ width: `${summaryPercentage}%` }}
            ></div>
          </div>
          {!isPaidUser && usageStats.summaryCount >= summaryLimit && (
            <p className="mt-1 text-xs text-red-500">Free limit reached</p>
          )}
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <FiLayers className="mr-2 text-green-500" />
              <span className="text-sm font-medium">Flashcard Decks</span>
            </div>
            <span className="text-sm font-medium">
              {usageStats.flashcardCount} / {isPaidUser ? "1000+" : flashcardLimit}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                !isPaidUser && usageStats.flashcardCount >= flashcardLimit 
                  ? 'bg-red-500' 
                  : isPaidUser 
                    ? 'bg-amber-400' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${flashcardPercentage}%` }}
            ></div>
          </div>
          {!isPaidUser && usageStats.flashcardCount >= flashcardLimit && (
            <p className="mt-1 text-xs text-red-500">Free limit reached</p>
          )}
        </div>
      </div>
      
      {isPaidUser && (
        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400 flex items-center">
          <FaCrown className="mr-1" /> You're on a premium plan with generous limits
        </p>
      )}
    </div>
  );
}

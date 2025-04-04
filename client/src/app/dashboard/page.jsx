'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import UsageBanner from './components/UsageBanner'; // Import the new component
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FiFileText, FiLayers, FiUser } from 'react-icons/fi';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const navigateToSummaries = () => router.push('/dashboard/summaries');
  const navigateToFlashcards = () => router.push('/dashboard/flashcards');
  const navigateToAccount = () => router.push('/dashboard/account');
  
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Welcome back, {user?.email?.split('@')[0] || 'User'}
          </p>
        </div>
        
        {/* Usage Banner - Will only show for free users */}
        <UsageBanner />
        
        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={navigateToSummaries}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <FiFileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                Summaries
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create and manage your document summaries
            </p>
          </div>
          
          <div 
            onClick={navigateToFlashcards}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <FiLayers className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                Flashcards
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate and study with AI-powered flashcards
            </p>
          </div>
          
          <div 
            onClick={navigateToAccount}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-900/30">
                <FiUser className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                Account
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your account and subscription
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
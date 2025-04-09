'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { FiAlertTriangle } from 'react-icons/fi';
import { subscriptionApi } from '@/services/api';

export default function CancelSubscriptionModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleCancel = async () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Call API to cancel subscription
      const response = await subscriptionApi.cancelSubscription();
      
      if (response.success) {
        // Calculate end date (from API or default to 30 days)
        const endDate = response.subscriptionEnd 
          ? new Date(response.subscriptionEnd) 
          : new Date(Date.now() + 30*24*60*60*1000);
        
        // Update user object with cancellation details
        const updatedUser = {
          ...user,
          isPaidUser: true, // Still paid until the end date
          subscriptionStatus: 'cancelled',
          subscriptionEndDate: endDate.toISOString()
        };
        
        // Update user context
        updateUser(updatedUser);
        
        setSuccess(true);
        setConfirmCancel(false);
      } else {
        throw new Error(response.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      setError(error.message || 'Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setConfirmCancel(false);
    if (success) {
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 300);
    } else {
      onClose();
    }
  };

  const currentEndDate = new Date(user?.subscriptionEndDate || Date.now() + 30*24*60*60*1000);
  const formattedEndDate = currentEndDate.toLocaleDateString();

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {success ? 'Subscription Cancelled' : 'Cancel Subscription'}
          </h2>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-100 text-green-700 rounded-lg text-center">
              <p className="font-medium">Your subscription has been cancelled</p>
              <p className="text-sm mt-1">Your premium features will remain active until the end of your current billing period.</p>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Your premium access will end on: {formattedEndDate}</p>
              <p>After this date, your account will automatically be converted to the free tier.</p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Got it
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {confirmCancel ? (
              <>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <FiAlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="font-medium text-yellow-700">Final confirmation</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-2">
                    Are you absolutely sure you want to cancel your premium subscription?
                  </p>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>If you cancel:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>You'll have premium access until {formattedEndDate}</li>
                    <li>No refund will be issued for the current billing period</li>
                    <li>After {formattedEndDate}, your account will revert to the free tier</li>
                    <li>You'll lose access to premium features and storage limits may apply</li>
                  </ul>
                </div>
                
                <div className="pt-2 flex flex-col space-y-2">
                  <Button
                    onClick={handleCancel}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    isLoading={loading}
                  >
                    {loading ? 'Processing...' : 'Yes, Cancel My Subscription'}
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    variant="secondary"
                    className="w-full"
                  >
                    No, Keep My Subscription
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Subscription details</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Plan: Premium ($9.99/month)</p>
                    <p>Next billing date: {formattedEndDate}</p>
                    <p>Payment method: Card ending in ****{user?.paymentMethod?.last4 || '1234'}</p>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p>Before cancelling, please note:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>You'll continue to have access to premium features until the end of your current billing period</li>
                    <li>No refunds are provided for partial billing periods</li>
                    <li>You can resubscribe at any time</li>
                  </ul>
                </div>
                
                <div className="pt-2 flex flex-col space-y-2">
                  <Button
                    onClick={handleCancel}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800"
                  >
                    Cancel Subscription
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="secondary"
                    className="w-full"
                  >
                    Keep My Subscription
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
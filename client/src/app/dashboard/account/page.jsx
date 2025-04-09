//Accout page with password change and delete account functionality accessible only to logged-in users through 
//dashboard route. The page includes a form for changing the password and a button to delete the account.
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import SubscriptionModal from './components/SubscriptionModal';
import PaymentInfoModal from './components/PaymentInfoModal';
import CancelSubscriptionModal from './components/CancelSubscriptionModal';
import ProtectedRoute from '@/components/ProtectedRoute';
import { FiUser, FiMail, FiLock, FiTrash2, FiCreditCard } from 'react-icons/fi';
import { authApi } from '@/services/api';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      await authApi.changePassword(formData.currentPassword, formData.newPassword);
      setSuccess('Password changed successfully');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      await authApi.deleteAccount(deletePassword);
      await logout();
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
    }
  };
  const handleSubscribe = () => {
    setShowSubscriptionModal(true);
  };

  const handleUpdatePayment = () => {
    setShowPaymentInfoModal(true);
  };

  const handleCancelSubscription = () => {
    setShowCancelModal(true);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Profile Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <FiUser className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Profile Picture
                  </p>
                  <button className="mt-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    Change photo
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  icon={<FiMail className="text-gray-400" />}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
 {/* Subscription Management Section */}
 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Subscription Management
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Current Plan
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.isPaidUser ? 'Premium Plan ($9.99/month)' : 'Free Plan'}
                  </p>
                  {user?.isPaidUser && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Next billing date: {new Date(user?.subscriptionEnd || Date.now() + 30*24*60*60*1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {!user?.isPaidUser ? (
                  <Button 
                    onClick={handleSubscribe}
                    className="bg-rose-500 hover:bg-rose-600 text-white"
                  >
                    Upgrade to Premium
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button 
                      onClick={handleUpdatePayment}
                      variant="secondary"
                    >
                      <FiCreditCard className="mr-2" />
                      Update Payment
                    </Button>
                    <Button 
                      onClick={handleCancelSubscription}
                      className="bg-black hover:bg-gray-300 text-white-800"
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                )}
              </div>
              
              {!user?.isPaidUser && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="text-sm font-semibold mb-2">Premium Benefits:</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
                    <li>Unlimited summaries and flashcard decks</li>
                   
                  </ul>
                </div>
              )}
            </div>
          </div>
          {/* Security Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Security
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                icon={<FiLock className="text-gray-400" />}
                required
              />
              <Input
                label="New Password"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                icon={<FiLock className="text-gray-400" />}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                icon={<FiLock className="text-gray-400" />}
                required
              />
              <Button type="submit" className="w-full">
                Change Password
              </Button>
            </form>
          </div>

          {/* Delete Account Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
              Delete Account
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <Input
                label="Confirm Password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                icon={<FiLock className="text-gray-400" />}
                required
              />
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Account
              </Button>
            </form>
          </div>
        </div>
      </div>
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        />
        <PaymentInfoModal
        isOpen={showPaymentInfoModal}
        onClose={() => setShowPaymentInfoModal(false)}
        />
        <CancelSubscriptionModal
        isOpen={showCancelModal} 
        onClose={() => setShowCancelModal(false)}
        />
    
    </ProtectedRoute>
  );
}

'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FiCreditCard, FiCalendar, FiLock } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { subscriptionApi } from '@/services/api';

export default function SubscriptionModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showCardForm, setShowCardForm] = useState(true);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Basic input formatting and validation
    if (name === 'cardNumber') {
      // Format card number with spaces every 4 digits
      const formatted = value.replace(/\s/g, '').substring(0, 16);
      const formatted2 = formatted.replace(/(\d{4})/g, '$1 ').trim();
      setFormData({
        ...formData,
        [name]: formatted2
      });
    } else if (name === 'expiryDate') {
      // Format expiry date as MM/YY
      const formatted = value.replace(/\D/g, '').substring(0, 4);
      if (formatted.length > 2) {
        setFormData({
          ...formData,
          [name]: `${formatted.substring(0, 2)}/${formatted.substring(2)}`
        });
      } else {
        setFormData({
          ...formData,
          [name]: formatted
        });
      }
    } else if (name === 'cvv') {
      // Only allow 3-4 digit CVV
      const formatted = value.replace(/\D/g, '').substring(0, 4);
      setFormData({
        ...formData,
        [name]: formatted
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
// This function handles the form submission for the subscription 
// It validates the input fields, simulates an API call to process the payment, and updates the user's subscription status
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate inputs
    if (!formData.cardNumber || !formData.cardholderName || !formData.expiryDate || !formData.cvv) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    
    // Very basic validation
    if (formData.cardNumber.replace(/\s/g, '').length < 16) {
      setError('Please enter a valid card number');
      setLoading(false);
      return;
    }
    
    if (formData.cvv.length < 3) {
      setError('Please enter a valid CVV');
      setLoading(false);
      return;
    }
    
    try {
    
      await new Promise(resolve => setTimeout(resolve, 1500));
      const paymentDetails = {
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        cardholderName: formData.cardholderName,
        expiryDate: formData.expiryDate,
        cvv: formData.cvv
      };
      // Call API to process subscription
      const response = await subscriptionApi.subscribe(paymentDetails);
      
      if (response.success) {
        // Calculate subscription end date (30 days from now)
        const subscriptionEndDate = new Date();
        subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);
        
        // Update user object with subscription details
        const updatedUser = {
          ...user,
         ...response.user,
        };
        
        // Update user context
        updateUser(updatedUser);
        
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        // Reset form
        setFormData({
          cardNumber: '',
          cardholderName: '',
          expiryDate: '',
          cvv: ''
        });
      } else {
        throw new Error(response.message || 'Failed to process subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError(error.message || 'Failed to process subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    if (success) {
      setSuccess(false);
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {success ? 'Subscription Successful!' : 'Upgrade to Premium'}
          </h2>
          {!success && (
            <p className="text-gray-600 dark:text-gray-400">
              Unlock all features for only $9.99/month
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-100 text-green-700 rounded-lg text-center">
              <p className="font-medium">Your subscription is now active!</p>
              <p className="text-sm mt-1">Thank you for upgrading to Premium.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Your Premium benefits:</h3>
              <ul className="list-disc pl-5 text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>Unlimited summaries and flashcard decks</li>
             
              </ul>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Your subscription will automatically renew on {new Date(user?.subscriptionEnd || Date.now() + 30*24*60*60*1000).toLocaleDateString()}</p>
              <p>You can cancel anytime from your account settings.</p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Got it
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Cardholder Name"
              name="cardholderName"
              type="text"
              placeholder="abcdefghijklmnop"
              value={formData.cardholderName}
              onChange={handleInputChange}
              required
            />
            
            <Input
              label="Card Number"
              name="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={handleInputChange}
              icon={<FiCreditCard className="text-gray-400" />}
              required
            />
            
            <div className="flex space-x-4">
              <div className="w-1/2">
                <Input
                  label="Expiry Date"
                  name="expiryDate"
                  type="text"
                  placeholder="MM/YY"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  icon={<FiCalendar className="text-gray-400" />}
                  required
                />
              </div>
              
              <div className="w-1/2">
                <Input
                  label="CVV"
                  name="cvv"
                  type="text"
                  placeholder="123"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  icon={<FiLock className="text-gray-400" />}
                  required
                />
              </div>
            </div>
            
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                isLoading={loading}
              >
                {loading ? 'Processing...' : 'Subscribe Now'}
              </Button>
              
              <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                By subscribing, you agree to our Terms of Service and Privacy Policy.
                Your subscription will automatically renew monthly.
              </p>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
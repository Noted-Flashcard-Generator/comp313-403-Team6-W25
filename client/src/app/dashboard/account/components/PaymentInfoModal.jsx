'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FiCreditCard, FiCalendar, FiLock } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { subscriptionApi } from '@/services/api';

export default function PaymentInfoModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
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
//process payment method update
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
      // Prepare payment details for API
      const paymentDetails = {
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        cardholderName: formData.cardholderName,
        expiryDate: formData.expiryDate,
        cvv: formData.cvv
      };
      
      // Call API to update payment method
      const response = await subscriptionApi.updatePaymentMethod(paymentDetails);
      
      if (response.success) {
        // Update user object with new payment details
        const updatedUser = {
          ...user,
          paymentMethod: {
            ...user.paymentMethod,
            cardType: getCardType(formData.cardNumber),
            last4: formData.cardNumber.replace(/\s/g, '').slice(-4),
            expMonth: parseInt(formData.expiryDate.split('/')[0])
          }
        };
        
        // Update user context
        updateUser(updatedUser);
        
        setSuccess(true);
        
        // Reset form
        setFormData({
          cardNumber: '',
          cardholderName: '',
          expiryDate: '',
          cvv: ''
        });
      } else {
        throw new Error(response.message || 'Failed to update payment information');
      }
    } catch (error) {
      console.error('Payment update error:', error);
      setError(error.message || 'Failed to update payment information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCardType = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    if (/^6(?:011|5)/.test(number)) return 'Discover';
    
    return 'Card';
  };
  const currentCard = user?.paymentMethod ? 
  `${user.paymentMethod.cardType || 'Card'} ending in ****${user.paymentMethod.last4 || ''}` : 
  'No card on file';

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
            {success ? 'Payment Information Updated' : 'Update Payment Information'}
          </h2>
          {!success && (
            <p className="text-gray-600 dark:text-gray-400">
              Enter your new payment details
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
              <p className="font-medium">Your payment information has been updated!</p>
              <p className="text-sm mt-1">Future charges will be billed to your new payment method.</p>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Card ending in: ****{user?.lastFourDigits || '1234'}</p>
              <p>Next billing date: {new Date(user?.subscriptionEnd || Date.now() + 30*24*60*60*1000).toLocaleDateString()}</p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Got it
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm mb-2">
              <p>Current payment method: Card ending in ****{currentCard}</p>
            </div>
            
            <Input
              label="Cardholder Name"
              name="cardholderName"
              type="text"
              placeholder="John Smith"
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
                className="w-full"
                isLoading={loading}
              >
                {loading ? 'Processing...' : 'Update Payment Method'}
              </Button>
              
              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5600/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  deleteAccount: async (password) => {
    const response = await api.post('/auth/delete-account', { password });
    return response.data;
  }
};

export const uploadPdf = async (file) => {
  try {
    const token = localStorage.getItem('token'); // Get JWT token from local storage

    if (!token) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await axios.post(`${API_URL}/summary/upload`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}` // Send JWT token in header
      },
    });

    return {
      success: response.data.success,
      filePath: response.data.filePath, // Path to stored PDF
      extractedText: response.data.extractedText,
      summaryId: response.data.summaryId,
    };
  } catch (error) {
    if (error.response?.data?.error === 'FREE_TIER_LIMIT') {
      return { 
        success: false, 
        error: 'FREE_TIER_LIMIT',
        message: error.response.data.message,
        currentCount: error.response.data.currentCount,
        maxAllowed: error.response.data.maxAllowed
      };
    }
    return { success: false, error: error.message };
  }
};

export const uploadRawTextSummary = async (title, text, summaryText) => {
  try {
    const token = localStorage.getItem('token'); // Get JWT token from local storage

    if (!token) {
      return { success: false, error: 'User not authenticated' };
    }

    const response = await axios.post(`${API_URL}/summary/upload-raw`,
      { title, text, summaryText }, 
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Send JWT token in header
        },
      }
    );

    return {
      success: response.data.success,
      extractedText: response.data.extractedText,
      summary: response.data.summary,
      summaryId: response.data.summaryId,
    };
  } catch (error) {
    if (error.response?.data?.error === 'FREE_TIER_LIMIT') {
      return { 
        success: false, 
        error: 'FREE_TIER_LIMIT',
        message: error.response.data.message,
        currentCount: error.response.data.currentCount,
        maxAllowed: error.response.data.maxAllowed
      };
    }
    return { success: false, error: error.message };
  }
};

export const generatedSummary = async (text) => {
  try {
    const response = await axios.post(`${API_URL}/generate-summary`, { text });

    return {
      success: response.data.success,
      summary: response.data.summary,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 🔹 Fetch Extracted Text by Summary ID
export const fetchExtractedText = async (summaryId) => {
  try {
    const response = await api.get(`/summary/${summaryId}`);
    return {
      success: response.data.success,
      extractedText: response.data.extractedText,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const fetchSummaries = async () => {
  // console.log('fetchSummaries');
  try {
    const token = localStorage.getItem('token'); // Get JWT token from local storage

    if (!token) {
      return { success: false, error: 'User not authenticated' };
    }

    const response = await axios.get(`${API_URL}/summary/summaries`, {
      headers: {
        'Authorization': `Bearer ${token}`, // Send JWT token in header
      },
    });
    return {
      success: response.data.success,
      summaries: response.data.summaries,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateSummary = async (summaryId, summary) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log("🔍 Updating summary in MongoDB", { summaryId, summary });

    const response = await axios.post(`${API_URL}/summary/update-summary`, 
      { summaryId, summary }, // ✅ Ensure summary is sent correctly
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Summary updated in MongoDB:', response.data.summary);
    } else {
      console.error('🚨 Error updating summary in MongoDB:', response.data.error);
    }

    return {
      success: response.data.success,
      summary: response.data.summary
    };
  } catch (error) {
    console.error('🚨 Error in updateSummary:', error.message);
    return { success: false, error: error.message };
  }
};

// 🔹 Add the deleteSummary function
export const deleteSummary = async (summaryId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { success: false, error: 'User not authenticated' };
    }

    const response = await axios.delete(`${API_URL}/summary/${summaryId}`, {
      headers: {
        'Authorization': `Bearer ${token}`, // Send JWT token in header
      },
    });

    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error) {
    console.error('🚨 Error deleting summary:', error.message);
    return { success: false, error: error.message };
  }
};

export const fetchFlashcardDecks = async () => {
  // console.log('fetchFlashCards');
  try {
    const response = await api.get(`/flashcard/flashcard-decks`);

    // log the response
    // console.log('API Response:', response.data);

    return {
      success: response.data.success,
      flashcardDecks: response.data.flashcardDecks
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const uploadFlashcardDeck = async (deckName, extractedText, qaPairs) => {
  try {
    // console.log('🔍 Uploading raw text as flashcard deck:', { deckName, extractedText, qaPairs });
    
    // Step 1: Create a flashcard deck in Express.js server with given deckName
    const deckResponse = await api.post('/flashcard/flashcard-deck', { deckName, extractedText });
    const deckId = deckResponse.data._id;

    // console.log('✅ Flashcard deck created successfully:', deckResponse.data);

    // Step 2: Save each Q/A pair as a flashcard
    const flashcardPromises = qaPairs.map(({ question, answer }) => {
      return api.post('/flashcard/flashcard', { question, answer, deckId });
    });

    const flashcardResults = await Promise.all(flashcardPromises);
    // console.log('✅ Flashcards saved successfully:', flashcardResults.map(res => res.data));

    // Return the deckId (database ID) and the flashcards
    return {
      success: true,
      deckId: deckId,
      flashcards: flashcardResults.map(res => res.data),
    };

  } catch (error) {
    if (error.response?.data?.error === 'FREE_TIER_LIMIT') {
      return { 
        success: false, 
        error: 'FREE_TIER_LIMIT',
        message: error.response.data.message,
        currentCount: error.response.data.currentCount,
        maxAllowed: error.response.data.maxAllowed
      };
    }
    return { success: false, error: error.message };
  }
};

// 🔹 Add the deleteSummary function
export const deleteFlashcardDeck = async (deckId) => {
  try {
    const response = await api.delete(`/flashcard/flashcard-deck/${deckId}`);

    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error) {
    console.error('🚨 Error deleting summary:', error.message);
    return { success: false, error: error.message };
  }
};
export const getUserUsageStats = async () => {
  try {
    const response = await api.get('/auth/usage');
    return {
      success: true,
      summaryCount: response.data.summaryCount,
      flashcardCount: response.data.flashcardCount,
      isPaidUser: response.data.isPaidUser,
      freeLimit: response.data.freeLimit || 3
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};
export const subscriptionApi = {
  
  // Subscribe to paid plan
  subscribe: async (paymentDetails) => {
    try {
      const token = localStorage.getItem('token'); // Get JWT token from local storage
      if (!token) {
        return { success: false, error: 'User not authenticated' };
      }
      const safePaymentDetails = {
        lastFourDigits: paymentDetails.cardNumber.slice(-4),
        expiryDate: paymentDetails.expiryDate,
        cardType: getCardType(paymentDetails.cardNumber)
      };
      
      // Send subscription request to backend
      const response = await axios.post(
        `${API_URL}/auth/subscription`, 
        {
          isPaidUser: true,
          subscriptionStatus: 'active',
          subscription: 'premium',
          subscriptionEnd: new Date(Date.now() + 30*24*60*60*1000).toISOString(),//
          paymentMethod: safePaymentDetails
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return { success: true, message: 'Subscription successful', data: response.data };
    } catch (error) {
      console.error('Subscription API error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Subscription failed. Please try again.' 
      };
    }
  },
  // Update payment method
  updatePaymentMethod: async (paymentDetails) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return { success: false, message: 'User not authenticated' };
      }
      
      // Similar secure handling as subscribe method
      const safePaymentDetails = {
        lastFourDigits: paymentDetails.cardNumber.slice(-4),
        expiryDate: paymentDetails.expiryDate,
        cardType: getCardType(paymentDetails.cardNumber)
      };
      
      // Send payment update request
      const response = await axios.post(
        `${API_URL}/auth/subscription`,
        { paymentMethod: safePaymentDetails },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update payment method.' 
      };
    }
  },
   // Cancel subscription
   cancelSubscription: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return { success: false, message: 'User not authenticated' };
      }
      
      // Send cancellation request
      const response = await axios.post(
        `${API_URL}/auth/subscription/cancel`,
        {},
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to cancel subscription.'
      };
    }
  },
  
  // Get subscription status
  getSubscriptionStatus: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return { success: false, message: 'User not authenticated' };
      }
      
      // Get current subscription status
      const response = await axios.get(
        `${API_URL}/auth/subscription`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch subscription status.'
      };
    }
  }
};
// Helper function to determine card type
function getCardType(cardNumber) {
  const number = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(number)) return 'Visa';
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'American Express';
  if (/^6(?:011|5)/.test(number)) return 'Discover';
  
  return 'Card';
}

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { FlashcardDeck } = require('../models/FlashcardSchemas');
const Summary = require('../models/Summary');
const { validatePassword } = require('../utils/passwordValidation');

const register = async (req, res) => {
  // console.log('--- Register Request Received ---');
  // console.log('Request Body:', req.body);
  try {
    const { email, password } = req.body;
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.message });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    //check if subscription has expired
    if(user.subscriptionStatus === 'cancelled' || user.subscriptionStatus === 'past-due' && 
      user.subscriptionEndDate && user.subscriptionEndDate < new Date()){
        user.isPaidUser = false;
        user.subscriptionStatus = 'inactive';
        await user.save();
      }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return token and user data
    const userResponse = {
      id: user._id,
      email: user.email,
      isPaidUser: user.isPaidUser,
      subscription: user.subscription,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate,
      paymentMethod: user.paymentMethod ? {
        lastFourDigits: user.lastFourDigits
      } : null
    };
    res.json({ token,
               user: userResponse,
             });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};
// New subscription-related functions

const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if subscription has expired
    if (user.subscriptionStatus === 'cancelled' && user.subscriptionEnd && new Date(user.subscriptionEnd) < new Date()) {
      user.isPaidUser = false;
      user.subscriptionStatus = 'none';
      await user.save();
    }

    // Return subscription data
    res.json({
      isPaidUser: user.isPaidUser,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEnd: user.subscriptionEnd,
      paymentMethod: user.paymentMethod ? {
        lastFourDigits: user.paymentMethod.lastFourDigits,
        expiryDate: user.paymentMethod.expiryDate
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting subscription status', error: error.message });
  }
};

const updateSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subscriptionId, isPaidUser, subscriptionStatus,subscription, subscriptionEndDate, paymentMethod } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update subscription fields if provided
    if (subscriptionId !== undefined) user.subscriptionId = subscriptionId;
    if (isPaidUser !== undefined) user.isPaidUser = isPaidUser;
    if (subscriptionStatus !== undefined) user.subscriptionStatus = subscriptionStatus;
    if (subscriptionEndDate !== undefined) user.subscriptionEndDate = subscriptionEndDate;
    if(subscription !== undefined) user.subscription = subscription;
    if(paymentMethod !== undefined) user.paymentMethod = paymentMethod;
    
    // Update payment method if provided
    if (paymentMethod) {
      user.paymentMethod = {
        ...user.paymentMethod,
        ...paymentMethod
      };
    }

    await user.save();
    
    res.json({ 
      message: 'Subscription updated successfully',
      isPaidUser: user.isPaidUser,
      subscriptionStatus: user.subscriptionStatus,
      subscription: user.subscription,
      subscriptionEndDate: user.subscriptionEndDate,
      paymentMethod: user.paymentMethod ? {
        lastFourDigits: user.paymentMethod.lastFourDigits,
        expiryDate: user.paymentMethod.expiryDate
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating subscription', error: error.message });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isPaidUser) {
      return res.status(400).json({ message: 'No active subscription to cancel' });
    }

    // Set subscription as canceled but keep premium until end date
    user.subscriptionStatus = 'cancelled';
    
    // If no end date is set, set it to 30 days from now
    if (!user.subscriptionEnd) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      user.subscriptionEnd = endDate;
    }

    await user.save();
    
    res.json({ 
      message: 'Subscription canceled successfully',
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEnd: user.subscriptionEnd
    });
  } catch (error) {
    res.status(500).json({ message: 'Error canceling subscription', error: error.message });
  }
};
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.userId;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password before deletion
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    // Delete user account
    await User.findByIdAndDelete(userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
};
const usage = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch summary count, flashcard count, and user data concurrently
    const [summaryCount, flashcardCount, user] = await Promise.all([
      Summary.countDocuments({ userId }),
      FlashcardDeck.countDocuments({ userId }),
      User.findById(userId),
    ]);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return usage data
    res.json({
      summaryCount,
      flashcardCount,
      isPaidUser: user.isPaidUser || false,
      subscriptionStatus: user.subscriptionStatus || 'inactive',
      summaryLimit: user.isPaidUser ? null : 3, // Example: 3 for free-tier users
      flashcardLimit: user.isPaidUser ? null : 3, // Example: 3 for free-tier users
    });
  } catch (error) {
    console.error('Error fetching usage data:', error);
    res.status(500).json({ message: 'Error fetching usage data', error: error.message });
  }
};
module.exports = {
  register,
  login,
  changePassword,
  getSubscriptionStatus,
  updateSubscription,
  cancelSubscription,
  deleteAccount,
  usage
}; 

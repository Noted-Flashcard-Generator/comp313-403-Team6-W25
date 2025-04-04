//middleware to enforce the limit for free-tier users
const User = require('../models/User');
const Summary = require('../models/Summary');
const { FlashcardDeck } = require('../models/FlashcardSchemas');     



const checkSubscriptionLimit = async (req, res, next) => {
    try {
        // Get the user ID from the request object
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Skip the check for paid users
        if (user.isPaidUser && user.subscriptionStatus === 'active') {
            return next();
        }

        

const isSummaryRoute = req.path.toLowerCase().includes('/summary') || req.path.toLowerCase().includes('/summaries') || req.path.toLowerCase().includes('/upload');
const isFlashcardRoute = req.path.toLowerCase().includes('/flashcard');
// Handle incorrect route detection
if (!isSummaryRoute && !isFlashcardRoute) {
    return res.status(500).json({ 
        message: 'Invalid route configuration' 
    });
}
let count, errorMessage;
if (isSummaryRoute) {
    count = await Summary.countDocuments({ userId: user._id });
    errorMessage = 'Free-tier users can only generate 3 summaries.';
} else {
    count = await FlashcardDeck.countDocuments({ userId: user._id });
    errorMessage = 'Free-tier users can only generate 3 flashcard decks.';
}

if (count >= 3) {
    return res.status(403).json({ 
        message: errorMessage,
        currentCount: count,
    error:'FREE_TIER_LIMIT',
        limit: 3,
        resourceType: isSummaryRoute ? 'summary' : 'flashcard' 
    });
}

next();
       
    } catch (error) {
        console.error('Error checking subscription limit:', error.stack);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

module.exports = checkSubscriptionLimit;



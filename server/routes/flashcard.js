const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const checkSubscriptionLimit = require('../middleware/checkSubscriptionLimit');
const { Flashcard, FlashcardDeck } = require('../models/FlashcardSchemas');

const router = express.Router();

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: './flashcard/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Route to create a flashcard deck
router.post('/flashcard-deck', authenticateToken, checkSubscriptionLimit, async (req, res) => {

  console.log('Creating flashcard deck');
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const { deckName, extractedText } = req.body;
  
  if (!deckName || !extractedText) {
    return res.status(400).json({ error: 'Deck name and extracted text are required' });
  }

  try {
    // Create a new flashcard deck
    const newDeck = new FlashcardDeck({
      name: deckName,
      extractedText: extractedText,
      flashcards: [], // Start with an empty list of flashcards
      userId: req.user.userId
    });

    // Save the deck to MongoDB
    await newDeck.save();

    // Return the created deck
    res.status(201).json(newDeck);
  } catch (error) {
    console.error('Error creating flashcard deck:', error);
    res.status(500).json({ error: 'Failed to create flashcard deck' });
  }
});

// Route to create a flashcard
router.post('/flashcard',authenticateToken,checkSubscriptionLimit,async (req, res) => {
  const { question, answer, deckId } = req.body;

  if (!question || !answer || !deckId) {
    return res.status(400).json({ error: 'Question, answer, and deck ID are required' });
  }

  try {
    // Create a new flashcard
    const newFlashcard = new Flashcard({
      question,
      answer,
      deckId,
    });

    // Save the flashcard to MongoDB
    await newFlashcard.save();

    // Add this flashcard to the associated deck
    const deck = await FlashcardDeck.findById(deckId);
    if (deck) {
      deck.flashcards.push(newFlashcard._id);
      await deck.save();
    }

    // Return the created flashcard
    res.status(201).json(newFlashcard);
  } catch (error) {
    console.error('Error creating flashcard:', error);
    res.status(500).json({ error: 'Failed to create flashcard' });
  }
});

// Get all flashcard decks for a user
router.get('/flashcard-decks', authenticateToken, async (req, res) => {
  // console.log('Getting flashcard decks');
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  
  try {
    const flashcardDecks = await FlashcardDeck.find({ userId: req.user.userId })
          .populate('flashcards')
          .sort({ createdAt: -1 }); // Sort by latest
    
    res.json({ success: true, flashcardDecks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/flashcard-deck/:deckId', authenticateToken, async (req, res) => {
  console.log('Deleting flashcard deck');
  
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const { deckId } = req.params;

  try {
    const deck = await FlashcardDeck.findById(deckId);
    if (!deck) {
      return res.status(404).json({ error: 'Flashcard deck not found' });
    }

    // Ensure the user owns the deck
    if (deck.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete all flashcards in this deck
    await Flashcard.deleteMany({ deckId });

    // Delete the deck itself
    await deck.deleteOne();

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting flashcard deck:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

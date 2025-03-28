const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
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
router.post('/flashcardDeck', authenticateToken, async (req, res) => {

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
router.post('/flashcard', async (req, res) => {
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

module.exports = router;

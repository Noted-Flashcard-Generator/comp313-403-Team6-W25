'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { FiAlertTriangle } from 'react-icons/fi';
import axios from 'axios';
import { uploadFlashcardDeck, getUserUsageStats } from '@/services/api';

// Flask API route to generate QA pairs from raw text
const FLASK_API_URL = 'http://127.0.0.1:3003/generate-qa-raw';

export default function TextInputModal({ isOpen, onClose }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState(null);
  const [flashcards, setFlashcards] = useState(null);
  const [flashcardDeckId, setFlashcardDeckId] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);

  const maxWords = 1000;

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  // Fetch usage data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsageData();
    }
  }, [isOpen]);

  const fetchUsageData = async () => {
    try {
      const response = await getUserUsageStats();
      if (response.success) {
        setUsageData(response);
        
        // Show alert if at or over limit
        if (!response.isPaidUser && response.flashcardCount >= response.flashcardLimit) {
          setShowUpgradeAlert(true);
        }
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  };

  const handleUpgrade = () => {
    onClose();
    router.push('/dashboard/account');
  };

  const handleSubmit = async () => {
    // Check if user has reached free tier limit
    if (usageData && !usageData.isPaidUser && usageData.flashcardCount >= usageData.flashcardLimit) {
      setStatus({ 
        message: 'You\'ve reached the free tier limit. Upgrade to create more flashcard decks!', 
        type: 'error' 
      });
      setShowUpgradeAlert(true);
      return;
    }

    if (!text) {
      setStatus({ message: 'Please enter some text to generate flashcards from', type: 'error' });
      return;
    }

    if (wordCount > maxWords) {
      setStatus({ message: `Maximum ${maxWords} words allowed`, type: 'error' });
      return;
    }

    if (!title) {
      setStatus({ message: 'Please enter a title for the flashcard deck to be created', type: 'error' });
      return;
    }
    
    setIsGenerating(true);
    setStatus(null);

    try {
      // Step 1: Call Flask API to generate QA pairs from raw text
      const flaskResponse = await axios.post(
        FLASK_API_URL, 
        { text: text },
        { headers: { 'Content-Type': 'application/json' }}
      );

      const qaPairs = flaskResponse.data.response;

      if (!qaPairs || qaPairs.length === 0) {
        setStatus({ message: 'No flashcards generated. Please try again.', type: 'error' });
        return;
      }

      // Step 2: Upload the generated flashcards to the backend express.js server
      const uploadResponse = await uploadFlashcardDeck(title, text, qaPairs);

      if (!uploadResponse.success) {
        // Check for free tier limit error
        if (uploadResponse.error === 'FREE_TIER_LIMIT') {
          setStatus({ 
            message: 'You\'ve reached the free tier limit for flashcard decks.', 
            type: 'error' 
          });
          setShowUpgradeAlert(true);
          return;
        }
        
        throw new Error("Failed to upload raw text flashcard deck");
      }

      setFlashcards(uploadResponse.flashcards);
      setFlashcardDeckId(uploadResponse.deckId);
      setStatus({ message: 'Flashcard deck generated successfully', type: 'success' });
      
      // Refresh usage data after successful creation
      fetchUsageData();

    } catch (err) {
      console.error('Error generating flashcard deck:', err);
      
      // Check if the error is a free tier limit error
      if (err.response?.data?.error === 'FREE_TIER_LIMIT') {
        setStatus({ 
          message: 'You\'ve reached the free tier limit for flashcard decks.', 
          type: 'error' 
        });
        setShowUpgradeAlert(true);
      } else {
        setStatus({ message: 'Failed to generate the flashcard deck. Please try again.', type: 'error' });
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Enter Text
          </h2>
          {status && (
            <div className={`p-3 rounded ${
              status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {status.message}
            </div>
          )}
        </div>

        {/* Free Tier Limit Alert */}
        {showUpgradeAlert && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <FiAlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-700">Free tier limit reached</h3>
                <p className="text-sm text-yellow-600 mt-1">
                  You've used all {usageData?.flashcardLimit || 3} flashcard decks available in the free tier.
                </p>
                <Button
                  onClick={handleUpgrade}
                  className="mt-3 bg-rose-500 hover:bg-rose-600 text-white"
                >
                  Upgrade to Premium
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Usage Warning (when approaching limit) */}
        {usageData && !usageData.isPaidUser && 
         !showUpgradeAlert && 
         usageData.flashcardCount > 0 && 
         usageData.flashcardCount < usageData.flashcardLimit && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-700">
              You've used {usageData.flashcardCount} of {usageData.flashcardLimit} flashcard decks in your free tier.
            </p>
          </div>
        )}

        {!showUpgradeAlert && (
          <>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Give Your Flashcard Deck a Name
              </p>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title..." 
                className="w-full p-1 px-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white my-4" 
              />
              <p className="text-gray-600 dark:text-gray-400">
                Paste or type your text to generate a flashcard deck
              </p>
            </div>

            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-64 p-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                placeholder="Enter your text here..."
              />
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex justify-between">
                <span>Maximum {maxWords} words</span>
                <span>{wordCount} / {maxWords} words</span>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {!showUpgradeAlert && (
            <Button 
              onClick={handleSubmit}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Flashcard Deck'}
            </Button>
          )}
        </div>

        {/* Flashcard Deck Display */}
        {flashcardDeckId && !flashcards && !isGenerating ? (
          <div className="mt-6 p-6 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              No Flashcard Deck Created
            </h3>
            <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">
              Check if page range of document has been exceeded.
            </p>
          </div>
        ) : flashcards ? (
          <div className="mt-6 p-6 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Generated Flashcard Deck
            </h3>
            <ul className="text-gray-700 dark:text-gray-300">
              {flashcards.map((flashcard, index) => (
                <li key={index} className="mb-2">
                  <strong>Q:</strong> {flashcard.question} <br />
                  <strong>A:</strong> {flashcard.answer}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
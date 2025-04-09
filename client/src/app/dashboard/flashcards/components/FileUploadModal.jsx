'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import axios from 'axios';
import { FiAlertTriangle } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { uploadFlashcardDeck, getUserUsageStats } from '@/services/api';

export default function FileUploadModal({ isOpen, onClose }) {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [status, setStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(5);
  const [flashcards, setFlashcards] = useState(null);
  const [flashcardDeckId, setFlashcardDeckId] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);

  // File size constraints
  const MIN_FILE_SIZE = 0.01;
  const MAX_FILE_SIZE = 100;
  const FLASK_API_URL = 'http://127.0.0.1:3003/generate-qa';

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
        
        // Show alert if close to or at limit
        if (!response.isPaidUser && response.flashcardCount >= response.flashcardLimit) {
          setShowUpgradeAlert(true);
        }
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  };

  const handleFileChange = useCallback(async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setStatus({ message: 'Only PDF files are allowed', type: 'error' });
      setFile(null);
      return;
    }

    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB < MIN_FILE_SIZE || fileSizeMB > MAX_FILE_SIZE) {
      setStatus({ 
        message: `File size must be between ${MIN_FILE_SIZE}MB and ${MAX_FILE_SIZE}MB`, 
        type: 'error' 
      });
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setFileUrl(URL.createObjectURL(selectedFile));
    setStatus({ message: 'PDF selected', type: 'success' });
  }, []);

  const handleUpgrade = () => {
    onClose();
    router.push('/dashboard/account');
  };

  const handleSubmit = async () => {
    if (!file) return;
    
    // Check if user has reached free tier limit
    if (usageData && !usageData.isPaidUser && usageData.flashcardCount >= usageData.flashcardLimit) {
      setStatus({ 
        message: 'You\'ve reached the free tier limit. Upgrade to create more flashcard decks!', 
        type: 'error' 
      });
      setShowUpgradeAlert(true);
      return;
    }
    
    setIsGenerating(true);
    setStatus(null);

    if (startPage > endPage || endPage - startPage > 5) {
      setStatus({ message: 'Invalid page range. Please try again.', type: 'error' });
      setIsGenerating(false);
      return;
    }
    
    let pageRange = "";
    if(startPage == endPage){
      pageRange = `${startPage}`;
    }
    else{
      pageRange = `${startPage}-${endPage}`;
    }
    
    try {
      // send to Flask API for processing
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pages', pageRange || "1-5");

      const flaskResponse = await axios.post(FLASK_API_URL, formData);

      if (flaskResponse.status !== 200) {
        setStatus({ message: 'Failed to generate flashcard deck. Please try again.', type: 'error' });
        console.log("Flask response is not 200.");
        return;
      }

      const qaPairs = flaskResponse.data.response.questions;
      const extractedText = flaskResponse.data.response.extracted_text;
      
      if (!qaPairs || qaPairs.length === 0) {
        setStatus({ message: 'No flashcards generated. Please try again.', type: 'error' });
        console.log("Flask response is empty.");
        return;
      }
      
      const uploadResponse = await uploadFlashcardDeck(file.name, extractedText, qaPairs);
      
      if (!uploadResponse.success) {
        // Check if the error is a free tier limit
        if(uploadResponse.error === 'FREE_TIER_LIMIT'){
          setStatus({ 
            message: 'You\'ve reached the free tier limit. Upgrade to create more flashcard decks!', 
            type: 'error' 
          });
          setShowUpgradeAlert(true);
          return;
        }
        throw new Error('Failed to generate flashcard deck');
      }
      
      setFlashcards(uploadResponse.flashcards);
      setFlashcardDeckId(uploadResponse.deckId);
      setStatus({ message: 'Flashcard deck generated successfully', type: 'success' });
      fetchUsageData(); // Refresh usage data after generating flashcard deck
    } catch (error) {
      console.error('Error generating flashcard deck:', error);
      
      if(error.response?.data?.error === "FREE_TIER_LIMIT"){
        setStatus({ 
          message: 'You\'ve reached the free tier limit. Upgrade to create more flashcard decks!', 
          type: 'error' 
        });
        setShowUpgradeAlert(true);
      } else {
        setStatus({ 
          message: 'Failed to generate flashcard deck. Please try again.', 
          type: 'error' 
        });
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
            Upload PDF
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Select a PDF file to generate a flashcard deck
          </p>
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

        {/* File Upload Section */}
        <div className="space-y-4">
          <Input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full"
            disabled={showUpgradeAlert}
          />

          {status && (
            <div className={`p-3 rounded ${
              status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {status.message}
            </div>
          )}

          {file && !showUpgradeAlert && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Page Range (Max 5 Pages):
              </label>
              <div className='flex gap-4 justify-center'>
                <input 
                  type='number' 
                  value={startPage} 
                  placeholder='start' 
                  onChange={(e) => setStartPage(Number(e.target.value))} 
                  className="w-1/3 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <input 
                  type='number' 
                  value={endPage} 
                  placeholder='end' 
                  onChange={(e) => setEndPage(Number(e.target.value))} 
                  className="w-1/3 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          {fileUrl && (
            <Button 
              onClick={() => window.open(fileUrl, '_blank')}
              variant="outline"
            >
              View PDF
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="secondary"
          >
            Cancel
          </Button>
          {file && !showUpgradeAlert && (
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
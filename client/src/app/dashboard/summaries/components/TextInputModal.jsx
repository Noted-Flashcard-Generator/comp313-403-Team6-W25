'use client';

import { useState,useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { uploadRawTextSummary, getUserUsageStats } from '@/services/api';
import { useRouter } from 'next/navigation';

const FLASK_API_URL_DEFAULT = 'http://127.0.0.1:3003'; // Base URL for local development
const FLASK_API_URL_BASE = process.env.NEXT_PUBLIC_FLASK_API_URL || FLASK_API_URL_DEFAULT;
const SUMMARIZE_RAW_ENDPOINT = '/summarizeraw';

const FLASK_API_URL = FLASK_API_URL_BASE + SUMMARIZE_RAW_ENDPOINT;
console.log('Flask:', FLASK_API_URL);

export default function TextInputModal({ isOpen, onClose }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState(null);
  const [summary, setSummary] = useState('');
  const [summaryId, setSummaryId] = useState(null);

  // State to store usage statistics and whether the user has hit their free-limit
  const [usageData, setUsageData] = useState(null);
  const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);
  const maxWords = 1000;
 

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
// Fetch usage data when the modal opens to know if free-tier limits are reached
useEffect(() => {
  if (isOpen) {
    fetchUsageData();
  }
}, [isOpen]);

// Function that calls the API to retrieve usage statistics
const fetchUsageData = async () => {
  try {
    const response = await getUserUsageStats();
    if (response.success) {
      setUsageData(response);
      // For summaries, assume a free limit from the response or default to 3.
      if (!response.isPaidUser && response.summaryCount >= (response.freeLimit || 3)) {
        setShowUpgradeAlert(true);
      }
    }
  } catch (error) {
    console.error('Error fetching usage data:', error);
  }
};

// When the user clicks the upgrade button, close the modal and push to the account page.
const handleUpgrade = () => {
  onClose();
  router.push('/dashboard/account');
};
 // The handleSubmit function is triggered when the user clicks "Generate Summary"
  // It first validates the inputs then calls the Flask API to generate a summary,
  // finally it uploads the summary using our API, updates state, and refreshes usage data.
const handleSubmit = async () => {
  // Check if the free tier limit for summaries has been reached (if applicable)
  if (usageData && !usageData.isPaidUser && usageData.summaryCount >= (usageData.freeLimit || 3)) {
    setStatus({
      message: "You've reached the free tier limit for summaries. Upgrade to create more summaries!",
      type: 'error'
    });
    setShowUpgradeAlert(true);
    return;
  }
  // Validate that text has been entered
  if (!text) {
    setStatus({ message: 'Please enter some text to generate a summary', type: 'error' });
    return;
  }
  // Validate word count
  if (wordCount > maxWords) {
    setStatus({ message: `Maximum ${maxWords} words allowed`, type: 'error' });
    return;
  }
  // Validate that a title has been provided
  if (!title) {
    setStatus({ message: 'Please enter a title for the summary', type: 'error' });
    return;
  }
  // Set the generation flag and clear previous status messages
  setIsGenerating(true);
  setStatus(null);

  try {
    // Call the Flask API (summarizeraw endpoint) by sending the raw text.
    const flaskResponse = await axios.post(
      FLASK_API_URL,
      { text: text },
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Check that the API returned a summary.
    if (!flaskResponse.data.summary) {
      setStatus({ message: 'Failed to generate summary.', type: 'error' });
      return;
    }

    // Once a summary is generated, upload it (with the title and original text)
    const uploadResponse = await uploadRawTextSummary(title, text, flaskResponse.data.summary);
    if (!uploadResponse.success) {
      throw new Error("Failed to upload raw text summary");
    }

    // Update state with the summary data
    setSummary(flaskResponse.data.summary);
    setSummaryId(uploadResponse.summaryId);
    setStatus({ message: 'Summary generated successfully', type: 'success' });

    // Refresh the usage data to update any counters
    fetchUsageData();
  } catch (err) {
    console.error('Error generating summary:', err);
    setStatus({ message: 'Failed to generate summary. Please try again.', type: 'error' });
  } finally {
    setIsGenerating(false);
  }
};
  // Render the modal along with inputs and alerts
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        {/* Title and status messages */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Enter Text
          </h2>
          {status && (
            <div className={`p-3 rounded ${status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {status.message}
            </div>
          )}
          <p className="text-gray-600 dark:text-gray-400">
            Give Your Summary a Name
          </p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title..."
            className="w-full p-1 px-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white my-4"
          />
          <p className="text-gray-600 dark:text-gray-400">
            Paste or type your text to generate a summary
          </p>
        </div>

        {/* Text Input */}
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

        {/* Display an upgrade alert if the user is over the limit */}
        {showUpgradeAlert && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <FiAlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-700">Free tier limit reached</h3>
                <p className="text-sm text-yellow-600 mt-1">
                  You've used all {(usageData && usageData.freeLimit) || 3} summaries available in the free tier.
                </p>
                <Button onClick={handleUpgrade} className="mt-3 bg-rose-500 hover:bg-rose-600 text-white">
                  Upgrade to Premium
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons (only show when not over the upgrade limit) */}
        {!showUpgradeAlert && (
          <div className="flex justify-end space-x-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Summary'}
            </Button>
          </div>
        )}

        {/* Summary Display */}
        {summaryId && !summary && !isGenerating ? (
          <div className="mt-6 p-6 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              No Summary Created
            </h3>
            <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">
              Check if there was an error.
            </p>
          </div>
        ) : summary ? (
          <div className="mt-6 p-6 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Generated Summary
            </h3>
            <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">
              {summary}
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

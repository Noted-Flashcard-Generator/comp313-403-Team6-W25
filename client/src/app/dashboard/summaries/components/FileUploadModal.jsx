'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { updateSummary, uploadPdf } from '@/services/api';
import axios from 'axios';

const FLASK_API_URL_DEFAULT = 'http://127.0.0.1:3003'; // Base URL for local development
const FLASK_API_URL_BASE = process.env.NEXT_PUBLIC_FLASK_API_URL || FLASK_API_URL_DEFAULT;
const SUMMARIZE_ENDPOINT = '/summarize';

const FLASK_API_URL = FLASK_API_URL_BASE + SUMMARIZE_ENDPOINT;
console.log('Flask:', FLASK_API_URL);

export default function FileUploadModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [status, setStatus] = useState(null);
  const [summary, setSummary] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryId, setSummaryId] = useState(null);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(5);

  // File size constraints
  const MIN_FILE_SIZE = 0.01;
  const MAX_FILE_SIZE = 100;

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
    setSummary('');
    setSummaryId(null);
    setStatus({ message: 'PDF selected', type: 'success' });
  }, []);

  const handleGenerateSummary = async () => {
    if (!file) return;

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
      if (!flaskResponse.data.summary){
        setStatus({message: 'Failed to generate summary', type: 'error'});
        console.log("Flask response is empty.");
        return;
      }
      
      if (flaskResponse.status === 200) {
        const uploadResponse = await uploadPdf(file);
        if (!uploadResponse.success) {
          throw new Error('Failed to upload PDF');
        }
        const updateResponse = await updateSummary(uploadResponse.summaryId, flaskResponse.data.summary);

        if (updateResponse.success) {
          setSummary(flaskResponse.data.summary);
          setSummaryId(uploadResponse.summaryId);
          setStatus({ message: 'Summary generated successfully', type: 'success' });
        }
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setStatus({ 
        message: 'Failed to generate summary. Please try again.', 
        type: 'error' 
      });
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
            Select a PDF file to generate a summary
          </p>
        </div>

        {/* File Upload Section */}
        <div className="space-y-4">
          <Input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full"
          />

          {status && (
            <div className={`p-3 rounded ${
              status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {status.message}
            </div>
          )}

          {file && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Page Range (Max 5 Pages):
              </label>
              <div className='flex gap-4 justify-center'>
                <input type='number' value={startPage} placeholder='start' onChange={(e) => setStartPage(Number(e.target.value))} className="w-1/3 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                <input type='number' value={endPage} placeholder='end' onChange={(e) => setEndPage(Number(e.target.value))} className="w-1/3 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
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
          {file && (
            <Button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Summary'}
            </Button>
          )}
        </div>

        {/* Summary Display */}
        {summaryId && !summary && !isGenerating ? (
          <div className="mt-6 p-6 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              No Summary Created
            </h3>
            <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">
              Check if page range of document has been exceeded.
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

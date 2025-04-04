'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateSummary, uploadPdf, deleteSummary } from '@/services/api'; // Make sure deleteSummary is imported
import axios from 'axios';

export default function PdfUploader() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [status, setStatus] = useState(null);
  const [summary, setSummary] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); 
  const [summaryId, setSummaryId] = useState(null);
  const [pageRange, setPageRange] = useState('1-5');
  const [totalPages, setTotalPages] = useState(0);

  // File size constraints (in MB)
  const MIN_FILE_SIZE = 0.01; // 10KB
  const MAX_FILE_SIZE = 100; // 10MB
  const FLASK_API_URL = 'http://127.0.0.1:3003/summarize'; // Flask endpoint

  const handleFileChange = useCallback(async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setStatus({ message: 'Only PDF files are allowed', type: 'error' });
      setFile(null);
      return;
    }
    // Check file size constraints
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB < MIN_FILE_SIZE) {
      setStatus({ 
        message: `File too small. Minimum size is ${MIN_FILE_SIZE}MB`, 
        type: 'error' 
      });
      setFile(null);
      return;
    }
    
    if (fileSizeMB > MAX_FILE_SIZE) {
      setStatus({ 
        message: `File too large. Maximum size is ${MAX_FILE_SIZE}MB`, 
        type: 'error' 
      });
      setFile(null);
      return;
    }
   
    setFile(selectedFile);
    setFileUrl(URL.createObjectURL(selectedFile)); // Temporary local preview URL
    
    setSummary(''); // Clear previous summary
    setSummaryId(null); // Clear previous summaryId
    setStatus({ message: 'PDF selected', type: 'success' });
    try {
      // Upload file immediately to get summaryId
      const uploadResult = await uploadPdf(selectedFile);
        
      if (uploadResult.success) {
        // Set the URL from the server path
        setFileUrl(uploadResult.filePath);
          
        // Save the summaryId
        setSummaryId(uploadResult.summaryId);
          
        console.log('File uploaded, summaryId:', uploadResult.summaryId);
        setStatus({ message: 'PDF ready for summarization', type: 'success' });
      } else {
        setStatus({ message: 'Upload failed: ' + uploadResult.error, type: 'error' });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setStatus({ message: 'Upload failed: ' + error.message, type: 'error' });
    }
  }, []);

  const handleViewPdf = () => {
    if (!fileUrl) {
      alert('Please select a PDF first.');
      return;
    }
    window.open(fileUrl, '_blank'); // Open the selected PDF in a new tab
  };

  const handleGenerateSummary = async () => {
    if (!file) {
      setStatus({ message: 'No PDF available to summarize.', type: 'error' });
      return;
    }

    setIsGenerating(true);
    setStatus({ message: 'Generating summary...', type: 'loading' });

    try {
      // Create form data to send the PDF file directly to Flask
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pages', pageRange || "1-5");

      // Send the PDF directly to Flask
      const response = await axios.post(FLASK_API_URL, formData);
      console.log('FLASK API COMPLETE RESPONSE:', response);
      console.log('RESPONSE DATA STRUCTURE:', JSON.stringify(response.data, null, 2));
      if (response.status === 200) {
        const generatedSummary = response.data.summary;
        setSummary(generatedSummary);
        setStatus({ message: '✅ Summary generated successfully!', type: 'success' });

        if (summaryId) {
          console.log('SENDING TO MONGODB - summaryId:', summaryId);
          console.log('SENDING TO MONGODB - summary text:', generatedSummary?.substring(0, 100) + '...');
          try {
            // Use the updateSummary function from the API service
            const updateResult = await updateSummary(summaryId, generatedSummary);
            console.log('UPDATE RESULT:', updateResult);
            if (updateResult.success) {
              console.log('Summary updated in MongoDB', updateResult.summary);
            } else {
              console.error('Error updating summary in MongoDB:', updateResult.error);
            }
          } catch (updateError) {
            console.error('Failed to update summary in database:', updateError);
          }
        }
      } else {
        setStatus({ message: response.data.error || 'Summary generation failed', type: 'error' });
      }
    } catch (error) {
      console.error('Summary generation error:', error);
      setStatus({ 
        message: `⚠️ ${error.response?.data?.error || 'Error generating summary'}`, 
        type: 'error' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle delete summary
  const handleDeleteSummary = async () => {
    if (!summaryId) {
      setStatus({ message: 'No summary to delete.', type: 'error' });
      return;
    }

    try {
      const response = await deleteSummary(summaryId); // Call deleteSummary function
      if (response.success) {
        setStatus({ message: 'Summary deleted successfully', type: 'success' });
        setSummary('');
        setSummaryId(null);
      } else {
        setStatus({ message: 'Failed to delete summary', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting summary:', error);
      setStatus({ message: 'Error deleting summary', type: 'error' });
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="space-y-4">
        {/* Select PDF */}
        <label className="block text-gray-700 font-medium">
          Select a PDF ({MIN_FILE_SIZE}MB - {MAX_FILE_SIZE}MB)
        </label>
    
        <Input 
          type="file" 
          accept=".pdf"
          onChange={handleFileChange}
          className="w-full"
          disabled={isUploading}
        />
    
        {/* Page Range Selection */}
        {file && (
          <div>
            <label className="block text-gray-700 font-medium mt-4">
              Select Page Range (Max 5 Pages):
            </label>
            <select 
              className="w-full p-2 border rounded mt-2"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
            >
              <option value="1-5">Pages 1-5</option>
              <option value="6-10">Pages 6-10</option>
              <option value="11-15">Pages 11-15</option>
              <option value="16-20">Pages 16-20</option>
            </select>
          </div>
        )}
  
        {/* Status message */}
        {status && (
          <div className={`p-2 rounded text-center mt-2
                        ${status.type === 'success' ? 'bg-green-100 text-green-800' : ''}
                        ${status.type === 'error' ? 'bg-red-100 text-red-800' : ''}
                        ${status.type === 'loading' ? 'bg-blue-100 text-blue-800' : ''}`}>
            {status.message}
          </div>
        )}
  
        {/* PDF preview */}
        {fileUrl && (
          <div className="mt-4 text-center">
            <h3 className="text-lg font-semibold">PDF Selected:</h3>
            <Button 
              onClick={handleViewPdf}
              className="px-4 py-2 mt-2 border border-blue-500 bg-blue-500 text-white text-lg rounded-md hover:bg-blue-600"
            >
              View PDF
            </Button>
          </div>
        )}
  
        {/* Generate summary button */}
        {file && (
          <div className="flex justify-center mt-4">
            <Button 
              onClick={handleGenerateSummary}
              className="px-4 py-2 border border-green-500 bg-green-500 text-white text-lg rounded-md hover:bg-green-600"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Summary'}
            </Button>
          </div>
        )}

        {/* Delete summary button */}
        {summary && (
          <div className="flex justify-center mt-4">
            <Button 
              onClick={handleDeleteSummary}
              className="px-4 py-2 border border-red-500 bg-red-500 text-white text-lg rounded-md hover:bg-red-600"
            >
              Delete Summary
            </Button>
          </div>
        )}
  
        {/* Summary display */}
        {summary && (
          <div className="mt-4 p-3 border rounded bg-gray-50 text-gray-700">
            <h3 className="text-lg font-semibold">Summary:</h3>
            <p className="whitespace-pre-line">{summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}

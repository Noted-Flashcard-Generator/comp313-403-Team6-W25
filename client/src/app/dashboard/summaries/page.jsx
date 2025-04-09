'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Modal } from '@/components/ui/Modal';
import { fetchSummaries, deleteSummary } from '@/services/api'; 
import { FiUpload, FiFileText, FiTrash } from 'react-icons/fi'; // Import the trash icon
import FileUploadModal from './components/FileUploadModal';
import TextInputModal from './components/TextInputModal';
import InlineSummaryEditor from './components/InlineSummaryEditor';
import 'react-quill/dist/quill.snow.css';


export default function Summaries() {
  const router = useRouter();
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = async () => {
    setLoading(true);
    try {
      const response = await fetchSummaries();
      if (response.success) {
        setSummaries(response.summaries);
      }
    } catch (error) {
      console.error('Error loading summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedSummaries = [...summaries].sort((a, b) => {
    if (sortField === 'createdAt') {
      return sortDirection === 'asc' 
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt);
    }
    const valueA = a[sortField]?.toLowerCase() || '';
    const valueB = b[sortField]?.toLowerCase() || '';
    return sortDirection === 'asc' 
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewSummary = (summary) => {
    setSelectedSummary(summary);
    setShowSummaryModal(true);
  };

  const handleDelete = async (summaryId) => {
    // Ask for confirmation
    const isConfirmed = window.confirm('Are you sure you want to delete this summary?');
    if (isConfirmed) {
      try {
        const response = await deleteSummary(summaryId); // Call the delete function
        if (response.success) {
          // Remove the deleted summary from the local state
          setSummaries(summaries.filter(summary => summary._id !== summaryId));
        } else {
          alert('Failed to delete summary. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting summary:', error);
        alert('An error occurred while deleting the summary.');
      }
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Create Summary Card */}
        <div 
          onClick={() => setIsMethodModalOpen(true)}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 dark:border-gray-600"
        >
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <span className="text-4xl mb-2">➕</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
                Create New Summary
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload a PDF or paste text to generate a summary
              </p>
            </div>
          </div>
        </div>

        {/* Summaries Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
          </div>
        ) : summaries.length > 0 ? (
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th 
                    className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 text-left font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
                    onClick={() => handleSort('originalFileName')}
                  >
                    Name
                    {sortField === 'originalFileName' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 text-left font-medium text-gray-700 dark:text-gray-200">
                    Summary Preview
                  </th>
                  <th 
                    className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 text-left font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created At
                    {sortField === 'createdAt' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 text-left font-medium text-gray-700 dark:text-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSummaries.map((summary) => (
                  <tr key={summary._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                      {summary.originalFileName}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                      {summary.summary && summary.summary.length > 100
                       ? `${summary.summary.slice(0, 100)}...`
                       : summary.summary || 'No Summary'}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                      {formatDate(summary.createdAt)}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                      <button 
                        onClick={() => viewSummary(summary)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleDelete(summary._id)} 
                        className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                      >
                        <FiTrash className="inline-block mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              No summaries yet. Create your first one!
            </p>
          </div>
        )}

        {/* Method Selection Modal */}
        <Modal isOpen={isMethodModalOpen} onClose={() => setIsMethodModalOpen(false)}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Choose Summary Method
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              How do you want to provide your content?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setIsMethodModalOpen(false);
                setIsFileModalOpen(true);
              }}
              className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiUpload className="w-8 h-8 mb-3 text-rose-500" />
              <span className="text-gray-900 dark:text-white font-medium">File upload</span>
            </button>

            <button
              onClick={() => {
                setIsMethodModalOpen(false);
                setIsTextModalOpen(true);
              }}
              className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiFileText className="w-8 h-8 mb-3 text-rose-500" />
              <span className="text-gray-900 dark:text-white font-medium">Paste text</span>
            </button>
          </div>

          <button
            onClick={() => setIsMethodModalOpen(false)}
            className="mt-6 w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Skip
          </button>
        </Modal>

        {/* File Upload Modal */}
        <FileUploadModal 
          isOpen={isFileModalOpen}
          onClose={() => {
            setIsFileModalOpen(false);
            loadSummaries();
          }}
        />

        {/* Text Input Modal */}
        <TextInputModal 
          isOpen={isTextModalOpen}
          onClose={() => {
            setIsTextModalOpen(false);
            loadSummaries();
          }}
        />

        {/* Summary View Modal */}
        <Modal isOpen={showSummaryModal} onClose={() => setShowSummaryModal(false)}>
  {selectedSummary && (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {selectedSummary.originalFileName}
        </h3>
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Created: {formatDate(selectedSummary.createdAt)}
      </div>
      
      <InlineSummaryEditor
        initialContent={selectedSummary.summary || 'No summary available.'}
        summaryId={selectedSummary._id}
        onUpdate={(updatedContent) => {
          setSelectedSummary({ ...selectedSummary, summary: updatedContent });
        }}
      />
    </div>
  )}
</Modal>

        
      </div>
    </ProtectedRoute>
  );
}



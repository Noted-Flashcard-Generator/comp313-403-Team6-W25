// File: client/src/components/InlineSummaryEditor.jsx
'use client';
import dynamic from 'next/dynamic'; // ensures it will be rendered on client side (no SSR)
import { useState } from 'react';

import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal'; // Import the Modal component
import { updateSummary } from '@/services/api';

const ReactQuillNoSSR = dynamic(() => import('react-quill'), {
  ssr: false,
});

export default function InlineSummaryEditor({ initialContent, summaryId, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false); // Controls edit mode
  const [content, setContent] = useState(initialContent); // Holds editor content
  const [loading, setLoading] = useState(false); // Loading state for save button

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await updateSummary(summaryId, content);
      if (response.success) {
        if (onUpdate) onUpdate(content); // Notify parent component
        setIsEditing(false);
      } else {
        alert(response.message || 'Failed to update summary.');
      }
    } catch (err) {
      console.error('Error updating summary:', err);
      alert('An error occurred while updating the summary.');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setContent(initialContent); // Revert changes
    setIsEditing(false); // Close modal
  };

  return (
    <div className="space-y-4">
      {/* Render the summary content */}
      <div className="relative">
        <div
          className="cursor-pointer ql-editor ql-snow"
          style={{ minHeight: '100px', border: '1px solid #ccc', padding: '10px' }}
          onDoubleClick={() => setIsEditing(true)} // Open modal on double-click
          dangerouslySetInnerHTML={{ __html: content }}
        />
        <Button onClick={() => setIsEditing(true)} className="mt-2">
          Edit
        </Button>
      </div>

      {/* Modal for editing */}
      <Modal isOpen={isEditing} onClose={handleCancel} fullPage={true}>
        <div className="space-y-4">
          <ReactQuillNoSSR
            value={content}
            onChange={setContent}
            theme="snow" // "snow" theme provides a classic editor look
          />
          <div className="flex space-x-2">
            <Button onClick={handleSave} isLoading={loading}>
              Save
            </Button>
            <Button onClick={handleCancel} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

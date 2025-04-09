'use client';

export function Modal({ isOpen, onClose, children, fullPage = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className={`flex ${fullPage ? '' : 'min-h-screen items-center justify-center'} p-4`}>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        {/* Modal Content */}
        <div
          className={`relative bg-white dark:bg-gray-800 ${
            fullPage ? 'w-full h-full' : 'rounded-lg shadow-xl max-w-3xl w-full'
          } p-8`}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          >
            ✕
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
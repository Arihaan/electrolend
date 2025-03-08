"use client";

import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Background color based on toast type
  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-green-100 border-green-500 text-green-700';
      case 'error': return 'bg-red-100 border-red-500 text-red-700';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      default: return 'bg-blue-100 border-blue-500 text-blue-700';
    }
  };
  
  // Icon based on toast type
  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };
  
  // Close the toast after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  return (
    <div 
      className={`fixed bottom-4 right-4 p-4 rounded-md border-l-4 shadow-md transition-opacity duration-300 ${getBgColor()} ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ maxWidth: '90vw', zIndex: 1000 }}
    >
      <div className="flex items-start">
        <div className="mr-2 font-bold">{getIcon()}</div>
        <div className="flex-1 mr-2 text-sm">{message}</div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-sm font-semibold hover:text-opacity-75"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Toast Container to manage multiple toasts
interface ToastContainerProps {
  children?: React.ReactNode;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

// Context for toast management
interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = React.createContext<ToastContextType>({
  showToast: () => {}
});

export const useToast = () => React.useContext(ToastContext);

export const ToastProvider: React.FC<ToastContainerProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}; 
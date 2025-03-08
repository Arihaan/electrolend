'use client';

import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/solid';

export default function TestnetWarning() {
  const [isVisible, setIsVisible] = useState(true);

  // Check localStorage on component mount to see if the banner was dismissed
  useEffect(() => {
    const checkDismissalStatus = () => {
      const dismissedTime = localStorage.getItem('testnetWarningDismissed');
      
      if (dismissedTime) {
        const dismissedAt = parseInt(dismissedTime, 10);
        const currentTime = Date.now();
        
        // Show the warning again if it's been 24 hours since dismissal
        if (currentTime - dismissedAt > 24 * 60 * 60 * 1000) {
          localStorage.removeItem('testnetWarningDismissed');
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } else {
        setIsVisible(true);
      }
    };
    
    checkDismissalStatus();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('testnetWarningDismissed', Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-yellow-700 bg-opacity-90 text-white">
      <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex-1 flex items-center">
            <span className="flex p-1">
              <ExclamationTriangleIcon className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <p className="font-medium text-sm md:text-base ml-1">
              <span className="md:hidden">⚠️ TESTNET VERSION</span>
              <span className="hidden md:inline">
                <strong>TESTNET VERSION:</strong> This is a demonstration environment using test tokens. 
                It may contain bugs and is susceptible to breaking. Any testnet funds may be lost. 
              </span>
            </p>
          </div>
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              className="-mr-1 flex p-2 rounded-md hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
              onClick={handleDismiss}
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5 text-white" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
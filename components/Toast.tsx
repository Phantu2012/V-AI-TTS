import React, { useEffect, useState } from 'react';
import { ToastState } from '../types';

interface ToastProps {
  toast: ToastState;
}

const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


export const Toast: React.FC<ToastProps> = ({ toast }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast.message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 4800); // A bit less than the App's timeout to allow for fade-out
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast.message) return null;
  
  const isError = toast.type === 'error';
  const bgColor = isError ? 'bg-red-600' : 'bg-green-500';

  return (
    <div
      className={`fixed bottom-5 right-5 text-white px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 flex items-center space-x-4 ${bgColor} ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
        {isError ? <ErrorIcon /> : <SuccessIcon />}
        <span>{toast.message}</span>
    </div>
  );
};
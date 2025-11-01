// Import Node.js globals for browser compatibility with web3 libraries.
import './polyfills'; 

import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
// FIX: Added file extension to import to resolve module error.
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
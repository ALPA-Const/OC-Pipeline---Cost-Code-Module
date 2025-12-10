/**
 * Main Entry Point
 * Initializes React application
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ============================================================================
// RENDER APP
// ============================================================================

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// TODO: Add global error handler
// TODO: Add performance monitoring
// TODO: Add analytics tracking
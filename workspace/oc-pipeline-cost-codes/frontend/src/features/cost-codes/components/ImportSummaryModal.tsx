/**
 * Import Summary Modal Component
 * Displays the results of an import operation
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import React from 'react';
import { ImportSummary } from '../types/cost-code.types';

// ============================================================================
// PROPS
// ============================================================================

interface ImportSummaryModalProps {
  isOpen: boolean;
  summary: ImportSummary;
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ImportSummaryModal: React.FC<ImportSummaryModalProps> = ({ isOpen, summary, onClose }) => {
  if (!isOpen) return null;

  const successRate = summary.total_records > 0
    ? ((summary.successful_records / summary.total_records) * 100).toFixed(1)
    : 0;

  // TODO: Add detailed error list with expandable rows
  // TODO: Add option to download error report
  // TODO: Add option to retry failed imports
  // TODO: Show which specific records failed

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '100%',
      }}>
        <h2>Import Complete</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Total Records:</strong> {summary.total_records}
          </div>
          <div style={{ marginBottom: '10px', color: 'green' }}>
            <strong>Successful:</strong> {summary.successful_records}
          </div>
          <div style={{ marginBottom: '10px', color: 'red' }}>
            <strong>Failed:</strong> {summary.failed_records}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Success Rate:</strong> {successRate}%
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Duration:</strong> {(summary.duration_ms / 1000).toFixed(2)}s
          </div>
        </div>

        {summary.errors.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3>Errors</h3>
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #ddd',
              padding: '10px',
              backgroundColor: '#f9f9f9',
            }}>
              {summary.errors.map((error, index) => (
                <div key={index} style={{ marginBottom: '10px', fontSize: '14px' }}>
                  <strong>Row {error.row || 'N/A'}:</strong> {error.message}
                  {error.code && <div style={{ color: '#666' }}>Code: {error.code}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} style={{ width: '100%', padding: '10px' }}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ImportSummaryModal;
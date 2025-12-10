/**
 * Import CSV Modal Component
 * Modal for importing cost codes from CSV files
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import React, { useState } from 'react';
import { useImportCostCodes } from '../hooks/useImportCostCodes';
import { CSVColumnMapping } from '../types/cost-code.types';

// ============================================================================
// PROPS
// ============================================================================

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ isOpen, onClose, onComplete }) => {
  const { importFromCSV } = useImportCostCodes();
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<CSVColumnMapping>({
    code: 'code',
    title: 'title',
    description: 'description',
    level: 'level',
  });
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleMappingChange = (field: keyof CSVColumnMapping, value: string) => {
    setMapping(prev => ({ ...prev, [field]: value }));
  };

  const handleImport = async () => {
    if (!file) {
      alert('Please select a CSV file');
      return;
    }

    try {
      setImporting(true);
      // TODO: Convert file to base64 or FormData
      await importFromCSV({
        file: file as any, // Placeholder
        mapping,
        overwrite_existing: false,
      });
      onComplete();
    } catch (err) {
      alert('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  // TODO: Implement CSV file parsing and preview
  // TODO: Add column mapping interface with drag-and-drop
  // TODO: Add data validation preview
  // TODO: Show sample rows from CSV
  // TODO: Add progress indicator during import

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
        <h2>Import from CSV</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Select CSV File *
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={importing}
          />
          {file && <div style={{ marginTop: '5px', fontSize: '14px' }}>Selected: {file.name}</div>}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h3>Column Mapping</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Map your CSV columns to cost code fields
          </p>
          
          <div style={{ marginTop: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Code Column *</label>
            <input
              type="text"
              value={mapping.code}
              onChange={(e) => handleMappingChange('code', e.target.value)}
              style={{ width: '100%', padding: '8px' }}
              placeholder="Column name or index"
              disabled={importing}
            />
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Title Column *</label>
            <input
              type="text"
              value={mapping.title}
              onChange={(e) => handleMappingChange('title', e.target.value)}
              style={{ width: '100%', padding: '8px' }}
              placeholder="Column name or index"
              disabled={importing}
            />
          </div>

          {/* TODO: Add more mapping fields */}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            style={{ flex: 1, padding: '10px' }}
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
          <button
            onClick={onClose}
            disabled={importing}
            style={{ flex: 1, padding: '10px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportCSVModal;
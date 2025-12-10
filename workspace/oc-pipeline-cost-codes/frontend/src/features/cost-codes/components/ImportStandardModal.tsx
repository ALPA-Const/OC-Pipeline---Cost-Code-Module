/**
 * Import Standard Modal Component
 * Modal for importing cost codes from standard databases
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import React, { useState, useEffect } from 'react';
import { useImportCostCodes } from '../hooks/useImportCostCodes';

// ============================================================================
// PROPS
// ============================================================================

interface ImportStandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ImportStandardModal: React.FC<ImportStandardModalProps> = ({ isOpen, onClose, onComplete }) => {
  const { standardDatabases, loading, error, fetchStandardDatabases, importFromStandard } = useImportCostCodes();
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>('');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStandardDatabases();
    }
  }, [isOpen, fetchStandardDatabases]);

  const handleImport = async () => {
    if (!selectedDatabaseId) {
      alert('Please select a database');
      return;
    }

    try {
      setImporting(true);
      await importFromStandard({
        database_id: selectedDatabaseId,
        overwrite_existing: overwriteExisting,
      });
      onComplete();
    } catch (err) {
      alert('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  // TODO: Implement proper modal with backdrop
  // TODO: Add database preview/description
  // TODO: Add progress indicator during import
  // TODO: Show estimated import time

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
        maxWidth: '500px',
        width: '100%',
      }}>
        <h2>Import from Standard Database</h2>
        
        {error && (
          <div style={{ padding: '10px', backgroundColor: '#fee', marginBottom: '15px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div>Loading databases...</div>
        ) : (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Select Database *
              </label>
              <select
                value={selectedDatabaseId}
                onChange={(e) => setSelectedDatabaseId(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
                disabled={importing}
              >
                <option value="">-- Select a database --</option>
                {standardDatabases.map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.name} {db.version && `(${db.version})`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  style={{ marginRight: '8px' }}
                  disabled={importing}
                />
                Overwrite existing cost codes from this database
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleImport}
                disabled={!selectedDatabaseId || importing}
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
          </>
        )}
      </div>
    </div>
  );
};

export default ImportStandardModal;
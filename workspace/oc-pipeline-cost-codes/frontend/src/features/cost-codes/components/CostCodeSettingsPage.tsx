/**
 * Cost Code Settings Page
 * Main page component for cost code management
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import React, { useState } from 'react';
import { useCostCodes } from '../hooks/useCostCodes';
import { useImportCostCodes } from '../hooks/useImportCostCodes';
import CostCodeList from './CostCodeList';
import CostCodeForm from './CostCodeForm';
import ImportStandardModal from './ImportStandardModal';
import ImportCSVModal from './ImportCSVModal';
import ImportSummaryModal from './ImportSummaryModal';
import { CostCodeWithRelations, CreateCostCodeRequest, UpdateCostCodeRequest } from '../types/cost-code.types';

// ============================================================================
// COMPONENT
// ============================================================================

const CostCodeSettingsPage: React.FC = () => {
  // Hooks
  const costCodesHook = useCostCodes();
  const importHook = useImportCostCodes();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [editingCostCode, setEditingCostCode] = useState<CostCodeWithRelations | null>(null);
  const [showImportStandard, setShowImportStandard] = useState(false);
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [showImportSummary, setShowImportSummary] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreate = () => {
    setEditingCostCode(null);
    setShowForm(true);
  };

  const handleEdit = (costCode: CostCodeWithRelations) => {
    setEditingCostCode(costCode);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this cost code?')) {
      try {
        await costCodesHook.deleteCostCode(id);
        alert('Cost code deleted successfully');
      } catch (error) {
        alert('Failed to delete cost code');
      }
    }
  };

  const handleFormSubmit = async (data: CreateCostCodeRequest | UpdateCostCodeRequest) => {
    try {
      if (editingCostCode) {
        await costCodesHook.updateCostCode(editingCostCode.id, data as UpdateCostCodeRequest);
        alert('Cost code updated successfully');
      } else {
        await costCodesHook.createCostCode(data as CreateCostCodeRequest);
        alert('Cost code created successfully');
      }
      setShowForm(false);
      setEditingCostCode(null);
    } catch (error) {
      alert('Failed to save cost code');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCostCode(null);
  };

  const handleImportStandard = () => {
    setShowImportStandard(true);
  };

  const handleImportCSV = () => {
    setShowImportCSV(true);
  };

  const handleImportComplete = () => {
    setShowImportStandard(false);
    setShowImportCSV(false);
    setShowImportSummary(true);
    costCodesHook.refreshCostCodes();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="cost-code-settings-page" style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1>Cost Code Settings</h1>
        <p>Manage your organization's cost code structure</p>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={handleCreate}>+ New Cost Code</button>
        <button onClick={handleImportStandard}>Import from Standard</button>
        <button onClick={handleImportCSV}>Import from CSV</button>
        <button onClick={costCodesHook.refreshCostCodes}>Refresh</button>
      </div>

      {/* Error Display */}
      {costCodesHook.error && (
        <div style={{ padding: '10px', backgroundColor: '#fee', marginBottom: '20px' }}>
          Error: {costCodesHook.error}
          <button onClick={costCodesHook.clearError}>Dismiss</button>
        </div>
      )}

      {/* Loading Indicator */}
      {costCodesHook.loading && <div>Loading...</div>}

      {/* Cost Code List */}
      {!showForm && (
        <CostCodeList
          costCodes={costCodesHook.costCodes}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Cost Code Form */}
      {showForm && (
        <CostCodeForm
          costCode={editingCostCode}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      {/* Import Modals */}
      {showImportStandard && (
        <ImportStandardModal
          isOpen={showImportStandard}
          onClose={() => setShowImportStandard(false)}
          onComplete={handleImportComplete}
        />
      )}

      {showImportCSV && (
        <ImportCSVModal
          isOpen={showImportCSV}
          onClose={() => setShowImportCSV(false)}
          onComplete={handleImportComplete}
        />
      )}

      {showImportSummary && importHook.lastImportSummary && (
        <ImportSummaryModal
          isOpen={showImportSummary}
          summary={importHook.lastImportSummary}
          onClose={() => {
            setShowImportSummary(false);
            importHook.clearLastSummary();
          }}
        />
      )}

      {/* TODO: Add pagination controls */}
      {/* TODO: Add filtering and search */}
      {/* TODO: Add bulk operations */}
      {/* TODO: Add export functionality */}
    </div>
  );
};

export default CostCodeSettingsPage;
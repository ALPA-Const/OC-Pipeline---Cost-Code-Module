/**
 * Cost Code Form Component
 * Form for creating and editing cost codes
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import React, { useState, useEffect } from 'react';
import { CostCodeWithRelations, CreateCostCodeRequest, UpdateCostCodeRequest } from '../types/cost-code.types';

// ============================================================================
// PROPS
// ============================================================================

interface CostCodeFormProps {
  costCode?: CostCodeWithRelations | null;
  onSubmit: (data: CreateCostCodeRequest | UpdateCostCodeRequest) => void;
  onCancel: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CostCodeForm: React.FC<CostCodeFormProps> = ({ costCode, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    level: 1,
    is_active: true,
  });

  // Initialize form with existing cost code data
  useEffect(() => {
    if (costCode) {
      setFormData({
        code: costCode.code,
        title: costCode.title,
        description: costCode.description || '',
        level: costCode.level,
        is_active: costCode.is_active,
      });
    }
  }, [costCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // TODO: Add form validation
  // TODO: Add parent cost code selector (dropdown or autocomplete)
  // TODO: Add database selector
  // TODO: Add custom fields editor
  // TODO: Add real-time validation feedback

  return (
    <div className="cost-code-form" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>{costCode ? 'Edit Cost Code' : 'Create New Cost Code'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Code *
          </label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
            placeholder="e.g., 03-30-00"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
            placeholder="e.g., Cast-in-Place Concrete"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            style={{ width: '100%', padding: '8px' }}
            placeholder="Optional description..."
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Level
          </label>
          <select
            name="level"
            value={formData.level}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value={1}>Level 1 (Division)</option>
            <option value={2}>Level 2 (Section)</option>
            <option value={3}>Level 3 (Subsection)</option>
            <option value={4}>Level 4 (Detail)</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              style={{ marginRight: '8px' }}
            />
            Active
          </label>
        </div>

        {/* TODO: Add parent cost code selector */}
        {/* TODO: Add database selector */}
        {/* TODO: Add custom fields */}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" style={{ flex: 1, padding: '10px' }}>
            {costCode ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: '10px' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CostCodeForm;
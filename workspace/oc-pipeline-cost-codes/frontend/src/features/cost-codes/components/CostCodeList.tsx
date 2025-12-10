/**
 * Cost Code List Component
 * Displays a list of cost codes in table format
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import React from 'react';
import { CostCodeWithRelations } from '../types/cost-code.types';

// ============================================================================
// PROPS
// ============================================================================

interface CostCodeListProps {
  costCodes: CostCodeWithRelations[];
  onEdit: (costCode: CostCodeWithRelations) => void;
  onDelete: (id: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CostCodeList: React.FC<CostCodeListProps> = ({ costCodes, onEdit, onDelete }) => {
  // TODO: Implement sorting
  // TODO: Implement row selection
  // TODO: Implement expandable rows for hierarchical view
  // TODO: Add loading skeleton
  // TODO: Add empty state

  if (costCodes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>No cost codes found. Create your first cost code or import from a standard database.</p>
      </div>
    );
  }

  return (
    <div className="cost-code-list">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Code</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Title</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Level</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Database</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
            <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {costCodes.map((costCode) => (
            <tr key={costCode.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{costCode.code}</td>
              <td style={{ padding: '10px' }}>{costCode.title}</td>
              <td style={{ padding: '10px' }}>Level {costCode.level}</td>
              <td style={{ padding: '10px' }}>{costCode.database?.name || 'Custom'}</td>
              <td style={{ padding: '10px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: costCode.is_active ? '#d4edda' : '#f8d7da',
                  color: costCode.is_active ? '#155724' : '#721c24',
                }}>
                  {costCode.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ padding: '10px', textAlign: 'center' }}>
                <button
                  onClick={() => onEdit(costCode)}
                  style={{ marginRight: '5px' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(costCode.id)}
                  style={{ color: 'red' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TODO: Add pagination component */}
      {/* TODO: Add items per page selector */}
    </div>
  );
};

export default CostCodeList;
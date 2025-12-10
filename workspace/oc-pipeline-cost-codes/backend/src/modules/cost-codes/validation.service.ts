/**
 * Validation Service for Cost Codes
 * Handles validation logic for cost code operations
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { supabaseAdmin } from '../../config/supabase';
import {
  ValidateCostCodeRequest,
  ValidationResult,
  ValidationError,
  CreateCostCodeRequest,
  UpdateCostCodeRequest,
} from '../../../../shared/types/cost-code.types';

// ============================================================================
// VALIDATION SERVICE CLASS
// ============================================================================

export class ValidationService {
  /**
   * Validate cost code data
   */
  async validateCostCode(
    organizationId: string,
    data: ValidateCostCodeRequest
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Validate code format
    if (!this.isValidCodeFormat(data.code)) {
      errors.push({
        field: 'code',
        message: 'Invalid code format. Code must be alphanumeric and can contain hyphens or dots.',
        code: 'INVALID_CODE_FORMAT',
      });
    }

    // Check code uniqueness
    const isDuplicate = await this.checkCodeDuplicate(
      organizationId,
      data.code,
      data.exclude_id
    );
    if (isDuplicate) {
      errors.push({
        field: 'code',
        message: 'Cost code already exists in your organization',
        code: 'DUPLICATE_CODE',
      });
    }

    // Validate title
    if (!data.title || data.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (data.title && data.title.length > 500) {
      errors.push({
        field: 'title',
        message: 'Title must not exceed 500 characters',
        code: 'MAX_LENGTH_EXCEEDED',
      });
    }

    // Validate parent relationship
    if (data.parent_id) {
      const parentExists = await this.checkParentExists(organizationId, data.parent_id);
      if (!parentExists) {
        errors.push({
          field: 'parent_id',
          message: 'Parent cost code does not exist',
          code: 'INVALID_PARENT',
        });
      }
    }

    return {
      is_valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate create request
   */
  async validateCreateRequest(
    organizationId: string,
    data: CreateCostCodeRequest
  ): Promise<ValidationResult> {
    return this.validateCostCode(organizationId, {
      code: data.code,
      title: data.title,
      parent_id: data.parent_id,
    });
  }

  /**
   * Validate update request
   */
  async validateUpdateRequest(
    organizationId: string,
    costCodeId: string,
    data: UpdateCostCodeRequest
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Only validate fields that are being updated
    if (data.code) {
      const codeValidation = await this.validateCostCode(organizationId, {
        code: data.code,
        title: data.title || 'temp', // Title not being validated if not provided
        exclude_id: costCodeId,
      });
      errors.push(...codeValidation.errors.filter(e => e.field === 'code'));
    }

    if (data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        errors.push({
          field: 'title',
          message: 'Title cannot be empty',
          code: 'REQUIRED_FIELD',
        });
      }
      if (data.title && data.title.length > 500) {
        errors.push({
          field: 'title',
          message: 'Title must not exceed 500 characters',
          code: 'MAX_LENGTH_EXCEEDED',
        });
      }
    }

    if (data.parent_id) {
      const parentExists = await this.checkParentExists(organizationId, data.parent_id);
      if (!parentExists) {
        errors.push({
          field: 'parent_id',
          message: 'Parent cost code does not exist',
          code: 'INVALID_PARENT',
        });
      }

      // Check for circular reference
      const isCircular = await this.checkCircularReference(costCodeId, data.parent_id);
      if (isCircular) {
        errors.push({
          field: 'parent_id',
          message: 'Cannot create circular reference in cost code hierarchy',
          code: 'CIRCULAR_REFERENCE',
        });
      }
    }

    return {
      is_valid: errors.length === 0,
      errors,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check if code format is valid
   */
  private isValidCodeFormat(code: string): boolean {
    // Allow alphanumeric characters, hyphens, dots, and spaces
    const codeRegex = /^[A-Za-z0-9.\-\s]+$/;
    return codeRegex.test(code) && code.length > 0 && code.length <= 50;
  }

  /**
   * Check if code already exists for organization
   */
  private async checkCodeDuplicate(
    organizationId: string,
    code: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabaseAdmin
      .from('cost_codes')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('code', code);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error checking code duplicate:', error);
      return false;
    }

    return !!data;
  }

  /**
   * Check if parent cost code exists
   */
  private async checkParentExists(
    organizationId: string,
    parentId: string
  ): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('cost_codes')
      .select('id')
      .eq('id', parentId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  }

  /**
   * Check for circular reference in hierarchy
   */
  private async checkCircularReference(
    costCodeId: string,
    newParentId: string
  ): Promise<boolean> {
    // TODO: Implement recursive check for circular references
    // For now, just check if newParentId is the same as costCodeId
    if (costCodeId === newParentId) {
      return true;
    }

    // TODO: Check if newParentId is a descendant of costCodeId
    // This requires traversing the hierarchy tree

    return false;
  }

  /**
   * Validate CSV import data
   * TODO: Implement CSV validation logic
   */
  async validateCSVData(rows: any[]): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // TODO: Validate each row
    // - Check required fields
    // - Validate data types
    // - Check for duplicates within CSV
    // - Validate relationships

    return {
      is_valid: errors.length === 0,
      errors,
    };
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================
export const validationService = new ValidationService();
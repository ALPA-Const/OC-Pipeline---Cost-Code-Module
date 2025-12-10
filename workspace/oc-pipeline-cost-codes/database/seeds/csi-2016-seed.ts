/**
 * CSI 2016 MasterFormat Database Seed Script
 * Seeds the cost_code_standard_databases table with complete CSI 2016 codes
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// CSI 2016 MASTERFORMAT DATA
// ============================================================================

interface CostCodeData {
  database_name: string;
  tier: 'parent' | 'child';
  parent_code_number: string | null;
  code_number: string;
  code_name: string;
}

const CSI_2016_DATA: CostCodeData[] = [
  // DIVISION 00 - PROCUREMENT AND CONTRACTING REQUIREMENTS
  { database_name: 'csi_2016', tier: 'parent', parent_code_number: null, code_number: '00000', code_name: 'Procurement and Contracting Requirements' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '00000', code_number: '00 01 00', code_name: 'Solicitation' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '00000', code_number: '00 01 10', code_name: 'Project Information' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '00000', code_number: '00 01 15', code_name: 'List of Drawings' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '00000', code_number: '00 01 20', code_name: 'List of Specifications' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '00000', code_number: '00 11 00', code_name: 'Advertisements and Invitations' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '00000', code_number: '00 21 00', code_name: 'Instructions to Bidders' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '00000', code_number: '00 31 00', code_name: 'Available Project Information' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '00000', code_number: '00 41 00', code_name: 'Bid Forms' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '00000', code_number: '00 43 00', code_name: 'Proposal Forms' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '00000', code_number: '00 52 00', code_name: 'Agreement Forms' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '00000', code_number: '00 61 00', code_name: 'Bond Forms' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '00000', code_number: '00 72 00', code_name: 'General Conditions' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '00000', code_number: '00 73 00', code_name: 'Supplementary Conditions' },

  // DIVISION 01 - GENERAL REQUIREMENTS
  { database_name: 'csi_2016', tier: 'parent', parent_code_number: null, code_number: '01000', code_name: 'General Requirements' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 11 00', code_name: 'Summary of Work' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 14 00', code_name: 'Work Restrictions' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 18 00', code_name: 'Project Utility Sources' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 21 00', code_name: 'Allowances' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 22 00', code_name: 'Unit Prices' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 23 00', code_name: 'Alternates' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 25 00', code_name: 'Substitution Procedures' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 26 00', code_name: 'Contract Modification Procedures' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 29 00', code_name: 'Payment Procedures' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 31 00', code_name: 'Project Management and Coordination' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 32 00', code_name: 'Construction Progress Documentation' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 33 00', code_name: 'Submittal Procedures' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 35 00', code_name: 'Special Procedures' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 40 00', code_name: 'Quality Requirements' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 42 00', code_name: 'References' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 45 00', code_name: 'Quality Control' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 50 00', code_name: 'Temporary Facilities and Controls' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 51 00', code_name: 'Temporary Utilities' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 52 00', code_name: 'Construction Facilities' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 53 00', code_name: 'Temporary Construction' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 54 00', code_name: 'Construction Aids' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 55 00', code_name: 'Vehicular Access and Parking' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 56 00', code_name: 'Temporary Barriers and Enclosures' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 57 00', code_name: 'Temporary Controls' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 58 00', code_name: 'Project Identification' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 60 00', code_name: 'Product Requirements' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 61 00', code_name: 'Common Product Requirements' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 64 00', code_name: 'Owner-Furnished Products' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 65 00', code_name: 'Product Delivery Requirements' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 66 00', code_name: 'Product Storage and Handling Requirements' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 70 00', code_name: 'Execution and Closeout Requirements' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 71 00', code_name: 'Examination and Preparation' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 73 00', code_name: 'Execution' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 74 00', code_name: 'Cleaning and Waste Management' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 75 00', code_name: 'Starting and Adjusting' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 76 00', code_name: 'Protecting Installed Construction' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 77 00', code_name: 'Closeout Procedures' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 78 00', code_name: 'Closeout Submittals' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 79 00', code_name: 'Demonstration and Training' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 81 00', code_name: 'Facility Performance Requirements' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 91 00', code_name: 'Commissioning' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '01000', code_number: '01 93 00', code_name: 'Facility Maintenance' },

  // DIVISION 02 - EXISTING CONDITIONS
  { database_name: 'csi_2016', tier: 'parent', parent_code_number: null, code_number: '02000', code_name: 'Existing Conditions' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 21 00', code_name: 'Surveys' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 22 00', code_name: 'Existing Conditions Assessment' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 24 00', code_name: 'Environmental Assessment' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 25 00', code_name: 'Existing Material Assessment' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 26 00', code_name: 'Hazardous Material Assessment' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 30 00', code_name: 'Subsurface Investigation' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 32 00', code_name: 'Geotechnical Investigations' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 41 00', code_name: 'Demolition' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 42 00', code_name: 'Removal and Salvage of Construction Materials' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 43 00', code_name: 'Structure Moving' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 50 00', code_name: 'Site Remediation' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 51 00', code_name: 'Physical Decontamination' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 56 00', code_name: 'Site Containment' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 58 00', code_name: 'Snow and Ice Control' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 61 00', code_name: 'Removal and Disposal of Contaminated Soils' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 65 00', code_name: 'Underground Storage Tank Removal' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 66 00', code_name: 'Asbestos Remediation' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 82 00', code_name: 'Asbestos Remediation' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 83 00', code_name: 'Lead Remediation' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 84 00', code_name: 'Polychlorinated Biphenyl Remediation' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '02000', code_number: '02 85 00', code_name: 'Mold Remediation' },

  // DIVISION 03 - CONCRETE
  { database_name: 'csi_2016', tier: 'parent', parent_code_number: null, code_number: '03000', code_name: 'Concrete' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 01 00', code_name: 'Maintenance of Concrete' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 05 00', code_name: 'Common Work Results for Concrete' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 10 00', code_name: 'Concrete Forming and Accessories' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 11 00', code_name: 'Concrete Forming' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 15 00', code_name: 'Concrete Accessories' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 20 00', code_name: 'Concrete Reinforcing' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 21 00', code_name: 'Reinforcement Bars' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 22 00', code_name: 'Welded Wire Reinforcement' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 23 00', code_name: 'Stressing Tendons' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 24 00', code_name: 'Fibrous Reinforcing' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 30 00', code_name: 'Cast-in-Place Concrete' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 31 00', code_name: 'Structural Concrete' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 33 00', code_name: 'Architectural Concrete' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 34 00', code_name: 'Low Density Concrete' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 35 00', code_name: 'Concrete Finishing' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 37 00', code_name: 'Specialty Placed Concrete' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 38 00', code_name: 'Post-Tensioned Concrete' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 39 00', code_name: 'Concrete Curing' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 40 00', code_name: 'Precast Concrete' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 41 00', code_name: 'Precast Structural Concrete' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 45 00', code_name: 'Precast Architectural Concrete' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 47 00', code_name: 'Site-Cast Concrete' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 48 00', code_name: 'Precast Concrete Specialties' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 50 00', code_name: 'Cast Decks and Underlayment' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 51 00', code_name: 'Cast Roof Decks' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 52 00', code_name: 'Lightweight Concrete Roof Insulation' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 53 00', code_name: 'Concrete Topping' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 54 00', code_name: 'Cast Underlayment' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 60 00', code_name: 'Grouting' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 62 00', code_name: 'Non-Shrink Grouting' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 63 00', code_name: 'Epoxy Grouting' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 64 00', code_name: 'Injection Grouting' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 70 00', code_name: 'Mass Concrete' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 80 00', code_name: 'Concrete Cutting and Boring' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 81 00', code_name: 'Concrete Cutting' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '03000', code_number: '03 82 00', code_name: 'Concrete Boring' },

  // DIVISION 04 - MASONRY
  { database_name: 'csi_2016', tier: 'parent', parent_code_number: null, code_number: '04000', code_name: 'Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 01 00', code_name: 'Maintenance of Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 05 00', code_name: 'Common Work Results for Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 20 00', code_name: 'Unit Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 21 00', code_name: 'Clay Unit Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 22 00', code_name: 'Concrete Unit Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 23 00', code_name: 'Glass Unit Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 24 00', code_name: 'Adobe Unit Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 25 00', code_name: 'Unit Masonry Panels' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 27 00', code_name: 'Multiple-Wythe Unit Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 40 00', code_name: 'Stone Assemblies' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 41 00', code_name: 'Dry-Placed Stone' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 42 00', code_name: 'Exterior Stone Cladding' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 43 00', code_name: 'Stone Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 50 00', code_name: 'Refractory Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 51 00', code_name: 'Flue Liner Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 52 00', code_name: 'Combustion Chamber Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 54 00', code_name: 'Refractory Brick Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 57 00', code_name: 'Masonry Fireplaces' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 70 00', code_name: 'Manufactured Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 71 00', code_name: 'Manufactured Brick Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 72 00', code_name: 'Cast Stone Masonry' },
  { database_name: 'csi_2016', tier: 'child', parent_code_number: '04000', code_number: '04 73 00', code_name: 'Manufactured Stone Masonry' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Clear existing CSI 2016 data
 */
async function clearExistingData(): Promise<void> {
  console.log('🗑️  Clearing existing CSI 2016 data...');
  
  const { error } = await supabase
    .from('cost_code_standard_databases')
    .delete()
    .eq('database_name', 'csi_2016');

  if (error) {
    throw new Error(`Failed to clear existing data: ${error.message}`);
  }

  console.log('✅ Existing data cleared');
}

/**
 * Insert cost codes in batches
 */
async function insertCostCodes(codes: CostCodeData[]): Promise<void> {
  const chunks = chunkArray(codes, 100);
  
  console.log(`📦 Inserting ${codes.length} codes in ${chunks.length} batches...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    const { error } = await supabase
      .from('cost_code_standard_databases')
      .insert(chunk);

    if (error) {
      throw new Error(`Failed to insert batch ${i + 1}: ${error.message}`);
    }

    console.log(`  ✓ Batch ${i + 1}/${chunks.length} inserted (${chunk.length} codes)`);
  }
}

/**
 * Get statistics
 */
function getStatistics(codes: CostCodeData[]): { totalParents: number; totalChildren: number } {
  const parents = codes.filter(c => c.tier === 'parent');
  const children = codes.filter(c => c.tier === 'child');
  
  return {
    totalParents: parents.length,
    totalChildren: children.length,
  };
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedCSI2016(): Promise<{ totalParents: number; totalChildren: number }> {
  console.log('🌱 Starting CSI 2016 MasterFormat seed...\n');

  try {
    // Clear existing data
    await clearExistingData();

    // Separate parents and children
    const parents = CSI_2016_DATA.filter(c => c.tier === 'parent');
    const children = CSI_2016_DATA.filter(c => c.tier === 'child');

    // Insert parents first
    console.log('\n📋 Inserting parent codes...');
    await insertCostCodes(parents);

    // Insert children
    console.log('\n📋 Inserting child codes...');
    await insertCostCodes(children);

    // Get statistics
    const stats = getStatistics(CSI_2016_DATA);

    console.log('\n✅ Seed completed successfully!');
    console.log(`   Total parent codes: ${stats.totalParents}`);
    console.log(`   Total child codes: ${stats.totalChildren}`);
    console.log(`   Total codes: ${stats.totalParents + stats.totalChildren}\n`);

    return stats;
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  }
}

// ============================================================================
// RUN IF CALLED DIRECTLY
// ============================================================================

seedCSI2016()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
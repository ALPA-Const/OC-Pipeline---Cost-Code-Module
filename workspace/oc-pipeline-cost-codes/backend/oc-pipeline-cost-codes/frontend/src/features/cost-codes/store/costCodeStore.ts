/**
 * Cost Code Zustand Store
 * Author: OC Pipeline Team
 * Date: 2025-12-02
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CostCodeStore {
  // Setup Wizard State
  isSetupWizardOpen: boolean;
  hasCompletedSetup: boolean;

  // Selection State
  selectedCodes: Set<string>;

  // Actions
  openSetupWizard: () => void;
  closeSetupWizard: () => void;
  completeSetup: () => void;
  toggleCodeSelection: (codeId: string) => void;
  clearSelection: () => void;
}

export const useCostCodeStore = create<CostCodeStore>()(
  persist(
    (set) => ({
      // Initial State
      isSetupWizardOpen: false,
      hasCompletedSetup: false,
      selectedCodes: new Set<string>(),

      // Actions
      openSetupWizard: () => set({ isSetupWizardOpen: true }),
      
      closeSetupWizard: () => set({ isSetupWizardOpen: false }),
      
      completeSetup: () =>
        set({
          hasCompletedSetup: true,
          isSetupWizardOpen: false,
        }),
      
      toggleCodeSelection: (codeId: string) =>
        set((state) => {
          const newSelection = new Set(state.selectedCodes);
          if (newSelection.has(codeId)) {
            newSelection.delete(codeId);
          } else {
            newSelection.add(codeId);
          }
          return { selectedCodes: newSelection };
        }),
      
      clearSelection: () => set({ selectedCodes: new Set<string>() }),
    }),
    {
      name: 'cost-code-storage',
      partialize: (state) => ({
        hasCompletedSetup: state.hasCompletedSetup,
      }),
    }
  )
);

export default useCostCodeStore;
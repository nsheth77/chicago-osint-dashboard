import { create } from 'zustand';
import { Crime, SeverityLevel } from '@/types/crime';

interface CrimeStore {
  // Selected crime for detail view
  selectedCrime: Crime | null;
  setSelectedCrime: (crime: Crime | null) => void;

  // Severity filters (empty = show all)
  selectedSeverities: SeverityLevel[];
  toggleSeverity: (severity: SeverityLevel) => void;
  clearSeverityFilters: () => void;

  // Crime type filters (empty = show all)
  selectedTypes: string[];
  toggleType: (type: string) => void;
  clearTypeFilters: () => void;

  // Clear all filters
  clearAllFilters: () => void;
}

export const useCrimeStore = create<CrimeStore>((set) => ({
  selectedCrime: null,
  setSelectedCrime: (crime) => set({ selectedCrime: crime }),

  selectedSeverities: [],
  toggleSeverity: (severity) =>
    set((state) => ({
      selectedSeverities: state.selectedSeverities.includes(severity)
        ? state.selectedSeverities.filter((s) => s !== severity)
        : [...state.selectedSeverities, severity],
    })),
  clearSeverityFilters: () => set({ selectedSeverities: [] }),

  selectedTypes: [],
  toggleType: (type) =>
    set((state) => ({
      selectedTypes: state.selectedTypes.includes(type)
        ? state.selectedTypes.filter((t) => t !== type)
        : [...state.selectedTypes, type],
    })),
  clearTypeFilters: () => set({ selectedTypes: [] }),

  clearAllFilters: () =>
    set({
      selectedSeverities: [],
      selectedTypes: [],
    }),
}));

import {
  IVulnerabilityType,
  VulnerabilityFilters
} from "@/types/vulnerability";
import { create } from "zustand";

export interface ISubmittedProjectVulType {
  name: string;
  ecosystem: string;
  version: string;
  matchedVuls: Array<IVulnerabilityType>;
}

interface AppState {
  threatFilter: VulnerabilityFilters;
  submittedProjectVuls: Array<ISubmittedProjectVulType>;
  setThreatFilter: (filter: VulnerabilityFilters) => void;
  setSubmittedProjectVuls: (
    vuls: Array<{
      name: string;
      ecosystem: string;
      version: string;
      matchedVuls: Array<IVulnerabilityType>;
    }>
  ) => void;
}

export const useAppStore = create<AppState>((set) => ({
  threatFilter: {},
  submittedProjectVuls: [],
  setThreatFilter: (filter: VulnerabilityFilters) =>
    set(() => ({ threatFilter: filter })),
  setSubmittedProjectVuls: (vuls) => set(() => ({ submittedProjectVuls: vuls }))
}));

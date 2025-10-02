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
  selectedEcosystems: string[];
  submittedProjectVuls: Array<ISubmittedProjectVulType>;
  setThreatFilter: (filter: VulnerabilityFilters) => void;
  setSelectedEcosystems: (ecosystems: string[]) => void;
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
  selectedEcosystems: ["npm", "maven", "nuget"],
  submittedProjectVuls: [],
  setThreatFilter: (filter: VulnerabilityFilters) =>
    set(() => ({ threatFilter: filter })),
  setSelectedEcosystems: (ecosystems: string[]) =>
    set(() => ({ selectedEcosystems: ecosystems })),
  setSubmittedProjectVuls: (vuls) => set(() => ({ submittedProjectVuls: vuls }))
}));

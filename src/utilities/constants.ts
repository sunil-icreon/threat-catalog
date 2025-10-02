import { IRecord } from "@/types/vulnerability";

export const CACHE_EXPIRY = 1000 * 60 * 60 * 2;

export const STORAGE_KEYS = {
  VULNERABILITY_DATA: "vulList",
  LAST_ANALYZED_PROJECT: "lastAnalyzedProject",
  SELECTED_ECO: "selectedEcosystems"
};

export const SOURCE_NAME = {
  GHSA: "Github Security Advisory",
  OSV: "Open Source Vulnerabilities",
  Synk: "Synk"
};

export const ECOSYSTEM_NAME: IRecord = {
  npm: "NPM",
  maven: "Maven",
  nuget: "NuGet"
};

export const ECOSYSTEM_LIST = [
  {
    label: "NPM",
    value: "npm"
  },
  {
    label: "Maven",
    value: "maven"
  },
  {
    label: "Nuget",
    value: "nuget"
  }
];

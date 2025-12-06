export type PackageAnalysisStatus = "pending" | "processing" | "completed" | "error";

export interface PackageAnalysisInput {
  name: string;
  version: string;
  ecoSystem: string;
}

export interface VulnerabilityDetail {
  id: string;
  summary?: string;
  severity?: string;
  cveId?: string;
  publishedDate?: string;
  url?: string;
  databaseSpecific?: {
    severity?: string;
    [key: string]: any;
  };
}

export interface VulnerabilityCount {
  CRITICAL?: number;
  HIGH?: number;
  MODERATE?: number;
  LOW?: number;
  total: number;
}

export interface PackageAnalysisResult extends PackageAnalysisInput {
  latestVersion?: string;
  versionGap?: string;
  isSupported?: boolean;
  isDeprecated?: boolean;
  deprecationMessage?: string;
  hasVulnerability?: boolean;
  vulnerabilityMessage?: string;
  vulnerabilities?: VulnerabilityDetail[];
  vulnerabilityCount?: VulnerabilityCount;
  status: PackageAnalysisStatus;
  error?: string;
  processedAt?: string;
}


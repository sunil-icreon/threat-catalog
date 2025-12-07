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

export interface MaliciousScriptDetails {
  script: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  description: string;
  remediation: string;
}

export interface VersionMaliciousScripts {
  // For NPM: "preinstall" | "postinstall"
  // For NuGet: "install" | "uninstall"
  // For Maven: "build"
  [scriptType: string]: MaliciousScriptDetails;
}

export interface MaliciousScriptsByVersion {
  [version: string]: VersionMaliciousScripts;
}

export interface PackageAnalysisResult extends PackageAnalysisInput {
  latestVersion?: string;
  versionGap?: string;
  isSupported?: boolean;
  isDeprecated?: boolean;
  deprecationMessage?: string;
  isUnpublished?: boolean;
  isUnlisted?: boolean;
  isLegacy?: boolean;
  hasVulnerability?: boolean;
  vulnerabilityMessage?: string;
  vulnerabilities?: VulnerabilityDetail[];
  vulnerabilityCount?: VulnerabilityCount;
  hasMaliciousScripts?: boolean;
  maliciousScripts?: MaliciousScriptsByVersion;
  status: PackageAnalysisStatus;
  error?: string;
  processedAt?: string;
}


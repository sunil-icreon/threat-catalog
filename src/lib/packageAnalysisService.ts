import { IEcoSystemType } from "@/types/vulnerability";
import { PackageAnalysisInput, PackageAnalysisResult } from "@/types/packageAnalysis";
import semver from "semver";

export interface PackageRegistryInfo {
  latestVersion: string;
  versions?: string[];
  exists: boolean;
}

/**
 * Fetch latest version from NPM registry
 */
async function fetchNpmPackageInfo(
  packageName: string
): Promise<PackageRegistryInfo> {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        return { latestVersion: "", exists: false };
      }
      throw new Error(`NPM API error: ${response.status}`);
    }

    const data = await response.json();
    const latestVersion = data["dist-tags"]?.latest || "";
    const versions = data.versions ? Object.keys(data.versions) : [];

    return {
      latestVersion,
      versions,
      exists: true
    };
  } catch (error) {
    console.error(`Error fetching NPM package ${packageName}:`, error);
    return { latestVersion: "", exists: false };
  }
}

/**
 * Fetch latest version from NuGet registry
 */
async function fetchNuGetPackageInfo(
  packageName: string
): Promise<PackageRegistryInfo> {
  try {
    const response = await fetch(
      `https://api.nuget.org/v3-flatcontainer/${encodeURIComponent(packageName.toLowerCase())}/index.json`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { latestVersion: "", exists: false };
      }
      throw new Error(`NuGet API error: ${response.status}`);
    }

    const data = await response.json();
    const versions = data.versions || [];
    const latestVersion = versions.length > 0 ? versions[versions.length - 1] : "";

    return {
      latestVersion,
      versions,
      exists: true
    };
  } catch (error) {
    console.error(`Error fetching NuGet package ${packageName}:`, error);
    return { latestVersion: "", exists: false };
  }
}

/**
 * Fetch latest version from Maven Central
 * Maven packages use format: groupId:artifactId
 */
async function fetchMavenPackageInfo(
  packageName: string
): Promise<PackageRegistryInfo> {
  try {
    // Parse groupId and artifactId from package name (format: groupId:artifactId)
    const parts = packageName.split(":");
    if (parts.length !== 2) {
      return { latestVersion: "", exists: false };
    }

    const [groupId, artifactId] = parts;
    const query = `g:${encodeURIComponent(groupId)}+AND+a:${encodeURIComponent(artifactId)}`;
    
    const response = await fetch(
      `https://search.maven.org/solrsearch/select?q=${query}&rows=1&wt=json`
    );

    if (!response.ok) {
      return { latestVersion: "", exists: false };
    }

    const data = await response.json();
    const docs = data.response?.docs || [];
    
    if (docs.length === 0) {
      return { latestVersion: "", exists: false };
    }

    const latestVersion = docs[0].latestVersion || docs[0].v || "";

    return {
      latestVersion,
      exists: true
    };
  } catch (error) {
    console.error(`Error fetching Maven package ${packageName}:`, error);
    return { latestVersion: "", exists: false };
  }
}

/**
 * Fetch package info from appropriate registry based on ecosystem
 */
export async function fetchPackageInfo(
  packageName: string,
  ecosystem: string
): Promise<PackageRegistryInfo> {
  const ecoSystemLower = ecosystem.toLowerCase();

  switch (ecoSystemLower) {
    case "npm":
      return await fetchNpmPackageInfo(packageName);
    case "nuget":
      return await fetchNuGetPackageInfo(packageName);
    case "maven":
      return await fetchMavenPackageInfo(packageName);
    default:
      return { latestVersion: "", exists: false };
  }
}

/**
 * Calculate version gap between current and latest version
 * Only returns gap for major or minor differences, not patch
 */
export function calculateVersionGap(
  currentVersion: string,
  latestVersion: string,
  ecosystem: string
): string | null {
  if (!latestVersion || !currentVersion) {
    return null;
  }

  const ecoSystemLower = ecosystem.toLowerCase();

  // For NPM and NuGet, use semver
  if (ecoSystemLower === "npm" || ecoSystemLower === "nuget") {
    try {
      // Clean version strings (remove ^, ~, etc.)
      const cleanCurrent = currentVersion.replace(/^[\^~>=<]/, "");
      const cleanLatest = latestVersion.replace(/^[\^~>=<]/, "");

      if (!semver.valid(cleanCurrent) || !semver.valid(cleanLatest)) {
        return null;
      }

      if (semver.eq(cleanCurrent, cleanLatest)) {
        return "Up to date";
      }

      if (semver.gt(cleanLatest, cleanCurrent)) {
        const diff = semver.diff(cleanCurrent, cleanLatest);
        
        // Only return gap for major or minor, not patch
        if (diff === "major" || diff === "minor") {
          return diff.charAt(0).toUpperCase() + diff.slice(1); // Capitalize first letter
        }
        
        // For patch or other differences, return null (don't display)
        return null;
      }

      return "Up to date";
    } catch (error) {
      return null;
    }
  }

  // For Maven, simple string comparison
  if (ecoSystemLower === "maven") {
    if (currentVersion === latestVersion) {
      return "Up to date";
    }
    // For Maven, we can't easily determine major/minor, so return null
    return null;
  }

  return null;
}

/**
 * Check if a version is supported (exists in registry)
 * @param packageInfo - Already fetched package info (optional, will fetch if not provided)
 */
export async function checkVersionSupported(
  packageName: string,
  version: string,
  ecosystem: string,
  packageInfo?: PackageRegistryInfo
): Promise<boolean> {
  // Use provided package info or fetch if not available
  const info = packageInfo || await fetchPackageInfo(packageName, ecosystem);
  
  if (!info.exists) {
    return false;
  }

  const ecoSystemLower = ecosystem.toLowerCase();

  // For NPM and NuGet, check if version exists in versions array
  if ((ecoSystemLower === "npm" || ecoSystemLower === "nuget") && info.versions) {
    // Clean version string
    const cleanVersion = version.replace(/^[\^~>=<]/, "");
    return info.versions.includes(cleanVersion);
  }

  // For Maven, we can't easily check without additional API calls
  // Return true if package exists (assume version might exist)
  return info.exists;
}

/**
 * Check if a specific version is deprecated
 */
export async function checkVersionDeprecated(
  packageName: string,
  version: string,
  ecosystem: string
): Promise<{ isDeprecated: boolean; message?: string }> {
  const ecoSystemLower = ecosystem.toLowerCase();

  try {
    if (ecoSystemLower === "npm") {
      // Fetch full package data to check deprecation for specific version
      const response = await fetch(
        `https://registry.npmjs.org/${encodeURIComponent(packageName)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const cleanVersion = version.replace(/^[\^~>=<]/, "");
        const versionData = data.versions?.[cleanVersion];
        
        if (versionData?.deprecated) {
          return {
            isDeprecated: true,
            message: versionData.deprecated
          };
        }
      }
    }
    // For NuGet and Maven, deprecation checking is more complex
    // Return not deprecated for now
    return { isDeprecated: false };
  } catch (error) {
    console.error(`Error checking deprecation for ${packageName}@${version}:`, error);
    return { isDeprecated: false };
  }
}

/**
 * Check if a package version has vulnerabilities using OSV API
 */
export async function checkVersionVulnerabilities(
  packageName: string,
  version: string,
  ecosystem: string
): Promise<{ 
  hasVulnerability: boolean; 
  message?: string;
  vulnerabilities?: Array<{
    id: string;
    summary?: string;
    severity?: string;
    cveId?: string;
    publishedDate?: string;
    url?: string;
    databaseSpecific?: any;
  }>;
  vulnerabilityCount?: {
    CRITICAL?: number;
    HIGH?: number;
    MODERATE?: number;
    LOW?: number;
    total: number;
  };
}> {
  const ecoSystemLower = ecosystem.toLowerCase();
  
  // Map ecosystem to OSV ecosystem format
  const osvEcosystemMap: Record<string, string> = {
    npm: "npm",
    nuget: "NuGet",
    maven: "Maven"
  };

  const osvEcosystem = osvEcosystemMap[ecoSystemLower];
  if (!osvEcosystem) {
    return { hasVulnerability: false };
  }

  try {
    const cleanVersion = version.replace(/^[\^~>=<]/, "");
    
    const response = await fetch("https://api.osv.dev/v1/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: cleanVersion,
        package: {
          name: packageName,
          ecosystem: osvEcosystem
        }
      })
    });

    if (!response.ok) {
      return { hasVulnerability: false };
    }

    const data = await response.json();
    
    if (data.vulns && data.vulns.length > 0) {
      const vulnCount = data.vulns.length;
      const severityCounts: Record<string, number> = {};
      const vulnerabilityDetails: Array<{
        id: string;
        summary?: string;
        severity?: string;
        cveId?: string;
        publishedDate?: string;
        url?: string;
        databaseSpecific?: any;
      }> = [];
      
      data.vulns.forEach((vuln: any) => {
        const severity = vuln.database_specific?.severity || 
                        vuln.severity?.[0]?.type || 
                        "unknown";
        const severityUpper = severity.toUpperCase();
        severityCounts[severityUpper] = (severityCounts[severityUpper] || 0) + 1;
        
        const vulnId = vuln.id || "";
        const cveId = vuln.aliases?.find((alias: string) => alias.startsWith("CVE-")) || 
                     vuln.id?.startsWith("CVE-") ? vuln.id : undefined;
        
        // Generate URL based on vulnerability ID format
        let vulnUrl = "";
        if (vulnId.startsWith("GHSA-")) {
          // GitHub Security Advisory - link to GitHub advisories
          vulnUrl = `https://github.com/advisories/${vulnId}`;
        } else if (vulnId.startsWith("MAL-")) {
          // Malware advisories from OSV
          vulnUrl = `https://osv.dev/vulnerability/${vulnId}`;
        } else if (cveId) {
          // CVE vulnerabilities link to NVD
          vulnUrl = `https://nvd.nist.gov/vuln/detail/${cveId}`;
        } else {
          // Default to OSV format for all other vulnerabilities
          vulnUrl = `https://osv.dev/vulnerability/${vulnId}`;
        }
        
        // Extract vulnerability details
        vulnerabilityDetails.push({
          id: vulnId,
          summary: vuln.summary || vuln.details || "",
          severity: severityUpper,
          cveId: cveId,
          publishedDate: vuln.published || vuln.published_at,
          url: vulnUrl,
          databaseSpecific: vuln.database_specific
        });
      });

      const severityMessages = Object.entries(severityCounts)
        .map(([sev, count]) => `${count} ${sev}`)
        .join(", ");

      // Build vulnerability count object
      const vulnerabilityCount = {
        CRITICAL: severityCounts["CRITICAL"] || 0,
        HIGH: severityCounts["HIGH"] || 0,
        MODERATE: severityCounts["MODERATE"] || 0,
        LOW: severityCounts["LOW"] || 0,
        total: vulnCount
      };

      return {
        hasVulnerability: true,
        message: `${vulnCount} vulnerability${vulnCount !== 1 ? "ies" : ""} found (${severityMessages})`,
        vulnerabilities: vulnerabilityDetails,
        vulnerabilityCount
      };
    }

    return { hasVulnerability: false };
  } catch (error) {
    console.error(`Error checking vulnerabilities for ${packageName}@${version}:`, error);
    return { hasVulnerability: false };
  }
}

/**
 * Analyze a single package
 */
export async function analyzePackage(
  packageInput: PackageAnalysisInput
): Promise<PackageAnalysisResult> {
  const { name, version, ecoSystem } = packageInput;

  try {
    const packageInfo = await fetchPackageInfo(name, ecoSystem);
    
    if (!packageInfo.exists) {
      return {
        ...packageInput,
        status: "error",
        error: "Package not found in registry",
        isSupported: false
      };
    }

    const versionGap = calculateVersionGap(
      version,
      packageInfo.latestVersion,
      ecoSystem
    );

    // Pass already-fetched packageInfo to avoid duplicate API call
    const isSupported = await checkVersionSupported(name, version, ecoSystem, packageInfo);
    
    // Check for deprecation
    const deprecationInfo = await checkVersionDeprecated(name, version, ecoSystem);
    
    // Check for vulnerabilities
    const vulnerabilityInfo = await checkVersionVulnerabilities(name, version, ecoSystem);

    return {
      ...packageInput,
      latestVersion: packageInfo.latestVersion,
      versionGap: versionGap || undefined,
      isSupported,
      isDeprecated: deprecationInfo.isDeprecated,
      deprecationMessage: deprecationInfo.message,
      hasVulnerability: vulnerabilityInfo.hasVulnerability,
      vulnerabilityMessage: vulnerabilityInfo.message,
      vulnerabilities: vulnerabilityInfo.vulnerabilities,
      vulnerabilityCount: vulnerabilityInfo.vulnerabilityCount,
      status: "completed",
      processedAt: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      ...packageInput,
      status: "error",
      error: error?.message || "Failed to analyze package"
    };
  }
}


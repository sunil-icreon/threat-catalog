import { IEcoSystemType } from "@/types/vulnerability";
import { PackageAnalysisInput, PackageAnalysisResult, MaliciousScriptsByVersion } from "@/types/packageAnalysis";
import semver from "semver";

export interface PackageRegistryInfo {
  latestVersion: string;
  versions?: string[];
  exists: boolean;
  // For NPM packages, include the full package data to avoid redundant API calls
  npmPackageData?: any;
  // For NuGet packages, include the full package data
  nugetPackageData?: any;
  // For Maven packages, include the full package data
  mavenPackageData?: any;
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
      exists: true,
      npmPackageData: data // Store full package data to avoid redundant calls
    };
  } catch (error) {
    console.error(`Error fetching NPM package ${packageName}:`, error);
    return { latestVersion: "", exists: false };
  }
}

/**
 * Fetch latest version from NuGet registry with enhanced metadata
 * Uses Registration API for deprecation info and Catalog API for detailed metadata
 */
async function fetchNuGetPackageInfo(
  packageName: string
): Promise<PackageRegistryInfo> {
  try {
    const packageNameLower = packageName.toLowerCase();
    
    // Step 1: Get version list
    const indexResponse = await fetch(
      `https://api.nuget.org/v3-flatcontainer/${encodeURIComponent(packageNameLower)}/index.json`
    );

    if (!indexResponse.ok) {
      if (indexResponse.status === 404) {
        return { latestVersion: "", exists: false };
      }
      throw new Error(`NuGet API error: ${indexResponse.status}`);
    }

    const indexData = await indexResponse.json();
    const versions = indexData.versions || [];
    const latestVersion = versions.length > 0 ? versions[versions.length - 1] : "";

    let nugetPackageData: any = {
      versions: versions,
      versionMetadata: {}
    };

    // Step 2: Fetch registration data for deprecation info and detailed metadata
    if (latestVersion) {
      try {
        const registrationResponse = await fetch(
          `https://api.nuget.org/v3/registration5-semver1/${encodeURIComponent(packageNameLower)}/index.json`
        );
        
        if (registrationResponse.ok) {
          const registrationData = await registrationResponse.json();
          nugetPackageData.registration = registrationData;
          
          // Extract deprecation info and metadata for all versions
          if (registrationData.items) {
            for (const item of registrationData.items || []) {
              for (const item2 of item.items || []) {
                const version = item2.catalogEntry?.version;
                if (version) {
                  nugetPackageData.versionMetadata[version] = {
                    deprecated: item2.catalogEntry?.deprecated || false,
                    deprecationMessage: item2.catalogEntry?.deprecationMessage || null,
                    published: item2.catalogEntry?.published,
                    listed: item2.catalogEntry?.listed,
                    packageContent: item2.packageContent
                  };
                }
              }
            }
          }
        }
      } catch (e) {
        console.error(`Error fetching NuGet registration data:`, e);
      }

      // Step 3: Fetch .nuspec for latest version to check for script references
      try {
        const nuspecUrl = `https://api.nuget.org/v3-flatcontainer/${encodeURIComponent(packageNameLower)}/${latestVersion}/${encodeURIComponent(packageNameLower)}.nuspec`;
        const nuspecResponse = await fetch(nuspecUrl);
        if (nuspecResponse.ok) {
          const nuspecText = await nuspecResponse.text();
          nugetPackageData.nuspec = nuspecText;
          
          // Parse nuspec to check for files element that might reference scripts
          const filesMatch = nuspecText.match(/<files[^>]*>([\s\S]*?)<\/files>/i);
          if (filesMatch) {
            nugetPackageData.hasFilesElement = true;
            // Check if install.ps1 or uninstall.ps1 are referenced
            const hasInstallScript = /install\.ps1/i.test(filesMatch[1]);
            const hasUninstallScript = /uninstall\.ps1/i.test(filesMatch[1]);
            nugetPackageData.hasInstallScript = hasInstallScript;
            nugetPackageData.hasUninstallScript = hasUninstallScript;
          }
        }
      } catch (e) {
        // Nuspec fetch is optional
      }

      // Step 4: Try to fetch the actual .nupkg file to extract scripts (if package is small enough)
      // Note: This is a heavy operation, so we'll only do it if we detect script references
      if (nugetPackageData.hasInstallScript || nugetPackageData.hasUninstallScript) {
        try {
          // Fetch package content URL from registration
          const packageContentUrl = nugetPackageData.versionMetadata[latestVersion]?.packageContent;
          if (packageContentUrl) {
            // We can't easily extract from .nupkg in browser, but we can note it for server-side processing
            nugetPackageData.packageContentUrl = packageContentUrl;
          }
        } catch (e) {
          // Package download is optional
        }
      }
    }

    return {
      latestVersion,
      versions,
      exists: true,
      nugetPackageData
    };
  } catch (error) {
    console.error(`Error fetching NuGet package ${packageName}:`, error);
    return { latestVersion: "", exists: false };
  }
}

/**
 * Fetch latest version from Maven Central with enhanced metadata
 * Maven packages use format: groupId:artifactId
 * Uses API route to avoid CORS issues
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

    // Determine if we're on client or server
    const isServer = typeof window === "undefined";
    const baseUrl = isServer 
      ? process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      : "";

    // Use API route to proxy the request and avoid CORS
    const response = await fetch(
      `${baseUrl}/api/packages/maven?packageName=${encodeURIComponent(packageName)}`
    );

    if (!response.ok) {
      return { latestVersion: "", exists: false };
    }

    const data = await response.json();
    
    return {
      latestVersion: data.latestVersion || "",
      exists: data.exists || false,
      mavenPackageData: data.mavenPackageData
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
 * Check package status flags (deprecated, unpublished, unlisted, legacy)
 * Uses already-fetched package data to avoid redundant API calls
 */
export function checkPackageStatusFlags(
  version: string,
  ecosystem: string,
  npmPackageData?: any,
  nugetPackageData?: any,
  mavenPackageData?: any
): {
  isDeprecated: boolean;
  deprecationMessage?: string;
  isUnpublished: boolean;
  isUnlisted: boolean;
  isLegacy: boolean;
} {
  const ecoSystemLower = ecosystem.toLowerCase();
  const cleanVersion = version.replace(/^[\^~>=<]/, "");

  const result = {
    isDeprecated: false,
    deprecationMessage: undefined as string | undefined,
    isUnpublished: false,
    isUnlisted: false,
    isLegacy: false
  };

  try {
    if (ecoSystemLower === "npm" && npmPackageData) {
      const versionData = npmPackageData.versions?.[cleanVersion];
      
      if (versionData) {
        // Check if deprecated
        if (versionData.deprecated) {
          result.isDeprecated = true;
          result.deprecationMessage = versionData.deprecated;
        }
        
        // Check if unlisted (exists in versions but not in dist-tags)
        // NPM packages can be unlisted but still accessible via direct version access
        const isInDistTags = Object.values(npmPackageData["dist-tags"] || {}).includes(cleanVersion);
        const hasTimeEntry = npmPackageData.time?.[cleanVersion];
        
        // If version exists but is not in dist-tags, it's unlisted
        // (unlisted versions are not shown in npm search but can still be installed)
        if (!isInDistTags && hasTimeEntry) {
          result.isUnlisted = true;
        }
        
        // Check if unpublished (version exists in versions object but dist is missing or invalid)
        // Unpublished versions may still exist in the versions object but without valid dist
        if (!versionData.dist || !versionData.dist.tarball || !versionData.dist.shasum) {
          result.isUnpublished = true;
        }
        
        // Check if legacy (very old package, published more than 5 years ago)
        const publishTime = npmPackageData.time?.[cleanVersion];
        if (publishTime) {
          const publishDate = new Date(publishTime);
          const fiveYearsAgo = new Date();
          fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
          if (publishDate < fiveYearsAgo) {
            result.isLegacy = true;
          }
        }
      } else {
        // Version doesn't exist in versions object - might be unpublished
        result.isUnpublished = true;
      }
    }
    
    // Check NuGet status flags
    if (ecoSystemLower === "nuget" && nugetPackageData) {
      const versionMetadata = nugetPackageData.versionMetadata?.[cleanVersion];
      
      if (versionMetadata) {
        // Check if deprecated
        if (versionMetadata.deprecated) {
          result.isDeprecated = true;
          result.deprecationMessage = versionMetadata.deprecationMessage || "This version is deprecated";
        }
        
        // Check if listed (unlisted packages are not shown in search)
        if (versionMetadata.listed === false) {
          result.isUnlisted = true;
        }
        
        // Check if unpublished (no packageContent URL)
        if (!versionMetadata.packageContent) {
          result.isUnpublished = true;
        }
      } else {
        // Version metadata not found - might be unpublished
        result.isUnpublished = true;
      }
    }
    
    // Check Maven status flags
    if (ecoSystemLower === "maven" && mavenPackageData) {
      // Check if deprecated
      if (mavenPackageData.deprecated) {
        result.isDeprecated = true;
        result.deprecationMessage = mavenPackageData.deprecated;
      }
      
      // Maven doesn't have explicit unpublished/unlisted flags in the same way
      // But we can check if POM exists
      if (!mavenPackageData.pom) {
        result.isUnpublished = true;
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error checking package status flags for version ${version}:`, error);
    return result;
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
 * Detect malicious patterns in a script (for NPM/bash scripts)
 */
function detectMaliciousPatterns(script: string): {
  isMalicious: boolean;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  description: string;
  remediation: string;
} {
  if (!script || typeof script !== "string") {
    return {
      isMalicious: false,
      severity: "LOW",
      description: "",
      remediation: ""
    };
  }

  const scriptLower = script.toLowerCase();
  
  // Pattern 1: Suspicious curl/wget commands to external URLs (data exfiltration)
  const suspiciousUrlPattern = /(curl|wget)\s+.*(http|https):\/\/[^\s"']+/i;
  const oastPattern = /oast\.(me|pro|site|fun|live|tech|online|cloud|xyz|io|net|com|org)/i;
  const suspiciousDomainPattern = /(d4q5dnk209k95fbe8ing9cxceg46se7h8|pastebin|paste\.ee|hastebin|gist|raw\.githubusercontent)/i;
  
  // Check for system information collection combined with network requests
  const systemInfoPattern = /(\$\(whoami\)|\$\(hostname\)|\$PWD|\$\(date|\$\(uname|\$\(env|whoami|hostname|uname|env)/i;
  
  if (suspiciousUrlPattern.test(script)) {
    const hasOast = oastPattern.test(script);
    const hasSuspiciousDomain = suspiciousDomainPattern.test(script);
    const hasSystemInfo = systemInfoPattern.test(script);
    
    if (hasOast || hasSuspiciousDomain || hasSystemInfo) {
      return {
        isMalicious: true,
        severity: "CRITICAL",
        description: hasSystemInfo 
          ? "Script contains network requests (curl/wget) combined with system information collection (whoami, hostname, PWD, etc.). This is a clear indicator of data exfiltration attempting to send sensitive system information to external servers."
          : "Script contains suspicious network requests (curl/wget) to potentially malicious domains. This could be used for data exfiltration, command and control, or reconnaissance.",
        remediation: "Do not install this package. Report it to npm security team immediately. If already installed, assume your system information has been compromised. Review network logs, change passwords, and consider rotating credentials. Scan your system for malware."
      };
    }
  }

  // Pattern 2: Base64 encoded commands (common obfuscation technique)
  const base64Pattern = /echo\s+['"][A-Za-z0-9+\/]{50,}['"]\s*\|\s*base64\s*-d/i;
  if (base64Pattern.test(script)) {
    return {
      isMalicious: true,
      severity: "HIGH",
      description: "Script contains base64 encoded commands, which is a common obfuscation technique used to hide malicious code.",
      remediation: "Do not install this package. Decode the base64 content to inspect what commands are being executed. Report suspicious packages to npm security team."
    };
  }

  // Pattern 3: eval() or Function() constructor with dynamic code
  const evalPattern = /eval\s*\(|new\s+Function\s*\(|Function\s*\(/i;
  if (evalPattern.test(script)) {
    return {
      isMalicious: true,
      severity: "HIGH",
      description: "Script uses eval() or Function() constructor, which can execute arbitrary code. This is dangerous if combined with user input or external data.",
      remediation: "Review the script carefully. If the eval is used with external data or user input, this is a security risk. Consider using safer alternatives or avoiding this package."
    };
  }

  // Pattern 4: Suspicious file system operations
  const suspiciousFsPattern = /(rm\s+-rf|del\s+\/|format\s+[a-z]:|mkfs|dd\s+if=)/i;
  if (suspiciousFsPattern.test(script)) {
    return {
      isMalicious: true,
      severity: "CRITICAL",
      description: "Script contains potentially destructive file system operations that could delete or format data.",
      remediation: "Do not install this package. This could cause data loss. If already installed, immediately stop any running processes and review your system."
    };
  }

  // Pattern 5: Network requests with system information
  const systemInfoExfilPattern = /(whoami|hostname|uname|env|cat\s+\/etc\/passwd|cat\s+\/etc\/shadow).*curl|wget/i;
  if (systemInfoExfilPattern.test(script)) {
    return {
      isMalicious: true,
      severity: "CRITICAL",
      description: "Script collects system information (username, hostname, environment variables) and sends it to external servers. This is a clear sign of data exfiltration.",
      remediation: "Do not install this package. If already installed, assume your system information has been compromised. Change passwords, review access logs, and consider rotating credentials."
    };
  }

  // Pattern 6: Suspicious shell command execution
  const shellExecutionPattern = /(sh\s+-c|bash\s+-c|cmd\s+\/c).*(\$\(|`)/i;
  if (shellExecutionPattern.test(script) && script.length > 200) {
    return {
      isMalicious: true,
      severity: "MODERATE",
      description: "Script executes complex shell commands which could be used to run malicious code.",
      remediation: "Review the script content carefully. Ensure you understand what commands are being executed before installing."
    };
  }

  // Pattern 7: Download and execute patterns
  const downloadExecutePattern = /(curl|wget).*\|.*(sh|bash|node|python|perl)/i;
  if (downloadExecutePattern.test(script)) {
    return {
      isMalicious: true,
      severity: "HIGH",
      description: "Script downloads content from the internet and immediately executes it. This is a common attack vector for malware distribution.",
      remediation: "Do not install this package. This pattern is commonly used to download and execute malicious code. Report to npm security team."
    };
  }

  // Pattern 8: Executing arbitrary files or scripts
  // Check for simple file execution commands like "node index.js", "node file.js", etc.
  const simpleFileExecutionPattern = /(node\s+[^\s|&;]+\.(js|ts|mjs|cjs)|bash\s+[^\s|&;]+\.(sh|bash)|sh\s+[^\s|&;]+\.sh|python\s+[^\s|&;]+\.py|perl\s+[^\s|&;]+\.pl|ruby\s+[^\s|&;]+\.rb|php\s+[^\s|&;]+\.php)/i;
  
  // Check for execution of files without extensions (like "node index", "node server")
  const noExtFileExecutionPattern = /(node\s+[a-zA-Z0-9_-]+|bash\s+[a-zA-Z0-9_-]+|sh\s+[a-zA-Z0-9_-]+|python\s+[a-zA-Z0-9_-]+|perl\s+[a-zA-Z0-9_-]+|ruby\s+[a-zA-Z0-9_-]+|php\s+[a-zA-Z0-9_-]+)(?:\s|$|;|\||&)/i;
  
  if (simpleFileExecutionPattern.test(script) || noExtFileExecutionPattern.test(script)) {
    // Check if it's executing files from suspicious locations or with suspicious names
    const suspiciousFilePattern = /(\.\/|\.\.\/|tmp|temp|download|\.exe|\.bat|\.cmd|\.ps1|index\.js|server\.js|main\.js|app\.js|start\.js|run\.js|install\.js|setup\.js|init\.js|config\.js)/i;
    
    // Also check if the file being executed is in the package itself (which is normal) vs external
    const isLocalPackageFile = /(node_modules|\.\/node_modules|package\.json|\.\/package\.json)/i.test(script);
    
    if (suspiciousFilePattern.test(script) || (!isLocalPackageFile && (simpleFileExecutionPattern.test(script) || noExtFileExecutionPattern.test(script)))) {
      // Check if it's a common legitimate pattern (like running a build script)
      const legitimatePattern = /(npm\s+run|npm\s+start|npm\s+test|yarn\s+run|yarn\s+start|node\s+\.\/node_modules|node\s+node_modules)/i;
      
      if (!legitimatePattern.test(script)) {
        return {
          isMalicious: true,
          severity: "HIGH",
          description: "Script executes arbitrary files or scripts (e.g., 'node index.js', 'node file.js'). This could be used to run malicious code, especially if the files are from untrusted sources or suspicious locations.",
          remediation: "Review the script carefully. Ensure you understand what files are being executed and that they come from trusted sources. Check if the files exist in the package and review their contents. Do not install if the file paths are suspicious or if files are executed from external sources."
        };
      }
    }
  }

  // Pattern 9: Executing expressions or dynamic code execution
  const expressionPattern = /(eval\s*\(|new\s+Function\s*\(|Function\s*\(|setTimeout\s*\([^,]+,|setInterval\s*\([^,]+,|require\s*\([^)]*\)\s*\(|import\s*\([^)]*\))/i;
  if (expressionPattern.test(script)) {
    // Check if it's using user input or external data
    const withExternalData = /(process\.env|process\.argv|\$\{|`.*\$\{|require\(['"]fs['"]\)|require\(['"]child_process['"]\))/i;
    if (withExternalData.test(script)) {
      return {
        isMalicious: true,
        severity: "CRITICAL",
        description: "Script uses eval() or dynamic code execution with external data (environment variables, file system, child processes). This is extremely dangerous and can execute arbitrary code.",
        remediation: "Do not install this package. This is a critical security risk. Report to npm security team immediately."
      };
    }
    return {
      isMalicious: true,
      severity: "HIGH",
      description: "Script uses eval() or dynamic code execution. This can be dangerous if combined with user input or external data.",
      remediation: "Review the script carefully. If eval is used with external data or user input, this is a security risk. Consider using safer alternatives or avoiding this package."
    };
  }

  // Pattern 10: File system operations with user data
  const fsWithUserDataPattern = /(fs\.(writeFile|appendFile|createWriteStream|unlink|rmdir|mkdir).*process\.(env|argv)|fs\.(readFile|readdir).*eval|fs\.(readFile|readdir).*Function)/i;
  if (fsWithUserDataPattern.test(script)) {
    return {
      isMalicious: true,
      severity: "CRITICAL",
      description: "Script performs file system operations using user input or environment variables, which could be used to read, write, or delete arbitrary files.",
      remediation: "Do not install this package. This could lead to data loss or unauthorized file access. Report to npm security team immediately."
    };
  }

  // Pattern 11: Network operations with dynamic URLs
  const networkDynamicPattern = /(http\.(get|post|request)|https\.(get|post|request)|fetch\s*\(.*process\.(env|argv)|axios\..*process\.(env|argv)|request\s*\(.*process\.(env|argv))/i;
  if (networkDynamicPattern.test(script)) {
    return {
      isMalicious: true,
      severity: "HIGH",
      description: "Script makes network requests using dynamic URLs from environment variables or user input. This could be used for data exfiltration or command and control.",
      remediation: "Review the script carefully. Ensure network requests are to trusted endpoints. Do not install if URLs are constructed from untrusted sources."
    };
  }

  // Pattern 12: Child process execution with user input
  const childProcessPattern = /(child_process\.(exec|spawn|execFile|fork).*process\.(env|argv)|child_process\.(exec|spawn|execFile|fork).*`.*\$\{|require\(['"]child_process['"]\)\.(exec|spawn).*process)/i;
  if (childProcessPattern.test(script)) {
    return {
      isMalicious: true,
      severity: "CRITICAL",
      description: "Script executes child processes using user input or environment variables. This could execute arbitrary system commands.",
      remediation: "Do not install this package. This is a critical security risk that could allow arbitrary command execution. Report to npm security team immediately."
    };
  }

  // Pattern 13: Obfuscated or encoded code
  const obfuscationPattern = /(atob\s*\(|btoa\s*\(|Buffer\.from.*toString|String\.fromCharCode.*eval|unescape\s*\(.*eval|decodeURIComponent.*eval)/i;
  if (obfuscationPattern.test(script) && script.length > 100) {
    return {
      isMalicious: true,
      severity: "HIGH",
      description: "Script contains obfuscated or encoded code, which is often used to hide malicious behavior.",
      remediation: "Review the script carefully. Decode and inspect the obfuscated content. Do not install if the decoded content is suspicious."
    };
  }

  // Pattern 14: Suspicious command chaining
  const commandChainPattern = /(&&.*(rm|del|format|mkfs|dd)|;\s*(rm|del|format|mkfs|dd)|`.*\$\{.*\}.*`.*(rm|del|format|mkfs|dd))/i;
  if (commandChainPattern.test(script)) {
    return {
      isMalicious: true,
      severity: "CRITICAL",
      description: "Script chains commands that could lead to destructive operations. This is highly suspicious and dangerous.",
      remediation: "Do not install this package. This could cause data loss or system damage. Report to npm security team immediately."
    };
  }

  // Pattern 15: Accessing sensitive system information
  const nodeSystemInfoPattern = /(process\.(env|argv|pid|ppid|platform|arch)|os\.(hostname|userInfo|homedir|tmpdir)|require\(['"]os['"]\)\.(hostname|userInfo))/i;
  if (nodeSystemInfoPattern.test(script) && (suspiciousUrlPattern.test(script) || networkDynamicPattern.test(script))) {
    return {
      isMalicious: true,
      severity: "CRITICAL",
      description: "Script collects system information and sends it to external servers. This is a clear indicator of data exfiltration.",
      remediation: "Do not install this package. If already installed, assume your system information has been compromised. Change passwords, review access logs, and consider rotating credentials."
    };
  }

  return {
    isMalicious: false,
    severity: "LOW",
    description: "",
    remediation: ""
  };
}


/**
 * Check for malicious scripts in NPM package versions
 * Uses the already-fetched package data to avoid redundant API calls
 */
export function checkMaliciousScripts(
  givenVersion: string,
  latestVersion: string,
  ecosystem: string,
  npmPackageData?: any
): {
  hasMaliciousScripts: boolean;
  maliciousScripts: MaliciousScriptsByVersion;
} {
  const ecoSystemLower = ecosystem.toLowerCase();
  
  // Only check NPM packages
  if (ecoSystemLower !== "npm" || !npmPackageData) {
    return {
      hasMaliciousScripts: false,
      maliciousScripts: {}
    };
  }

  const maliciousScripts: MaliciousScriptsByVersion = {};
  const versionsToCheck: string[] = [];

  // Add given version
  const cleanGivenVersion = givenVersion.replace(/^[\^~>=<]/, "");
  versionsToCheck.push(cleanGivenVersion);

  // Add latest version if different
  if (latestVersion && latestVersion !== cleanGivenVersion) {
    versionsToCheck.push(latestVersion);
  }

  // Check each version using the already-fetched package data
  for (const version of versionsToCheck) {
    const versionData = npmPackageData.versions?.[version];
    
    if (!versionData) {
      continue;
    }

    const scripts = versionData.scripts || {};
    const versionScripts: { [scriptType: string]: any } = {};
    
    // Script types to check for malicious patterns
    const scriptTypesToCheck = ['preinstall', 'postinstall', 'preupdate'];
    
    for (const scriptType of scriptTypesToCheck) {
      if (scripts[scriptType]) {
        const analysis = detectMaliciousPatterns(scripts[scriptType]);
        if (analysis.isMalicious) {
          versionScripts[scriptType] = {
            script: scripts[scriptType],
            severity: analysis.severity,
            description: analysis.description,
            remediation: analysis.remediation
          };
        }
      }
    }

    // Only add version if it has malicious scripts
    if (Object.keys(versionScripts).length > 0) {
      maliciousScripts[version] = versionScripts;
    }
  }

  return {
    hasMaliciousScripts: Object.keys(maliciousScripts).length > 0,
    maliciousScripts
  };
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
    
    // Check for package status flags - use already-fetched package data
    const statusFlags = checkPackageStatusFlags(
      version, 
      ecoSystem, 
      packageInfo.npmPackageData,
      packageInfo.nugetPackageData,
      packageInfo.mavenPackageData
    );
    
    // Check for vulnerabilities
    const vulnerabilityInfo = await checkVersionVulnerabilities(name, version, ecoSystem);

    // Check for malicious scripts - use already-fetched package data (NPM only)
    const maliciousScriptInfo = checkMaliciousScripts(
      version,
      packageInfo.latestVersion,
      ecoSystem,
      packageInfo.npmPackageData
    );

    return {
      ...packageInput,
      latestVersion: packageInfo.latestVersion,
      versionGap: versionGap || undefined,
      isSupported,
      isDeprecated: statusFlags.isDeprecated,
      deprecationMessage: statusFlags.deprecationMessage,
      isUnpublished: statusFlags.isUnpublished,
      isUnlisted: statusFlags.isUnlisted,
      isLegacy: statusFlags.isLegacy,
      hasVulnerability: vulnerabilityInfo.hasVulnerability,
      vulnerabilityMessage: vulnerabilityInfo.message,
      vulnerabilities: vulnerabilityInfo.vulnerabilities,
      vulnerabilityCount: vulnerabilityInfo.vulnerabilityCount,
      hasMaliciousScripts: maliciousScriptInfo.hasMaliciousScripts,
      maliciousScripts: maliciousScriptInfo.hasMaliciousScripts
        ? maliciousScriptInfo.maliciousScripts
        : undefined,
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


import {
  IEcoSystemType,
  IRecord,
  IStatType,
  IVulnerabilityType,
  SeverityStats
} from "@/types/vulnerability";
import { CACHE_EXPIRY, ECOSYSTEM_LIST } from "./constants";

const keyPrefix = "tc_";
export const parseFirestoreDocument = (doc: any): any => {
  const result: any = {};
  const fields = doc.fields || {};

  for (const [key, value] of Object.entries(fields)) {
    result[key] = parseValue(value);
  }

  return result;
};

const parseValue = (value: any): any => {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return new Date(value.timestampValue);
  if ("arrayValue" in value)
    return (value.arrayValue.values || []).map(parseValue);
  if ("mapValue" in value) return parseFirestoreDocument(value.mapValue);

  return null;
};

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { arrayValue: { values: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } }
  | { nullValue: null };

type FirestoreDocument = {
  fields: Record<string, FirestoreValue>;
};

export const toFirestoreFields = (
  obj: Record<string, any>
): FirestoreDocument => {
  function convertValue(value: any): FirestoreValue {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === "string") return { stringValue: value };
    if (typeof value === "boolean") return { booleanValue: value };
    if (typeof value === "number") {
      // Firestore expects integerValue as string, doubleValue as number
      return Number.isInteger(value)
        ? { integerValue: value.toString() }
        : { doubleValue: value };
    }
    if (Array.isArray(value)) {
      return {
        arrayValue: { values: value.map((v) => convertValue(v)) }
      };
    }
    if (typeof value === "object") {
      return {
        mapValue: { fields: toFirestoreFields(value).fields }
      };
    }
    throw new Error(`Unsupported type: ${typeof value}`);
  }

  const fields: Record<string, FirestoreValue> = {};
  for (const [key, val] of Object.entries(obj)) {
    fields[key] = convertValue(val);
  }

  return { fields };
};

export const formatRelativeTime = (
  dateInput?: string,
  showMinutes?: boolean
) => {
  if (!dateInput) {
    return "";
  }

  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return `Just now`;
  if (diffMin < 60) return `${diffMin} minutes ago`;

  if (showMinutes) {
    // Calculate remaining minutes after hours
    const remainingMinutes = diffMin % 60;

    if (diffHours < 12) {
      // Show hours and minutes when less than 12 hours
      if (remainingMinutes > 0) {
        return `${diffHours} hr${
          diffHours !== 1 ? "s" : ""
        } ${remainingMinutes} min${remainingMinutes !== 1 ? "s" : ""} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    }
  } else {
    if (diffHours < 24) return `${diffHours} hours ago`;
  }

  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  // Fallback to date string
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

interface CacheItem<T> {
  value: T;
  expiry: number | null; // timestamp in ms, or null = never expires
}

export const cacheManager = {
  isStringyfied: (txt: string) => {
    try {
      JSON.parse(txt);
      return true;
    } catch (e) {
      return false;
    }
  },
  getItem: <T = string>(key: string, defaultValue?: T): T | null => {
    if (typeof window === "undefined") {
      return defaultValue || null;
    }

    key = `${keyPrefix}${key}`;
    const raw = window.localStorage.getItem(key);

    if (!raw) return defaultValue ?? null;

    try {
      const parsed: CacheItem<T> = JSON.parse(raw);

      if (parsed.expiry && Date.now() > parsed.expiry) {
        // expired → remove + return default
        window.localStorage.removeItem(key);
        return defaultValue ?? null;
      }

      return parsed.value;
    } catch (e) {
      // fallback if old format exists
      return (raw as unknown as T) || defaultValue || null;
    }
  },
  setItem: <T = string>(
    key: string,
    value: T,
    ttlMs: number = CACHE_EXPIRY
  ): void => {
    // Default expiry is 2hrs
    let expiry = null;

    if (ttlMs !== 0) {
      expiry = Date.now() + ttlMs;
    }

    // const expiry =
    //   ttlMs ? Date.now() + (ttlMs || CACHE_EXPIRY) : null;
    const data: CacheItem<T> = { value, expiry };
    window.localStorage.setItem(`${keyPrefix}${key}`, JSON.stringify(data));
  },
  removeItem: (key: string) => {
    window.localStorage.removeItem(`${keyPrefix}${key}`);
  },
  clear: () => {
    window.localStorage.clear();
  }
};

export const generateRandomID = () => {
  const min = 100000;
  const max = 999999;
  return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
};

export type EPSSRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface EPSSData {
  percentage: number; // e.g., 0.00079
  percentile: number; // e.g., 0.24451
}

export function getEPSSRisk(data: EPSSData): {
  risk: EPSSRisk;
  score: number;
  percentile: number;
} {
  const { percentage, percentile } = data;

  // Convert percentage (0.00079) to probability in %
  const probability = percentage * 100;

  let risk: EPSSRisk;

  if (probability >= 10 || percentile >= 0.9) {
    risk = "CRITICAL";
  } else if (probability >= 1 || percentile >= 0.75) {
    risk = "HIGH";
  } else if (probability >= 0.1 || percentile >= 0.5) {
    risk = "MEDIUM";
  } else {
    risk = "LOW";
  }

  return {
    risk,
    score: parseFloat(probability.toFixed(2)), // 0.079% → 0.0790
    percentile: parseFloat(percentile.toFixed(2)) // 0.2445
  };
}

export const sortedObjectByKey = (
  obj: IRecord,
  order: "ASC" | "DESC" = "ASC"
) => {
  const sortedKeys =
    order === "ASC"
      ? Object.keys(obj).sort()
      : Object.keys(obj).sort((a, b) => b.localeCompare(a));
  return sortedKeys.reduce((acc, key) => {
    acc[key] = obj[key as keyof typeof obj];
    return acc;
  }, {} as Record<string, number>);
};

// Calculate stats from vulnerabilities array
export const calculateStatsFromVulnerabilities = (
  vulnerabilities: IVulnerabilityType[],
  statData: IStatType
) => {
  const ecosystemStats: Record<string, number> = {};
  const durationStats: Record<string, IRecord> = {};
  const severityStats: SeverityStats = {
    CRITICAL: { total: 0 },
    HIGH: { total: 0 },
    MEDIUM: { total: 0 },
    LOW: { total: 0 }
  };

  // Initialize ecosystem stats
  ECOSYSTEM_LIST.forEach((eco) => {
    ecosystemStats[eco.value] = 0;
    durationStats[eco.value] = {
      fetchedAt: statData.lastRefresh,
      duration: 7 // Default to 7 days
    };
  });

  // Count vulnerabilities by ecosystem and severity
  vulnerabilities.forEach((vul) => {
    // Count by ecosystem
    if (ecosystemStats.hasOwnProperty(vul.ecosystem)) {
      ecosystemStats[vul.ecosystem]++;
    }

    // Count by severity
    if (severityStats[vul.severity]) {
      severityStats[vul.severity].total++;
      if (!severityStats[vul.severity][vul.ecosystem]) {
        severityStats[vul.severity][vul.ecosystem] = 0;
      }
      severityStats[vul.severity][vul.ecosystem]++;
    }
  });

  return {
    ecosystemStats,
    durationStats,
    severityStats,
    totalVulnerabilities: vulnerabilities.length,
    lastRefresh: statData.lastRefresh
  };
};

export const getPackageURL = (
  ecoSystem: IEcoSystemType,
  packageName: string,
  version?: string
) => {
  let packageURL = "";
  switch (ecoSystem.toLocaleLowerCase()) {
    case "npm":
      packageURL = `https://www.npmjs.com/package/${packageName}`;
      if (version) {
        return `${packageURL}/v/${version}`;
      }
      return packageURL;

    case "maven":
      packageURL = `https://mvnrepository.com/artifact/${packageName.replace(
        ":",
        "/"
      )}`;

      if (version) {
        return `${packageURL}/${version}`;
      }

      return packageURL;

    case "nuget":
      packageURL = `https://www.nuget.org/packages/${packageName}`;
      if (version) {
        return `${packageURL}/${version}`;
      }

      return packageURL;
  }
};

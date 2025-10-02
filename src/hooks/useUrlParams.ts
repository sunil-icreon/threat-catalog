import { VulnerabilityFilters } from "@/types/vulnerability";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export const useUrlParams = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current filters from URL
  const getFiltersFromUrl = useCallback((): VulnerabilityFilters => {
    const filters: VulnerabilityFilters = {};

    const ecosystem = searchParams.get("ecosystem");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const ecosystems = searchParams.get("ecosystems");

    if (ecosystem) filters.ecosystem = ecosystem;
    if (severity) filters.severity = severity;
    if (status) filters.status = status;
    if (search) filters.search = search;

    return filters;
  }, [searchParams]);

  // Get selected ecosystems from URL
  const getSelectedEcosystemsFromUrl = useCallback((): string[] => {
    const ecosystems = searchParams.get("ecosystems");
    if (ecosystems) {
      return ecosystems.split(",").filter(Boolean);
    }
    return ["npm", "maven", "nuget"]; // Default to all ecosystems
  }, [searchParams]);

  // Update URL with new filters
  const updateUrl = useCallback(
    (filters: VulnerabilityFilters, selectedEcosystems: string[]) => {
      const params = new URLSearchParams();

      // Add filter parameters
      if (filters.ecosystem) params.set("ecosystem", filters.ecosystem);
      if (filters.severity) params.set("severity", filters.severity);
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);

      // Add selected ecosystems
      if (selectedEcosystems.length > 0 && selectedEcosystems.length < 3) {
        params.set("ecosystems", selectedEcosystems.join(","));
      }

      const newUrl = params.toString() ? `?${params.toString()}` : "";
      router.replace(newUrl, { scroll: false });
    },
    [router]
  );

  // Initialize from URL on mount
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  return {
    getFiltersFromUrl,
    getSelectedEcosystemsFromUrl,
    updateUrl,
    isInitialized
  };
};

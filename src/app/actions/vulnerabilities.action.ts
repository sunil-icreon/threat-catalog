"use server";

import { VulnerabilityService } from "@/lib/vulnerabilityService";
import { revalidateTag } from "next/cache";
let cacheStore: any = null;
export async function actionGetVulnerabilitiesData() {
  const vulnerabilityService = VulnerabilityService.getInstance();

  if (vulnerabilityService.shouldReturnFromCache) {
    console.log("Returned from Cache");
    return vulnerabilityService.getResponseObject(
      vulnerabilityService.cache,
      vulnerabilityService.statCache
    );
  }

  console.log("Returned from DB");
  return await vulnerabilityService.updateVulnerabilities();
}

export async function actionFetchLatest(config: {
  duration: string;
  ecosystem: string;
  apiKey: string;
}) {
  const { duration = "week", ecosystem = "npm", apiKey } = config;

  if (!apiKey || apiKey !== process.env.NEXT_PUBLIC_VUL_API_KEY) {
    console.log("fetchLatest returned with 403");
    return { errorMsg: "Unauthorized. API key is required", status: 403 };
  }

  const vulnerabilityService = VulnerabilityService.getInstance();
  const result = await vulnerabilityService.getLatestVulnerabilities(
    duration,
    ecosystem,
    apiKey
  );

  return result;
}

export async function actionPurgeCache() {
  const vulnerabilityService = VulnerabilityService.getInstance();
  vulnerabilityService.shouldReturnFromCache = false;
}

export async function clearVulnerabilityActionData() {
  revalidateTag("advisories");
}

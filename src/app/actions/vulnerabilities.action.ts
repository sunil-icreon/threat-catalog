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

export async function getVulnerabilitiesDataFromServer() {
  if (cacheStore) {
    console.log("Returned from Cache");
    return cacheStore;
  }

  const vulnerabilityService = VulnerabilityService.getInstance();
  console.log("Returned from Server");
  const result = await vulnerabilityService.updateVulnerabilities();
  cacheStore = result;
  return result;
}

export async function clearVulnerabilityActionData() {
  revalidateTag("advisories");
}

"use server";

import { VulnerabilityService } from "@/lib/vulnerabilityService";
import { revalidateTag } from "next/cache";
let cacheStore: any = null;
export async function getVulnerabilitiesDataFromServer() {
  // const response = await fetch(
  //   `${process.env.NEXT_PUBLIC_VERCEL_API_URL}/api/vulnerabilities`,
  //   {
  //     next: {
  //       tags: ["advisories"],
  //       revalidate: 300
  //     }
  //   }
  // );

  // if (!response.ok) {
  //   throw new Error("Failed to fetch advisories");
  // }

  // return response.json();

  if (cacheStore) {
    console.log("Returned from Cache");
    return cacheStore;
  } // return cached value

  const vulnerabilityService = VulnerabilityService.getInstance();
  console.log("Returned from Server");
  const result = await vulnerabilityService.updateVulnerabilities();
  cacheStore = result;
  return result;
}

export async function clearVulnerabilityActionData() {
  revalidateTag("advisories");
}

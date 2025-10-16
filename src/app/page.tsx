import { DashboardContent } from "@/components/DashboardContent";
import { Suspense } from "react";
import { getVulnerabilitiesDataFromServer } from "./actions/vulnerabilities.action";

export default async function Dashboard() {
  const vulnerabilities = await getVulnerabilitiesDataFromServer();

  console.log("Page data refreshed");

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent vulnerabilityList={vulnerabilities} />
    </Suspense>
  );
}

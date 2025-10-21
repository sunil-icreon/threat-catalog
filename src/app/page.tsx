import { DashboardContent } from "@/components/DashboardContent";
import { Suspense } from "react";
import { actionGetVulnerabilitiesData } from "./actions/vulnerabilities.action";

export default async function Dashboard() {
  const vulnerabilities = await actionGetVulnerabilitiesData();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent vulnerabilityList={vulnerabilities} />
    </Suspense>
  );
}

import { DashboardContent } from "@/components/DashboardContent";
import { Suspense } from "react";
import { actionGetVulnerabilitiesData } from "./actions/vulnerabilities.action";
import { PageSkeleton } from "@/components/LoadingSkeleton";

export default async function Dashboard() {
  const vulnerabilities = await actionGetVulnerabilitiesData();

  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardContent
        vulnerabilityList={vulnerabilities}
        resultKey={vulnerabilities.resultKey}
      />
    </Suspense>
  );
}

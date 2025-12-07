"use client";
import { PackageAnalysisResult } from "@/types/packageAnalysis";
import PackageAnalysisTable from "./analyze/PackageAnalysisTable";
import PackageAnalysisCards from "./analyze/PackageAnalysisCards";

interface PackageAnalysisGridProps {
  packages: PackageAnalysisResult[];
}

export default function PackageAnalysisGrid({
  packages
}: PackageAnalysisGridProps) {
  return (
    <>
      {/* Table view for tablet/desktop (md and up) */}
      <div className="d-none d-md-block">
        <PackageAnalysisTable packages={packages} />
      </div>

      {/* Card view for mobile (sm and below) */}
      <div className="d-md-none">
        <PackageAnalysisCards packages={packages} />
      </div>
    </>
  );
}


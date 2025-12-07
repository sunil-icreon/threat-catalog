import { Badge, Spinner } from "react-bootstrap";
import { PackageAnalysisResult } from "@/types/packageAnalysis";

export function getStatusBadge(status: PackageAnalysisResult["status"]) {
  switch (status) {
    case "pending":
      return <Badge bg="secondary">Pending</Badge>;
    case "processing":
      return (
        <Badge bg="warning">
          <Spinner size="sm" className="me-1" />
          Processing
        </Badge>
      );
    case "completed":
      return <Badge bg="success">Completed</Badge>;
    case "error":
      return <Badge bg="danger">Error</Badge>;
    default:
      return <Badge bg="secondary">Unknown</Badge>;
  }
}

export function getVersionGapBadge(versionGap?: string) {
  if (!versionGap) return <span className="text-muted">-</span>;

  if (versionGap === "Up to date") {
    return <Badge bg="success">{versionGap}</Badge>;
  }
  if (versionGap === "Major") {
    return <Badge bg="danger">Major</Badge>;
  }
  if (versionGap === "Minor") {
    return <Badge bg="warning">Minor</Badge>;
  }
  return <Badge bg="info">{versionGap}</Badge>;
}

export function getSupportedBadge(isSupported?: boolean) {
  if (isSupported === undefined) return <span className="text-muted">-</span>;
  return isSupported ? (
    <Badge bg="success">Supported</Badge>
  ) : (
    <Badge bg="danger">Not Supported</Badge>
  );
}

export function getSeverityBadge(severity?: string) {
  if (!severity) return null;
  
  return (
    <Badge
      bg={
        severity === "CRITICAL" || severity === "HIGH"
          ? "danger"
          : severity === "MODERATE"
          ? "warning"
          : severity === "LOW"
          ? "info"
          : "secondary"
      }
      className="me-2"
    >
      {severity}
    </Badge>
  );
}


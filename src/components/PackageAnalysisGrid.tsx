"use client";
import { PackageAnalysisResult, VulnerabilityDetail } from "@/types/packageAnalysis";
import { ECOSYSTEM_NAME } from "@/utilities/constants";
import { Badge, Card, Spinner, Table } from "react-bootstrap";

interface PackageAnalysisGridProps {
  packages: PackageAnalysisResult[];
}

export default function PackageAnalysisGrid({
  packages
}: PackageAnalysisGridProps) {
  const getStatusBadge = (status: PackageAnalysisResult["status"]) => {
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
  };

  const getVersionGapBadge = (versionGap?: string) => {
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
  };

  const getSupportedBadge = (isSupported?: boolean) => {
    if (isSupported === undefined) return <span className="text-muted">-</span>;
    return isSupported ? (
      <Badge bg="success">Supported</Badge>
    ) : (
      <Badge bg="danger">Not Supported</Badge>
    );
  };

  if (packages.length === 0) {
    return (
      <Card>
        <Card.Body className="text-center text-muted">
          No packages to display. Paste a comma-separated list in the textarea above.
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Body className="p-0">
        <Table responsive striped hover className="mb-0">
          <thead className="table-light">
            <tr>
              <th>Package Name</th>
              <th>Ecosystem</th>
              <th>Current Version</th>
              <th>Latest Version</th>
              <th>Version Gap</th>
              <th>Support Status</th>
              <th>Deprecation</th>
              <th>Vulnerabilities</th>
              <th>Status</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg, index) => (
              <tr key={index}>
                <td>
                  <strong>{pkg.name}</strong>
                </td>
                <td>
                  <Badge bg="info">
                    {ECOSYSTEM_NAME[pkg.ecoSystem.toLowerCase()] ||
                      pkg.ecoSystem}
                  </Badge>
                </td>
                <td>
                  <code>{pkg.version}</code>
                </td>
                <td>
                  {pkg.status === "completed" && pkg.latestVersion ? (
                    <code>{pkg.latestVersion}</code>
                  ) : pkg.status === "processing" ? (
                    <Spinner size="sm" />
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  {pkg.status === "completed"
                    ? getVersionGapBadge(pkg.versionGap)
                    : pkg.status === "processing" ? (
                        <Spinner size="sm" />
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                </td>
                <td>
                  {pkg.status === "completed"
                    ? getSupportedBadge(pkg.isSupported)
                    : pkg.status === "processing" ? (
                        <Spinner size="sm" />
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                </td>
                <td>
                  {pkg.status === "completed" && pkg.isDeprecated ? (
                    <div>
                      <Badge bg="warning" className="mb-1">Deprecated</Badge>
                      {pkg.deprecationMessage && (
                        <div style={{maxWidth: "350px"}}>
                          <small className="text-muted" title={pkg.deprecationMessage} >
                            {pkg.deprecationMessage}
                          </small>
                        </div>
                      )}
                    </div>
                  ) : pkg.status === "processing" ? (
                    <Spinner size="sm" />
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  {pkg.status === "completed" && pkg.hasVulnerability ? (
                    <div>
                      <Badge bg="danger" className="mb-1">Vulnerable</Badge>
                      {pkg.vulnerabilityMessage && (
                        <div className="mb-2">
                          <small className="text-danger" title={pkg.vulnerabilityMessage}>
                            {pkg.vulnerabilityMessage}
                          </small>
                        </div>
                      )}
                      {pkg.vulnerabilities && pkg.vulnerabilities.length > 0 && (
                        <div className="mt-2">
                          <details>
                            <summary className="text-danger small" style={{ cursor: "pointer" }}>
                              View {pkg.vulnerabilities.length} vulnerability{pkg.vulnerabilities.length !== 1 ? "ies" : ""}
                            </summary>
                            <div className="mt-2 small" style={{ maxHeight: "200px", overflowY: "auto" }}>
                              {pkg.vulnerabilities.map((vuln, idx) => (
                                <div key={idx} className="mb-2 p-2 border rounded">
                                  <div className="fw-bold">
                                    {vuln.url ? (
                                      <a
                                        href={vuln.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-decoration-none"
                                      >
                                        {vuln.id}
                                        <i className="bi bi-box-arrow-up-right ms-1 small"></i>
                                      </a>
                                    ) : (
                                      vuln.id
                                    )}
                                    {vuln.cveId && vuln.cveId !== vuln.id && (
                                      <span className="ms-2 text-muted">({vuln.cveId})</span>
                                    )}
                                  </div>
                                  {vuln.severity && (
                                    <Badge 
                                      bg={
                                        vuln.severity === "CRITICAL" ? "danger" :
                                        vuln.severity === "HIGH" ? "danger" :
                                        vuln.severity === "MODERATE" ? "warning" :
                                        vuln.severity === "LOW" ? "info" :
                                        "secondary"
                                      }
                                      className="me-2"
                                    >
                                      {vuln.severity}
                                    </Badge>
                                  )}
                                  {vuln.summary && (
                                    <div className="mt-1 text-muted">
                                      {vuln.summary.length > 100
                                        ? `${vuln.summary.substring(0, 100)}...`
                                        : vuln.summary}
                                    </div>
                                  )}
                                  {vuln.publishedDate && (
                                    <div className="mt-1 text-muted small">
                                      Published: {new Date(vuln.publishedDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  ) : pkg.status === "processing" ? (
                    <Spinner size="sm" />
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>{getStatusBadge(pkg.status)}</td>
                <td>
                  {pkg.status === "error" && pkg.error ? (
                    <small className="text-danger" title={pkg.error}>
                      {pkg.error.length > 50
                        ? `${pkg.error.substring(0, 50)}...`
                        : pkg.error}
                    </small>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}


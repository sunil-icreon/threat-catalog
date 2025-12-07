"use client";
import { useState } from "react";
import { PackageAnalysisResult, VulnerabilityDetail } from "@/types/packageAnalysis";
import { ECOSYSTEM_NAME } from "@/utilities/constants";
import { Badge, Card, Spinner, Table } from "react-bootstrap";
import {
  getStatusBadge,
  getVersionGapBadge,
  getSupportedBadge,
  getSeverityBadge
} from "./PackageAnalysisUtils";
import VulnerabilitiesModal from "./VulnerabilitiesModal";
import MaliciousScriptsModal from "./MaliciousScriptsModal";

interface PackageAnalysisTableProps {
  packages: PackageAnalysisResult[];
}

export default function PackageAnalysisTable({
  packages
}: PackageAnalysisTableProps) {
  const [vulnerabilitiesModal, setVulnerabilitiesModal] = useState<{
    show: boolean;
    packageName: string;
    vulnerabilities: VulnerabilityDetail[];
    vulnerabilityMessage?: string;
  }>({
    show: false,
    packageName: "",
    vulnerabilities: []
  });

  const [maliciousScriptsModal, setMaliciousScriptsModal] = useState<{
    show: boolean;
    packageName: string;
    maliciousScripts: any;
  }>({
    show: false,
    packageName: "",
    maliciousScripts: {}
  });

  if (packages.length === 0) {
    return (
      <Card>
        <Card.Body className="text-center text-muted">
          No packages to display. Paste a comma-separated list in the textarea above.
        </Card.Body>
      </Card>
    );
  }

  const handleVulnerabilitiesClick = (pkg: PackageAnalysisResult) => {
    if (pkg.vulnerabilities && pkg.vulnerabilities.length > 0) {
      setVulnerabilitiesModal({
        show: true,
        packageName: pkg.name,
        vulnerabilities: pkg.vulnerabilities,
        vulnerabilityMessage: pkg.vulnerabilityMessage
      });
    }
  };

  const handleMaliciousScriptsClick = (pkg: PackageAnalysisResult) => {
    if (pkg.maliciousScripts && Object.keys(pkg.maliciousScripts).length > 0) {
      setMaliciousScriptsModal({
        show: true,
        packageName: pkg.name,
        maliciousScripts: pkg.maliciousScripts
      });
    }
  };

  return (
    <>
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
              <th>Malicious Scripts</th>
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
                  {pkg.status === "completed" ? (
                    <div>
                      {pkg.isDeprecated && (
                        <div className="mb-1">
                          <Badge bg="warning">Deprecated</Badge>
                          {pkg.deprecationMessage && (
                            <div style={{ maxWidth: "350px" }}>
                              <small
                                className="text-muted"
                                title={pkg.deprecationMessage}
                              >
                                {pkg.deprecationMessage}
                              </small>
                            </div>
                          )}
                        </div>
                      )}
                      {pkg.isUnpublished && (
                        <Badge bg="danger" className="mb-1 me-1">Unpublished</Badge>
                      )}
                      {pkg.isUnlisted && (
                        <Badge bg="secondary" className="mb-1 me-1">Unlisted</Badge>
                      )}
                      {pkg.isLegacy && (
                        <Badge bg="info" className="mb-1 me-1">Legacy</Badge>
                      )}
                      {!pkg.isDeprecated && !pkg.isUnpublished && !pkg.isUnlisted && !pkg.isLegacy && (
                        <span className="text-muted">-</span>
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
                      {pkg.vulnerabilities && pkg.vulnerabilities.length > 0 && (
                        <div className="mt-1">
                          <button
                            className="btn btn-link btn-sm p-0 text-danger text-decoration-none"
                            onClick={() => handleVulnerabilitiesClick(pkg)}
                            style={{ fontSize: "0.875rem" }}
                          >
                            View {pkg.vulnerabilities.length} vulnerability
                            {pkg.vulnerabilities.length !== 1 ? "ies" : ""}
                            <i className="bi bi-box-arrow-up-right ms-1"></i>
                          </button>
                        </div>
                      )}
                      {pkg.vulnerabilityCount && (
                        <div className="mt-1">
                          <small className="text-muted">
                            {pkg.vulnerabilityCount.CRITICAL ? `${pkg.vulnerabilityCount.CRITICAL} Critical ` : ""}
                            {pkg.vulnerabilityCount.HIGH ? `${pkg.vulnerabilityCount.HIGH} High ` : ""}
                            {pkg.vulnerabilityCount.MODERATE ? `${pkg.vulnerabilityCount.MODERATE} Moderate ` : ""}
                            {pkg.vulnerabilityCount.LOW ? `${pkg.vulnerabilityCount.LOW} Low` : ""}
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
                  {pkg.status === "completed" && pkg.hasMaliciousScripts && pkg.maliciousScripts ? (
                    <div>
                      <Badge bg="danger" className="mb-1">⚠️ Malicious Scripts</Badge>
                      {Object.keys(pkg.maliciousScripts).length > 0 && (
                        <div className="mt-1">
                          <button
                            className="btn btn-link btn-sm p-0 text-danger text-decoration-none"
                            onClick={() => handleMaliciousScriptsClick(pkg)}
                            style={{ fontSize: "0.875rem" }}
                          >
                            View {Object.values(pkg.maliciousScripts).reduce(
                              (sum, versionScripts) => sum + Object.keys(versionScripts).length,
                              0
                            )} script{Object.values(pkg.maliciousScripts).reduce(
                              (sum, versionScripts) => sum + Object.keys(versionScripts).length,
                              0
                            ) !== 1 ? "s" : ""}
                            <i className="bi bi-box-arrow-up-right ms-1"></i>
                          </button>
                          <div className="mt-1">
                            <small className="text-muted">
                              {Object.keys(pkg.maliciousScripts).length} version{Object.keys(pkg.maliciousScripts).length !== 1 ? "s" : ""}
                            </small>
                          </div>
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
                      {pkg.error}
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

    <VulnerabilitiesModal
      show={vulnerabilitiesModal.show}
      onHide={() => setVulnerabilitiesModal({ ...vulnerabilitiesModal, show: false })}
      packageName={vulnerabilitiesModal.packageName}
      vulnerabilities={vulnerabilitiesModal.vulnerabilities}
      vulnerabilityMessage={vulnerabilitiesModal.vulnerabilityMessage}
    />

    <MaliciousScriptsModal
      show={maliciousScriptsModal.show}
      onHide={() => setMaliciousScriptsModal({ ...maliciousScriptsModal, show: false })}
      packageName={maliciousScriptsModal.packageName}
      maliciousScripts={maliciousScriptsModal.maliciousScripts}
    />
    </>
  );
}


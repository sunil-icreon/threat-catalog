"use client";
import { useState } from "react";
import { PackageAnalysisResult, VulnerabilityDetail } from "@/types/packageAnalysis";
import { ECOSYSTEM_NAME } from "@/utilities/constants";
import { Badge, Card, Spinner, Row, Col } from "react-bootstrap";
import {
  getStatusBadge,
  getVersionGapBadge,
  getSupportedBadge,
  getSeverityBadge
} from "./PackageAnalysisUtils";
import VulnerabilitiesModal from "./VulnerabilitiesModal";
import MaliciousScriptsModal from "./MaliciousScriptsModal";

interface PackageAnalysisCardsProps {
  packages: PackageAnalysisResult[];
}

export default function PackageAnalysisCards({
  packages
}: PackageAnalysisCardsProps) {
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
      <Row className="g-3">
      {packages.map((pkg, index) => (
        <Col xs={12} key={index}>
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{pkg.name}</strong>
                <Badge bg="info" className="ms-2">
                  {ECOSYSTEM_NAME[pkg.ecoSystem.toLowerCase()] ||
                    pkg.ecoSystem}
                </Badge>
              </div>
              {getStatusBadge(pkg.status)}
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                <small className="text-muted d-block">Current Version</small>
                <code>{pkg.version}</code>
              </div>

              <div className="mb-2">
                <small className="text-muted d-block">Latest Version</small>
                {pkg.status === "completed" && pkg.latestVersion ? (
                  <code>{pkg.latestVersion}</code>
                ) : pkg.status === "processing" ? (
                  <Spinner size="sm" />
                ) : (
                  <span className="text-muted">-</span>
                )}
              </div>

              <div className="mb-2">
                <small className="text-muted d-block">Version Gap</small>
                {pkg.status === "completed"
                  ? getVersionGapBadge(pkg.versionGap)
                  : pkg.status === "processing" ? (
                      <Spinner size="sm" />
                    ) : (
                      <span className="text-muted">-</span>
                    )}
              </div>

              <div className="mb-2">
                <small className="text-muted d-block">Support Status</small>
                {pkg.status === "completed"
                  ? getSupportedBadge(pkg.isSupported)
                  : pkg.status === "processing" ? (
                      <Spinner size="sm" />
                    ) : (
                      <span className="text-muted">-</span>
                    )}
              </div>

              {pkg.status === "completed" && (pkg.isDeprecated || pkg.isUnpublished || pkg.isUnlisted || pkg.isLegacy) && (
                <div className="mb-2">
                  <small className="text-muted d-block">Package Status</small>
                  <div className="d-flex flex-wrap gap-1 mb-1">
                    {pkg.isDeprecated && (
                      <Badge bg="warning">Deprecated</Badge>
                    )}
                    {pkg.isUnpublished && (
                      <Badge bg="danger">Unpublished</Badge>
                    )}
                    {pkg.isUnlisted && (
                      <Badge bg="secondary">Unlisted</Badge>
                    )}
                    {pkg.isLegacy && (
                      <Badge bg="info">Legacy</Badge>
                    )}
                  </div>
                  {pkg.deprecationMessage && (
                    <div className="mt-1">
                      <small className="text-muted" title={pkg.deprecationMessage}>
                        {pkg.deprecationMessage.length > 100
                          ? `${pkg.deprecationMessage.substring(0, 100)}...`
                          : pkg.deprecationMessage}
                      </small>
                    </div>
                  )}
                </div>
              )}

              {pkg.status === "completed" && pkg.hasVulnerability && (
                <div className="mb-2">
                  <small className="text-muted d-block">Vulnerabilities</small>
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
              )}

              {pkg.status === "completed" && pkg.hasMaliciousScripts && pkg.maliciousScripts && (
                <div className="mb-2">
                  <small className="text-muted d-block">Malicious Scripts</small>
                  <Badge bg="danger" className="mb-1">⚠️ Malicious Scripts Detected</Badge>
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
              )}

              {pkg.status === "error" && pkg.error && (
                <div className="mb-2">
                  <small className="text-muted d-block">Error</small>
                  <small className="text-danger" title={pkg.error}>
                    {pkg.error.length > 100
                      ? `${pkg.error.substring(0, 100)}...`
                      : pkg.error}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>

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


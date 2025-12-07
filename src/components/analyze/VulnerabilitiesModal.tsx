"use client";
import { VulnerabilityDetail } from "@/types/packageAnalysis";
import Modal from "@/components/Modal";
import { Badge } from "react-bootstrap";
import { getSeverityBadge } from "./PackageAnalysisUtils";

interface VulnerabilitiesModalProps {
  show: boolean;
  onHide: () => void;
  packageName: string;
  vulnerabilities: VulnerabilityDetail[];
  vulnerabilityMessage?: string;
}

export default function VulnerabilitiesModal({
  show,
  onHide,
  packageName,
  vulnerabilities,
  vulnerabilityMessage
}: VulnerabilitiesModalProps) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      title={`Vulnerabilities - ${packageName}`}
      size="lg"
      fullscreen="md-down"
    >
      {vulnerabilityMessage && (
        <div className="mb-3">
          <Badge bg="danger" className="mb-2">Vulnerable</Badge>
          <p className="text-danger mb-0">{vulnerabilityMessage}</p>
        </div>
      )}
      
      <div className="mb-3">
        <h6 className="mb-3">
          Found {vulnerabilities.length} vulnerability{vulnerabilities.length !== 1 ? "ies" : ""}
        </h6>
        <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {vulnerabilities.map((vuln, idx) => (
            <div key={idx} className="mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between align-items-start mb-2">
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
                    <span className="ms-2 text-muted">
                      ({vuln.cveId})
                    </span>
                  )}
                </div>
                {getSeverityBadge(vuln.severity)}
              </div>
              
              {vuln.summary && (
                <div className="mt-2">
                  <strong>Summary:</strong>
                  <p className="text-muted mb-0">{vuln.summary}</p>
                </div>
              )}
              
              {vuln.publishedDate && (
                <div className="mt-2">
                  <strong>Published:</strong>{" "}
                  <span className="text-muted">
                    {new Date(vuln.publishedDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {vuln.url && (
                <div className="mt-2">
                  <a
                    href={vuln.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >
                    View Details
                    <i className="bi bi-box-arrow-up-right ms-1"></i>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}


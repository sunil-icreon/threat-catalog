"use client";
import { MaliciousScriptsByVersion } from "@/types/packageAnalysis";
import Modal from "@/components/Modal";
import { Badge } from "react-bootstrap";

interface MaliciousScriptsModalProps {
  show: boolean;
  onHide: () => void;
  packageName: string;
  maliciousScripts: MaliciousScriptsByVersion;
}

export default function MaliciousScriptsModal({
  show,
  onHide,
  packageName,
  maliciousScripts
}: MaliciousScriptsModalProps) {
  const totalScripts = Object.values(maliciousScripts).reduce(
    (sum, versionScripts) => sum + Object.keys(versionScripts).length,
    0
  );

  return (
    <Modal
      show={show}
      onHide={onHide}
      title={`Malicious Scripts - ${packageName}`}
      size="lg"
      fullscreen="md-down"
    >
      <div className="mb-3">
        <Badge bg="danger" className="mb-2">⚠️ Malicious Scripts Detected</Badge>
        <p className="mb-0">
          Found {totalScripts} malicious script{totalScripts !== 1 ? "s" : ""} across{" "}
          {Object.keys(maliciousScripts).length} version{Object.keys(maliciousScripts).length !== 1 ? "s" : ""}
        </p>
      </div>
      
      <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {Object.entries(maliciousScripts).map(([version, versionScripts]) => (
          <div key={version} className="mb-4">
            <h6 className="text-primary mb-3">Version: {version}</h6>
            {Object.entries(versionScripts).map(([scriptType, finding]) => (
              <div key={`${version}-${scriptType}`} className="mb-3 p-3 border border-danger rounded bg-light">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <Badge 
                      bg={
                        finding.severity === "CRITICAL" ? "danger" :
                        finding.severity === "HIGH" ? "warning" :
                        finding.severity === "MODERATE" ? "info" : "secondary"
                      }
                      className="me-2"
                    >
                      {finding.severity}
                    </Badge>
                    <Badge bg="secondary" className="me-2">
                      {scriptType}
                    </Badge>
                  </div>
                </div>
                
                <div className="mb-2">
                  <strong>Script:</strong>
                  <code className="d-block p-2 bg-dark text-light rounded mt-1" style={{ fontSize: "0.875rem", wordBreak: "break-all" }}>
                    {finding.script}
                  </code>
                </div>
                
                <div className="mb-2">
                  <strong>Description:</strong>
                  <p className="text-danger mb-0 mt-1">{finding.description}</p>
                </div>
                
                <div>
                  <strong>Remediation:</strong>
                  <p className="text-success mb-0 mt-1">{finding.remediation}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Modal>
  );
}


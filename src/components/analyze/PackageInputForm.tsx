"use client";
import { Form, Button } from "react-bootstrap";
import { PackageAnalysisInput, PackageAnalysisResult } from "@/types/packageAnalysis";

interface PackageInputFormProps {
  jsonInput: string;
  packages: PackageAnalysisResult[];
  isProcessing: boolean;
  isPaused: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onStartAnalysis: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export default function PackageInputForm({
  jsonInput,
  packages,
  isProcessing,
  isPaused,
  onInputChange,
  onStartAnalysis,
  onPause,
  onResume,
  onReset
}: PackageInputFormProps) {
  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Package List (Comma-separated)</Form.Label>
        <Form.Control
          as="textarea"
          rows={6}
          value={jsonInput}
          onChange={onInputChange}
          placeholder={`react,18.2.0,npm\nreflect.getprototypeof,1.0.4,npm\nregenerator-runtime,0.14.0,npm`}
          disabled={isProcessing}
          style={{ fontFamily: "monospace" }}
        />
        <Form.Text className="text-muted">
          Format: packageName,version,ecoSystem (one package per line). Example: react,18.2.0,npm
        </Form.Text>
      </Form.Group>

      <div className="mb-4 d-flex gap-2">
        <Button
          variant="primary"
          onClick={onStartAnalysis}
          disabled={isProcessing || packages.length === 0}
        >
          {isProcessing ? (isPaused ? "Paused" : "Analyzing...") : "Start Analysis"}
        </Button>
        {isProcessing && (
          <>
            {isPaused ? (
              <Button variant="success" onClick={onResume}>
                <i className="bi bi-play-fill me-1"></i>
                Resume
              </Button>
            ) : (
              <Button variant="warning" onClick={onPause}>
                <i className="bi bi-pause-fill me-1"></i>
                Pause
              </Button>
            )}
          </>
        )}
        <Button variant="secondary" onClick={onReset} disabled={isProcessing && !isPaused}>
          Reset
        </Button>
      </div>
    </>
  );
}


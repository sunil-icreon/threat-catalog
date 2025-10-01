"use client";

import Header from "@/components/Header";
import PackageUploader from "@/components/PackageUploader";
import { useState } from "react";
import { Alert, Container } from "react-bootstrap";

export default function PackageAnalyzerPage() {
  const [error, setError] = useState<string>("");

  const handleProjectAnalyzed = () => {
    setError("");
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <>
      <div className='min-vh-100 bg-light'>
        <Header />
        <Container fluid className='py-1'>
          {error && (
            <Alert variant='danger' className='mb-4'>
              <i className='bi bi-exclamation-triangle me-2'></i>
              <strong>Analysis Error:</strong> {error}
            </Alert>
          )}

          <PackageUploader
            onProjectAnalyzed={handleProjectAnalyzed}
            onError={handleError}
          />
        </Container>
      </div>
    </>
  );
}

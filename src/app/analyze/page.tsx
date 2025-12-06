"use client";
import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Container, Row, Col, Form, Button, Alert, Card } from "react-bootstrap";
import Header from "@/components/Header";
import PackageAnalysisGrid from "@/components/PackageAnalysisGrid";
import PackageAnalysisStats from "@/components/PackageAnalysisStats";
import {
  PackageAnalysisInput,
  PackageAnalysisResult,
  PackageAnalysisStatus
} from "@/types/packageAnalysis";
import { analyzePackage as analyzePackageService } from "@/lib/packageAnalysisService";

const BATCH_SIZE = 5;
const BATCH_DELAY = 1000; // 1 second

function AnalyzePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [packages, setPackages] = useState<PackageAnalysisResult[]>([]);
  const [jsonInput, setJsonInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSuccessfulIndexRef = useRef<number>(-1);
  const isPausedRef = useRef<boolean>(false);
  const pauseResumeRef = useRef<{ resolve: () => void } | null>(null);

  useEffect(() => {
    const paParam = searchParams.get("pa");
    if (paParam === "e") {
      setHasAccess(true);
    } else {
      setHasAccess(false);
      router.replace("/");
    }
  }, [searchParams, router]);

  const parsePackageInput = useCallback((input: string): PackageAnalysisInput[] => {
    try {
      const lines = input.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
      
      if (lines.length === 0) {
        throw new Error("No packages found. Please enter at least one package.");
      }

      const packages: PackageAnalysisInput[] = [];

      lines.forEach((line, index) => {
        const parts = line.split(",").map((part) => part.trim());
        
        // Skip empty first element if line starts with comma
        const startIndex = parts[0] === "" ? 1 : 0;
        
        if (parts.length - startIndex < 3) {
          throw new Error(
            `Line ${index + 1}: Invalid format. Expected format: packageName,version,ecoSystem`
          );
        }

        const packageName = parts[startIndex];
        const version = parts[startIndex + 1];
        const ecoSystem = parts[startIndex + 2];

        if (!packageName || !version || !ecoSystem) {
          throw new Error(
            `Line ${index + 1}: Missing required fields. Each line must have: packageName,version,ecoSystem`
          );
        }

        packages.push({
          name: packageName,
          version: version,
          ecoSystem: ecoSystem
        });
      });

      return packages;
    } catch (err: any) {
      throw new Error(err.message || "Invalid input format");
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setJsonInput(value);
      setError(null);

      if (!value.trim()) {
        setPackages([]);
        return;
      }

      try {
        const parsed = parsePackageInput(value);
        const initialPackages: PackageAnalysisResult[] = parsed.map((pkg) => ({
          ...pkg,
          status: "pending" as PackageAnalysisStatus
        }));
        setPackages(initialPackages);
        lastSuccessfulIndexRef.current = -1;
      } catch (err: any) {
        setError(err.message);
        setPackages([]);
      }
    },
    [parsePackageInput]
  );

  const analyzePackage = useCallback(
    async (pkg: PackageAnalysisInput): Promise<PackageAnalysisResult> => {
      try {
        // Call the service function directly (client-side, CSP allows registry domains)
        return await analyzePackageService(pkg);
      } catch (err: any) {
        return {
          ...pkg,
          status: "error" as PackageAnalysisStatus,
          error: err.message || "Failed to analyze package"
        };
      }
    },
    []
  );

  const processBatch = useCallback(
    async (
      batch: PackageAnalysisInput[],
      startIndex: number
    ): Promise<void> => {
      // Update status to processing
      setPackages((prev) =>
        prev.map((pkg, idx) => {
          if (idx >= startIndex && idx < startIndex + batch.length) {
            return { ...pkg, status: "processing" as PackageAnalysisStatus };
          }
          return pkg;
        })
      );

      // Process batch in parallel
      const results = await Promise.all(
        batch.map((pkg) => analyzePackage(pkg))
      );

      // Update packages with results
      setPackages((prev) =>
        prev.map((pkg, idx) => {
          const resultIndex = idx - startIndex;
          if (resultIndex >= 0 && resultIndex < results.length) {
            return results[resultIndex];
          }
          return pkg;
        })
      );
    },
    [analyzePackage]
  );

  const handleStartAnalysis = useCallback(async () => {
    // Check packages state first
    if (packages.length === 0) {
      setError("No packages to analyze. Please paste a comma-separated list in the textarea above.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Find the first non-completed package from current state
    const firstPendingIndex = packages.findIndex(
      (pkg) => pkg.status !== "completed"
    );

    // Determine start index
    let startIndex = 0;
    if (firstPendingIndex === -1) {
      // All are completed, start from beginning
      startIndex = 0;
      lastSuccessfulIndexRef.current = -1;
    } else {
      // Start from the first pending/error package
      startIndex = firstPendingIndex;
    }

    // Get packages to process from current state
    const packagesToProcess = packages.slice(startIndex).filter(
      (pkg) => pkg.status !== "completed"
    );

    // Check if we have packages to process
    if (packagesToProcess.length === 0) {
      setError("No packages to process. All packages have been completed.");
      setIsProcessing(false);
      return;
    }

    // Reset packages that need to be processed to pending status
    setPackages((prev) =>
      prev.map((pkg, idx) => {
        if (idx >= startIndex && pkg.status !== "completed") {
          return { ...pkg, status: "pending" as PackageAnalysisStatus };
        }
        return pkg;
      })
    );

    try {
      // Wait a tick for state to update
      await new Promise((resolve) => setTimeout(resolve, 0));

      const totalBatches = Math.ceil(packagesToProcess.length / BATCH_SIZE);

      for (let i = 0; i < totalBatches; i++) {
        // Check for pause state before processing each batch
        while (isPausedRef.current) {
          // Wait until resumed
          await new Promise<void>((resolve) => {
            pauseResumeRef.current = { resolve };
          });
          pauseResumeRef.current = null;
        }

        const batchStart = startIndex + i * BATCH_SIZE;
        const batchInputs: PackageAnalysisInput[] = packagesToProcess
          .slice(i * BATCH_SIZE, i * BATCH_SIZE + BATCH_SIZE)
          .map((pkg) => ({
            name: pkg.name,
            version: pkg.version,
            ecoSystem: pkg.ecoSystem
          }));

        await processBatch(batchInputs, batchStart);

        // Update last successful index by checking current state
        setPackages((prev) => {
          const batchResults = prev.slice(batchStart, batchStart + batchInputs.length);
          // Find last completed index in reverse
          let lastCompletedIndex = -1;
          for (let j = batchResults.length - 1; j >= 0; j--) {
            if (batchResults[j].status === "completed") {
              lastCompletedIndex = j;
              break;
            }
          }
          if (lastCompletedIndex >= 0) {
            lastSuccessfulIndexRef.current = batchStart + lastCompletedIndex;
          }
          return prev;
        });

        // Wait before next batch (except for the last batch)
        if (i < totalBatches - 1) {
          // Check for pause during delay - break delay into smaller chunks
          const chunkSize = 100; // Check every 100ms
          const chunks = BATCH_DELAY / chunkSize;
          
          for (let chunk = 0; chunk < chunks; chunk++) {
            // Check if paused
            while (isPausedRef.current) {
              await new Promise<void>((resolve) => {
                pauseResumeRef.current = { resolve };
              });
              pauseResumeRef.current = null;
            }
            await new Promise((resolve) => setTimeout(resolve, chunkSize));
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis");
    } finally {
      setIsProcessing(false);
      setIsPaused(false);
      isPausedRef.current = false;
      pauseResumeRef.current = null;
    }
  }, [packages, processBatch]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    isPausedRef.current = true;
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    isPausedRef.current = false;
    if (pauseResumeRef.current) {
      pauseResumeRef.current.resolve();
      pauseResumeRef.current = null;
    }
  }, []);

  const handleReset = useCallback(() => {
    setPackages([]);
    setJsonInput("");
    setError(null);
    setIsPaused(false);
    isPausedRef.current = false;
    lastSuccessfulIndexRef.current = -1;
    if (pauseResumeRef.current) {
      pauseResumeRef.current.resolve();
      pauseResumeRef.current = null;
    }
  }, []);

  if (!hasAccess) {
    return null;
  }

  return (
    <>
      <Header />
      <Container fluid className='py-4' id='main-content'>
        <Row>
          <Col>
            <h1 className="mb-4">Package Analysis</h1>
            <p className="text-muted mb-4">
              Paste a comma-separated list of packages (one per line). Each line should
              have the format: <code>packageName,version,ecoSystem</code>
            </p>

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Package List (Comma-separated)</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                value={jsonInput}
                onChange={handleInputChange}
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
                onClick={handleStartAnalysis}
                disabled={isProcessing || packages.length === 0}
              >
                {isProcessing ? (isPaused ? "Paused" : "Analyzing...") : "Start Analysis"}
              </Button>
              {isProcessing && (
                <>
                  {isPaused ? (
                    <Button variant="success" onClick={handleResume}>
                      <i className="bi bi-play-fill me-1"></i>
                      Resume
                    </Button>
                  ) : (
                    <Button variant="warning" onClick={handlePause}>
                      <i className="bi bi-pause-fill me-1"></i>
                      Pause
                    </Button>
                  )}
                </>
              )}
              <Button variant="secondary" onClick={handleReset} disabled={isProcessing && !isPaused}>
                Reset
              </Button>
            </div>

            {packages.length > 0 && (
              <>
                <PackageAnalysisStats packages={packages} />
                <PackageAnalysisGrid packages={packages} />
              </>
            )}

            {/* Results JSON Display */}
            {packages.length > 0 && 
             packages.every((pkg) => pkg.status === "completed" || pkg.status === "error") && (
              <div className="mt-5">
                <h3 className="mb-3">Results JSON</h3>
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <span>Analysis Results</span>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        const jsonString = JSON.stringify(packages, null, 2);
                        navigator.clipboard.writeText(jsonString);
                      }}
                    >
                      <i className="bi bi-clipboard me-1"></i>
                      Copy JSON
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <pre
                      style={{
                        maxHeight: "500px",
                        overflow: "auto",
                        fontSize: "0.875rem",
                        backgroundColor: "#f8f9fa",
                        padding: "1rem",
                        borderRadius: "0.25rem",
                        margin: 0
                      }}
                    >
                      {JSON.stringify(packages, null, 2)}
                    </pre>
                  </Card.Body>
                </Card>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <Container fluid className='py-4' id='main-content'>
          <div className='text-center'>
            <div className='spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          </div>
        </Container>
      </>
    }>
      <AnalyzePageContent />
    </Suspense>
  );
}


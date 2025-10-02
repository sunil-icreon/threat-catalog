"use client";

import { IRecord, IVulnerabilityType } from "@/types/vulnerability";
import { ECOSYSTEM_NAME, STORAGE_KEYS } from "@/utilities/constants";
import { cacheManager } from "@/utilities/util";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Tab,
  Tabs,
  Toast,
  ToastContainer
} from "react-bootstrap";
import VulnerabilityDisplay from "./VulnerabilityDisplay";

export interface PackageInfo {
  name: string;
  version: string;
  ecosystem: string;
}

export interface ProjectInfo {
  name: string;
  version: string;
  ecosystem: string;
  packages: PackageInfo[];
}

interface PackageUploaderProps {
  onProjectAnalyzed?: (projectInfo: ProjectInfo) => void;
  onError?: (error: string) => void;
}

const PackageUploader: React.FC<PackageUploaderProps> = ({
  onProjectAnalyzed,
  onError
}) => {
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vulList, setVulList] = useState<Array<any>>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isScanningComplete, setIsScanningComplete] = useState<boolean>(false);
  const [vulHeaderText, setVulHeaderText] = useState<string>("");

  const detectEcosystem = (fileName: string, content: string): string => {
    const lowerFileName = fileName.toLowerCase();

    if (lowerFileName.includes("package.json")) return "npm";
    if (lowerFileName.includes("package-lock.json")) return "npm";
    if (lowerFileName.includes("pom.xml")) return "maven";
    if (lowerFileName.includes("build.gradle")) return "gradle";
    if (
      lowerFileName.includes("project.json") ||
      lowerFileName.includes("packages.config")
    )
      return "nuget";
    if (lowerFileName.includes("csproj")) return "nuget";

    // Content-based detection
    if (
      content.includes('"dependencies"') &&
      content.includes('"devDependencies"')
    )
      return "npm";
    if (content.includes("<dependencies>") && content.includes("<groupId>"))
      return "maven";
    if (
      content.includes("implementation") &&
      content.includes("testImplementation")
    )
      return "gradle";
    if (
      content.includes("<PackageReference") ||
      content.includes("packages.config")
    )
      return "nuget";

    return "unknown";
  };

  const parsePackageJson = (content: string): ProjectInfo => {
    try {
      const data = JSON.parse(content);
      const packages: PackageInfo[] = [];

      // Parse dependencies
      if (data.dependencies) {
        Object.entries(data.dependencies).forEach(([name, version]) => {
          packages.push({
            name,
            version: version as string,
            ecosystem: "npm"
          });
        });
      }

      // Parse devDependencies
      if (data.devDependencies) {
        Object.entries(data.devDependencies).forEach(([name, version]) => {
          packages.push({
            name,
            version: version as string,
            ecosystem: "npm"
          });
        });
      }

      return {
        name: data.name || "Unknown Project",
        version: data.version || "1.0.0",
        ecosystem: "npm",
        packages
      };
    } catch (error) {
      throw new Error("Invalid JSON format");
    }
  };

  function removeDuplicatesByKeys<T>(arr: T[], keys: (keyof T)[]): T[] {
    const seen = new Set<string>();
    return arr.filter((obj) => {
      const compositeKey = keys.map((k) => String(obj[k])).join("|");
      if (seen.has(compositeKey)) {
        return false;
      }
      seen.add(compositeKey);
      return true;
    });
  }

  const extractPackages = (dependencies: IRecord, packages?: PackageInfo[]) => {
    packages = packages || [];
    for (const [name, info] of Object.entries(dependencies)) {
      let pkgName: string | undefined = name;

      if (name.indexOf("@") > -1) {
        pkgName = `@${name.split("@")[1]}`;
      } else {
        pkgName = name.split("/").pop();
      }

      if (pkgName) {
        packages = [
          ...packages,
          {
            name: pkgName,
            version: info?.version || info,
            ecosystem: "npm"
          }
        ];
      }

      if (info.dependencies) {
        extractPackages(info.dependencies, packages);
      }
    }

    return packages;
  };

  const parsePackageLock = (content: string): ProjectInfo => {
    try {
      const data = JSON.parse(content);
      let packages: PackageInfo[] = extractPackages(data.packages);
      packages = removeDuplicatesByKeys(packages, ["name", "version"]);
      return {
        name: data.name || "Unknown Project",
        version: data.version || "1.0.0",
        ecosystem: "npm",
        packages
      };
    } catch (error) {
      throw new Error("Invalid package-lock.json format");
    }
  };

  const parseMavenPom = (content: string): ProjectInfo => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, "text/xml");

      const groupId = xmlDoc.querySelector("groupId")?.textContent || "";
      const artifactId = xmlDoc.querySelector("artifactId")?.textContent || "";
      const version = xmlDoc.querySelector("version")?.textContent || "1.0.0";

      const packages: PackageInfo[] = [];
      const dependencies = xmlDoc.querySelectorAll("dependency");

      dependencies.forEach((dep) => {
        const depGroupId = dep.querySelector("groupId")?.textContent;
        const depArtifactId = dep.querySelector("artifactId")?.textContent;
        const depVersion = dep.querySelector("version")?.textContent;

        if (depGroupId && depArtifactId && depVersion) {
          packages.push({
            name: `${depGroupId}:${depArtifactId}`,
            version: depVersion,
            ecosystem: "maven"
          });
        }
      });

      return {
        name: artifactId || "Unknown Project",
        version,
        ecosystem: "maven",
        packages
      };
    } catch (error) {
      throw new Error("Invalid Maven POM format");
    }
  };

  const parseGradleBuild = (content: string): ProjectInfo => {
    try {
      const packages: PackageInfo[] = [];
      const lines = content.split("\n");

      // Extract project name and version from settings.gradle or build.gradle
      let projectName = "Unknown Project";
      let version = "1.0.0";

      // Look for implementation dependencies
      lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (
          trimmedLine.startsWith("implementation") ||
          trimmedLine.startsWith("testImplementation")
        ) {
          const match = trimmedLine.match(/['"]([^'"]+)['"]/);
          if (match) {
            const dependency = match[1];
            const [name, version] = dependency.split(":");
            if (name && version) {
              packages.push({
                name,
                version,
                ecosystem: "gradle"
              });
            }
          }
        }
      });

      return {
        name: projectName,
        version,
        ecosystem: "gradle",
        packages
      };
    } catch (error) {
      throw new Error("Invalid Gradle build file format");
    }
  };

  const parseNuGetConfig = (content: string): ProjectInfo => {
    try {
      const packages: PackageInfo[] = [];

      if (content.includes("<PackageReference")) {
        // .NET Core/5+ format
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, "text/xml");
        const packageRefs = xmlDoc.querySelectorAll("PackageReference");

        packageRefs.forEach((ref) => {
          const name = ref.getAttribute("Include");
          const version = ref.getAttribute("Version");
          if (name && version) {
            packages.push({
              name,
              version,
              ecosystem: "nuget"
            });
          }
        });
      } else if (content.includes("packages.config")) {
        // Legacy packages.config format
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, "text/xml");
        const packages_elements = xmlDoc.querySelectorAll("package");

        packages_elements.forEach((pkg) => {
          const name = pkg.getAttribute("id");
          const version = pkg.getAttribute("version");
          if (name && version) {
            packages.push({
              name,
              version,
              ecosystem: "nuget"
            });
          }
        });
      }

      return {
        name: "Unknown Project",
        version: "1.0.0",
        ecosystem: "nuget",
        packages
      };
    } catch (error) {
      throw new Error("Invalid NuGet configuration format");
    }
  };

  const analyzeContent = useCallback(
    async (content: string, fileName: string) => {
      setIsAnalyzing(true);
      setError("");

      try {
        const ecosystem = detectEcosystem(fileName, content);
        let result: ProjectInfo;

        switch (ecosystem) {
          case "npm":
            if (fileName.includes("package-lock.json")) {
              result = parsePackageLock(content);
            } else {
              result = parsePackageJson(content);
            }
            break;
          case "maven":
            result = parseMavenPom(content);
            break;
          case "gradle":
            result = parseGradleBuild(content);
            break;
          case "nuget":
            result = parseNuGetConfig(content);
            break;
          default:
            throw new Error("Unsupported file format or ecosystem");
        }

        setProjectInfo(() => result);
        onProjectAnalyzed?.(result);
        scanPackagesInDownloadedVulnerabilities(result);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsAnalyzing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onProjectAnalyzed, onError]
  );

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
        analyzeContent(content, file.name);
      };

      reader.readAsText(file);
    },
    [analyzeContent]
  );

  const handleReset = useCallback(() => {
    setProjectInfo(null);
    setError("");
    setVulList([]);
    setIsScanningComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const scanPackagesInDownloadedVulnerabilities = (
    analyzedProjectInfo: IRecord
  ) => {
    let fromCache: any = cacheManager.getItem(
      STORAGE_KEYS.VULNERABILITY_DATA,
      {}
    );

    if (!fromCache) {
      return [];
    }

    const { vulnerabilities } = fromCache;

    let packageVuls: Array<any> = [];
    if (vulnerabilities && vulnerabilities.length > 0) {
      vulnerabilities.map((vul: IVulnerabilityType) => {
        const found = analyzedProjectInfo?.packages.find(
          (pkg: IRecord) => pkg.name === vul.packageName
        );

        if (found) {
          packageVuls = [...packageVuls, vul];
        }
      });
    }

    setIsScanningComplete(() => true);
    setVulList(packageVuls);
    setVulHeaderText(
      () => `${packageVuls.length} records found in downloaded vulnerabilities`
    );
  };

  const handleLiveScanning = async () => {
    if (!projectInfo) {
      return false;
    }

    setVulList([]);
    setIsScanningComplete(false);
    setIsScanning(() => true);

    const response = await fetch(`/api/vulnerabilities`, {
      method: "POST",
      body: JSON.stringify({
        action: "analysePackageFile",
        packageFileContent: projectInfo
      })
    });

    setIsScanning(() => false);

    if (!response.ok) {
      setError("Failed to analyze packages");
      return;
    }

    let vulListData: any = await response.json();

    const { vulnerabilities } = vulListData;

    setVulHeaderText(
      () => `${vulnerabilities.length} records found in live vulnerabilities`
    );

    setVulList(vulnerabilities);
    setIsScanning(() => false);
    setIsScanningComplete(true);
  };

  const showProjectInfoBox = useMemo(() => {
    return projectInfo || isAnalyzing || error;
  }, [projectInfo, isAnalyzing, error]);

  return (
    <Card className='shadow-sm'>
      <Card.Header className='bg-primary text-white py-3'>
        <h5 className='mb-1'>
          <i className='bi bi-upload me-2'></i>
          Package File Analyzer
        </h5>
        <small>
          Upload or paste package configuration files to analyze dependencies
        </small>
      </Card.Header>

      <Card.Body className='py-3'>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || "upload")}
          className='mb-3'
        >
          <Tab eventKey='upload' title='Upload File'>
            <Row>
              <Col
                md={showProjectInfoBox ? 6 : 8}
                lg={showProjectInfoBox ? 6 : 9}
                sm={12}
              >
                <div className='py-3'>
                  <div className='text-center mb-3'>
                    <i
                      className='bi bi-cloud-upload'
                      style={{ fontSize: "2rem", color: "#6c757d" }}
                    ></i>
                  </div>
                  <Form.Group>
                    <Form.Label className='mb-2'>
                      Select Package Configuration File
                    </Form.Label>
                    <Form.Control
                      ref={fileInputRef}
                      type='file'
                      accept='.json,.xml,.gradle,.config'
                      onChange={handleFileUpload}
                      className='mb-2'
                    />
                    <Form.Text className='text-muted small'>
                      Supported: package.json, package-lock.json, pom.xml,
                      build.gradle, .csproj, packages.config
                    </Form.Text>
                  </Form.Group>
                </div>
              </Col>

              {projectInfo && (
                <Col md={3} lg={3} sm={12}>
                  <Card className='custom-card mb-3'>
                    <Card.Body>
                      <div className='d-flex flex-column gap-1'>
                        <h6>Project Information</h6>
                        <div className='d-flex justify-content-between small'>
                          <span className='text-muted text-capitalize'>
                            Name
                          </span>
                          <span className='text-muted small'>
                            <strong>{projectInfo.name}</strong>
                          </span>
                        </div>

                        <div className='d-flex justify-content-between small'>
                          <span className='text-muted text-capitalize'>
                            Version
                          </span>
                          <span className='text-muted small'>
                            <strong>{projectInfo.version}</strong>
                          </span>
                        </div>

                        <div className='d-flex justify-content-between small'>
                          <span className='text-muted text-capitalize'>
                            Ecosystem
                          </span>
                          <span className='text-muted small'>
                            <strong>
                              {ECOSYSTEM_NAME[projectInfo.ecosystem] ??
                                projectInfo.ecosystem}
                            </strong>
                          </span>
                        </div>

                        <div className='d-flex justify-content-between small'>
                          <span className='text-muted text-capitalize'>
                            Total Packages
                          </span>
                          <span className='text-muted small'>
                            <strong>{projectInfo.packages.length}</strong>
                          </span>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )}

              {error && (
                <Col md={3} lg={3} sm={12}>
                  <Alert variant='danger' className='mb-3'>
                    <i className='bi bi-exclamation-triangle me-2'></i>
                    {error}
                  </Alert>
                </Col>
              )}

              {isAnalyzing && (
                <Col md={3} lg={3} sm={12}>
                  <div className='text-center py-4'>
                    <Spinner animation='border' variant='primary' />
                    <p className='mt-2'>Analyzing package configuration...</p>
                  </div>
                </Col>
              )}

              <Col md={3} lg={3} sm={12}>
                <div className='mt-2'>
                  <Button
                    variant='outline-secondary'
                    size='sm'
                    className='w-100 mb-3'
                    onClick={handleReset}
                  >
                    <i className='bi bi-arrow-clockwise me-1'></i>
                    Reset
                  </Button>

                  <Button
                    variant='primary'
                    size='sm'
                    className='w-100  mb-1'
                    disabled={!projectInfo}
                    onClick={handleLiveScanning}
                  >
                    <i className='bi bi-clock-fill me-1'></i>
                    Live Scanning
                  </Button>
                  <div className='text-muted text-sm'>
                    Will search project packages in live vulnerabilities
                    database
                  </div>
                </div>
              </Col>
            </Row>

            {isScanning && (
              <div className='text-center py-4'>
                <Spinner animation='border' variant='primary' />
                <p className='mt-2'>
                  Scanning packages with live vulnerabilities, this may take few
                  minutes...
                </p>
              </div>
            )}

            {isScanningComplete && (
              <>
                <div className='d-flex justify-content-between align-items-center mb-3 mt-3'>
                  <h6 className='fw-semibold text-dark mb-0'>
                    {vulHeaderText}
                  </h6>
                </div>
                {vulList.length > 0 && (
                  <VulnerabilityDisplay vulnerabilities={vulList} />
                )}
              </>
            )}

            <ToastContainer
              position='top-end'
              className='p-3'
              style={{ zIndex: 1 }}
            >
              <Toast
                onClose={() => setError("")}
                show={!!error}
                delay={3000}
                autohide
              >
                <Toast.Header className='error-bg'>
                  <strong className='me-auto'>Error</strong>
                </Toast.Header>
                <Toast.Body className='error-bg-alt text-danger'>
                  {error}
                </Toast.Body>
              </Toast>
            </ToastContainer>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
};

export default PackageUploader;

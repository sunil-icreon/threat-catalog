/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import EcosystemMultiSelect from "@/components/EcosystemMultiSelect";
import { GetEcosystemOptions } from "@/components/shared/UtilityComponents";
import { useAppStore } from "@/lib/store";
import { STORAGE_KEYS } from "@/utilities/constants";
import { cacheManager } from "@/utilities/util";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Toast,
  ToastContainer
} from "react-bootstrap";
import Header from "../components/Header";

import { useRouter } from "next/navigation";
import StatsCards from "../components/StatsCards";
import VulnerabilityDetailModal from "../components/VulnerabilityDetailModal";
import VulnerabilityDetailSidebar from "../components/VulnerabilityDetailSidebar";
import VulnerabilityDisplay from "../components/VulnerabilityDisplay";
import VulnerabilityFiltersComponent from "../components/VulnerabilityFilters";
import {
  IEcoSystemType,
  IRecord,
  ISecerityType,
  IStatCacheType,
  IStatType,
  IVulnerabilityType,
  SeverityStats,
  VulnerabilityFilters,
  VulnerabilityResponse
} from "../types/vulnerability";

export interface ILatestQueryFilterType {
  ecosystem: IEcoSystemType;
  duration: "week" | "month" | "today";
  apiKey: string;
}

export const DashboardContent = (props: any) => {
  const { vulnerabilityList } = props;
  const router = useRouter();
  const [vulnerabilities, setVulnerabilities] = useState<IVulnerabilityType[]>(
    vulnerabilityList.vulnerabilities
  );

  const [fetchingLatest, setFetchingLatest] = useState<boolean>(false);
  const [showFetchLatestModal, setshowFetchLatestModal] =
    useState<boolean>(false);

  const [latestQueryFilter, setlatestQueryFilter] =
    useState<ILatestQueryFilterType>({
      ecosystem: "NPM",
      duration: "week",
      apiKey: ""
    });

  const {
    selectedEcosystems,
    setThreatFilter,
    setSubmittedProjectVuls,
    setSelectedEcosystems
  } = useAppStore();
  const [filteredVuls, setFilteredVuls] = useState<IVulnerabilityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VulnerabilityFilters>({});

  const [stats, setStats] = useState<IStatType>({
    ecosystemStats: {} as Record<string, number>,
    durationStats: {} as Record<string, IRecord>,
    severityStats: {} as SeverityStats,
    totalVulnerabilities: 0,
    lastRefresh: new Date().toISOString()
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedVulnerability, setSelectedVulnerability] =
    useState<IVulnerabilityType | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (showModal || showSidebar || showMobileModal) {
      // document.body.style.overflow = "hidden";
      // document.body.style.position = "fixed";
      // document.body.style.width = "100%";
      document.body.classList.add("sidebar-open");
    } else {
      // document.body.style.overflow = "";
      // document.body.style.position = "";
      // document.body.style.width = "";
      document.body.classList.remove("sidebar-open");
    }

    // Cleanup on unmount
    return () => {
      // document.body.style.overflow = "";
      // document.body.style.position = "";
      // document.body.style.width = "";
      document.body.classList.remove("sidebar-open");
    };
  }, [showModal, showSidebar, showMobileModal]);

  const setDataInState = (
    vulnerabilities: Array<IVulnerabilityType>,
    statData: IStatType | IStatCacheType
  ) => {
    setVulnerabilities(vulnerabilities);

    // Filter vulnerabilities based on selected ecosystems
    let filteredVulnerabilities = [...vulnerabilities];
    if (selectedEcosystems.length > 0) {
      filteredVulnerabilities = vulnerabilities.filter(
        (vul: IVulnerabilityType) => selectedEcosystems.includes(vul.ecosystem)
      );
    }

    setFilteredVuls(() => filteredVulnerabilities);

    if ("ecosystemStats" in statData) {
      setStats(statData);
    } else {
      setStats({
        ecosystemStats: statData.ecosystem,
        durationStats: statData.duration,
        severityStats: statData.severity,
        totalVulnerabilities: vulnerabilities.length,
        lastRefresh: statData.lastRefresh
      });
    }
  };

  const fetchVulnerabilitiesServer = () => {
    let data: VulnerabilityResponse = vulnerabilityList;
    if (data.total > 0) {
      setDataInState(data.vulnerabilities, data.stats);
      cacheManager.setItem(STORAGE_KEYS.VULNERABILITY_DATA, data);
    }

    setLoading(false);
  };

  const applyFilters = useCallback(
    (filtersToApply: VulnerabilityFilters, ecosystemsToApply: string[]) => {
      let filteredVulnerabilities: Array<IVulnerabilityType> = vulnerabilities;

      if (!filteredVulnerabilities) {
        return;
      }

      // Apply ecosystem filter first (based on selected ecosystems)
      if (ecosystemsToApply.length > 0 && ecosystemsToApply.length < 3) {
        filteredVulnerabilities = filteredVulnerabilities.filter((vul) =>
          ecosystemsToApply.includes(vul.ecosystem)
        );
      }

      // Apply other filters
      if (filtersToApply.ecosystem) {
        filteredVulnerabilities = filteredVulnerabilities.filter(
          (vul) => vul.ecosystem === filtersToApply.ecosystem
        );
      }

      if (filtersToApply.severity) {
        filteredVulnerabilities = filteredVulnerabilities.filter(
          (vul) => vul.severity === filtersToApply.severity
        );
      }

      if (filtersToApply.status) {
        filteredVulnerabilities = filteredVulnerabilities.filter(
          (vul) => vul.status === filtersToApply.status
        );
      }

      if (filtersToApply.search) {
        const searchTerm = filtersToApply.search.toLowerCase();
        filteredVulnerabilities = filteredVulnerabilities.filter(
          (vul) =>
            vul.summary?.toLowerCase().includes(searchTerm) ||
            vul.packageName.toLowerCase().includes(searchTerm) ||
            vul.cveId?.toLowerCase().includes(searchTerm)
        );
      }

      // Sort by severity (CRITICAL > HIGH > MEDIUM > LOW) and then by date
      const severityOrder: Record<ISecerityType, number> = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1
      };
      filteredVulnerabilities?.sort((a, b) => {
        const severityDiff =
          severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return (
          new Date(b.publishedDate).getTime() -
          new Date(a.publishedDate).getTime()
        );
      });

      setThreatFilter(filtersToApply);
      setFilteredVuls(() => [...filteredVulnerabilities]);
    },
    [vulnerabilities]
  );

  const handleFiltersChange = useCallback(
    (newFilters: VulnerabilityFilters) => {
      setFilters(newFilters);
      applyFilters(newFilters, selectedEcosystems);
    },
    [selectedEcosystems, applyFilters]
  );

  const handleEcosystemsChange = useCallback(
    (ecosystems: string[]) => {
      setSelectedEcosystems(ecosystems);
      applyFilters(filters, ecosystems);
      setThreatFilter(filters);
    },
    [filters, applyFilters]
  );

  const handleLatestQueryFilterChange = (
    key: keyof ILatestQueryFilterType,
    value: string
  ) => {
    const newFilters = { ...latestQueryFilter, [key]: value };
    setlatestQueryFilter(newFilters);
  };

  const handleShowFetchModal = () => {
    setshowFetchLatestModal(() => true);
  };

  const handleVulnerabilityClick = (vulnerability: IVulnerabilityType) => {
    setSelectedVulnerability(() => vulnerability);
    if (isMobile) {
      setShowMobileModal(true);
    } else {
      setShowSidebar(true);
    }
  };

  const handleCloseSidebar = () => {
    setShowSidebar(false);
    setSelectedVulnerability(null);
  };

  const handleCloseMobileModal = () => {
    setShowMobileModal(false);
    setSelectedVulnerability(null);
  };

  const fetchLatestVulnerabilities = async (e: React.FormEvent) => {
    e.preventDefault();

    setApiKeyError("");
    setError("");
    const { apiKey } = latestQueryFilter;

    if (!apiKey) {
      setApiKeyError("This field is required");
      return;
    }

    setFetchingLatest(true);

    const response = await fetch(`/api/vulnerabilities`, {
      method: "POST",
      body: JSON.stringify({ action: "fetchLatest", ...latestQueryFilter })
    });
    // setRefreshing(false);

    if (!response.ok) {
      if (response.status === 403) {
        setError("Unauthored. API key is required");
      } else {
        setError("Failed to fetch vulnerabilities");
      }

      setshowFetchLatestModal(false);
      return;
    }

    setFetchingLatest(false);
    setshowFetchLatestModal(() => false);
    router.refresh();
  };

  useEffect(() => {
    fetchVulnerabilitiesServer();
  }, [vulnerabilityList]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);

      if (!mobile && showMobileModal) {
        setShowMobileModal(false);
      }
      if (mobile && showSidebar) {
        setShowSidebar(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showMobileModal, showSidebar]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <>
        <div className='min-vh-100 bg-light'>
          <Header />
          <Container fluid className='py-4'>
            <div className='mb-1'>
              <div className='d-flex flex-wrap justify-content-between gap-1'>
                <div>
                  <h3 className='fw-bold text-dark mb-0'>
                    Vulnerability Dashboard
                  </h3>
                  <p className='text-muted d-flex align-items-center'>
                    Monitor security vulnerabilities across NPM, Maven, and
                    NuGet ecosystems
                    <Button
                      variant='outline'
                      onClick={() => setShowModal(true)}
                    >
                      <i className='bi bi-info-circle'></i>
                    </Button>
                  </p>
                </div>
                <div className='mb-3 d-flex align-items-center gap-2'>
                  <Button
                    variant='primary'
                    className='d-flex align-items-center  ms-2'
                    size='sm'
                    onClick={handleShowFetchModal}
                  >
                    <i className={`bi bi-gear me-2 `}></i>
                    Fetch Latest
                  </Button>

                  <EcosystemMultiSelect
                    onEcosystemsChange={handleEcosystemsChange}
                  />
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <StatsCards
              ecosystemStats={stats.ecosystemStats}
              severityStats={stats.severityStats}
              totalVulnerabilities={stats.totalVulnerabilities}
              lastUpdate={stats.lastRefresh}
              durationStats={stats.durationStats}
              vulnerabilities={vulnerabilities}
              onVulnerabilityClick={handleVulnerabilityClick}
            />
            {/* Filters */}
            <VulnerabilityFiltersComponent
              onFiltersChange={handleFiltersChange}
            />
            {/* Error State */}
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
            {/* Loading State */}
            {loading && filteredVuls?.length === 0 && (
              <div className='d-flex justify-content-center align-items-center text-center py-5'>
                <Spinner
                  animation='border'
                  variant='primary'
                  className='me-2'
                />
                <span className='text-muted'>Loading vulnerabilities...</span>
              </div>
            )}
            {/* Vulnerabilities Display */}
            {!loading && filteredVuls?.length > 0 && (
              <div>
                <div className='d-flex justify-content-between align-items-center mb-4'>
                  <h2 className='h4 fw-semibold text-dark mb-0'>
                    Vulnerabilities ({filteredVuls.length})
                  </h2>
                </div>

                <VulnerabilityDisplay
                  vulnerabilities={filteredVuls}
                  onVulnerabilityClick={handleVulnerabilityClick}
                />
              </div>
            )}
            {/* Empty State */}
            {!loading && filteredVuls?.length === 0 && !error && (
              <div className='text-center py-5'>
                <i
                  className='bi bi-shield-check text-muted'
                  style={{ fontSize: "3rem" }}
                ></i>
                <h3 className='h5 fw-medium text-dark mt-3 mb-2'>
                  No vulnerabilities found
                </h3>
                <p className='text-muted'>
                  Try adjusting your filters or refresh the data to see the
                  latest vulnerabilities.
                </p>
              </div>
            )}
          </Container>
        </div>

        {showModal && (
          <Modal
            show={true}
            onHide={() => setShowModal(false)}
            title='Dashboard Information'
            size='lg'
            fullscreen='md-down'
          >
            <Modal.Header closeButton>
              <Modal.Title>
                <i className='bi bi-shield-check text-primary me-2'></i>
                About This Dashboard
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <div className='mb-3'>
                <h5 className='mb-3 d-flex align-items-center'></h5>
                <p className='mb-4 text-muted'>
                  This vulnerability dashboard provides monitoring of security
                  vulnerabilities identified recently across multiple package
                  ecosystems including NPM, Maven, and NuGet.
                </p>
                <div className='row g-3'>
                  <div className='col-12 col-md-6'>
                    <div className='card border-0 bg-light'>
                      <div className='card-body p-3'>
                        <h6 className='text-primary mb-3'>
                          <i className='bi bi-star me-2'></i>Features
                        </h6>
                        <ul className='list-unstyled mb-0'>
                          <li className='mb-2'>
                            <i className='bi bi-check-circle text-success me-2'></i>
                            Recent vulnerability data
                          </li>
                          <li className='mb-2'>
                            <i className='bi bi-check-circle text-success me-2'></i>
                            Multi-ecosystem support
                          </li>
                          <li className='mb-2'>
                            <i className='bi bi-check-circle text-success me-2'></i>
                            Advanced filtering
                          </li>
                          <li className='mb-0'>
                            <i className='bi bi-check-circle text-success me-2'></i>
                            Statistics overview
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className='col-12 col-md-6'>
                    <div className='card border-0 bg-light'>
                      <div className='card-body p-3'>
                        <h6 className='text-primary mb-3'>
                          <i className='bi bi-box me-2'></i>Ecosystems
                        </h6>
                        <ul className='list-unstyled mb-0'>
                          <li className='mb-2'>
                            <i className='bi bi-box text-warning me-2'></i>
                            NPM (Node.js)
                          </li>
                          <li className='mb-2'>
                            <i className='bi bi-box text-warning me-2'></i>
                            Maven (Java)
                          </li>
                          <li className='mb-0'>
                            <i className='bi bi-box text-warning me-2'></i>
                            NuGet (.NET)
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Modal.Body>
          </Modal>
        )}

        {showFetchLatestModal && (
          <Modal
            show={true}
            onHide={() => setshowFetchLatestModal(false)}
            title='Fetch Latest Vulnerabilities'
            size='lg'
            fullscreen='md-down'
          >
            <Modal.Header closeButton>
              <Modal.Title>
                <i className='bi bi-gear me-2'></i>
                Fetch Latest Vulnerabilities
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className='border rounded p-3'>
                <Form noValidate onSubmit={fetchLatestVulnerabilities}>
                  <Form.Group controlId='exampleInput'>
                    <Row className='g-3'>
                      <Col sm={12} lg={6}>
                        <Form.Label>Ecosystem</Form.Label>
                        <Form.Select
                          defaultValue='npm'
                          onChange={(e) =>
                            handleLatestQueryFilterChange(
                              "ecosystem",
                              e.target.value
                            )
                          }
                        >
                          <GetEcosystemOptions />
                        </Form.Select>
                      </Col>

                      <Col sm={12} lg={6}>
                        <Form.Label>Duration</Form.Label>
                        <Form.Select
                          defaultValue='week'
                          onChange={(e) =>
                            handleLatestQueryFilterChange(
                              "duration",
                              e.target.value
                            )
                          }
                        >
                          <option value='week'>Last Week</option>
                          <option value='month'>Last Month</option>
                          <option value='today'>Today</option>
                        </Form.Select>
                      </Col>
                    </Row>
                    <Row className='mt-3 mb-3'>
                      <Col sm={12} lg={6}>
                        <Form.Label>API Key</Form.Label>
                        <Form.Control
                          type='password'
                          placeholder='API Key...'
                          value={latestQueryFilter.apiKey}
                          maxLength={50}
                          required
                          isInvalid={!!apiKeyError}
                          onChange={(e) =>
                            handleLatestQueryFilterChange(
                              "apiKey",
                              e.target.value
                            )
                          }
                        />

                        <Form.Control.Feedback type='invalid'>
                          {apiKeyError}
                        </Form.Control.Feedback>
                      </Col>

                      <Col sm={12} lg={6}>
                        <Form.Label>&nbsp;</Form.Label>
                        <Form.Control
                          as='button'
                          type='submit'
                          className='btn btn-primary'
                        >
                          Fetch Latest
                        </Form.Control>
                      </Col>
                    </Row>
                  </Form.Group>
                </Form>
              </div>

              {fetchingLatest && (
                <>
                  <div className='text-center py-5'>
                    <Spinner
                      animation='border'
                      variant='primary'
                      className='me-2'
                    />
                    <span className='text-muted'>
                      Fetchig live vulnerabilities, this may take few minutes...
                    </span>
                  </div>
                </>
              )}
            </Modal.Body>
          </Modal>
        )}

        {showSidebar && (
          <VulnerabilityDetailSidebar
            vulnerability={selectedVulnerability}
            isOpen={showSidebar}
            onClose={handleCloseSidebar}
          />
        )}

        {showMobileModal && (
          <VulnerabilityDetailModal
            vulnerability={selectedVulnerability}
            isOpen={showMobileModal}
            onClose={handleCloseMobileModal}
          />
        )}
      </>
    </Suspense>
  );
};

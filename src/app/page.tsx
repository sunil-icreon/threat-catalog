"use client";

import { useAppStore } from "@/lib/store";
import { STORAGE_KEYS } from "@/utilities/constants";
import { cacheManager } from "@/utilities/util";
import { useEffect, useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Toast,
  ToastContainer
} from "react-bootstrap";
import Header from "../components/Header";
import Modal from "../components/Modal";
import StatsCards from "../components/StatsCards";
import VulnerabilityDisplay from "../components/VulnerabilityDisplay";
import VulnerabilityFiltersComponent from "../components/VulnerabilityFilters";
import {
  IEcoSystemType,
  IRecord,
  ISecerityType,
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
export default function Dashboard() {
  const [vulnerabilities, setVulnerabilities] = useState<IVulnerabilityType[]>(
    []
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

  const { setSubmittedProjectVuls } = useAppStore();
  const [filteredVuls, setFilteredVuls] = useState<IVulnerabilityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VulnerabilityFilters>({});

  const [stats, setStats] = useState({
    ecosystemStats: {} as Record<string, number>,
    durationStats: {} as Record<string, IRecord>,
    severityStats: {} as SeverityStats,
    totalVulnerabilities: 0,
    lastRefresh: new Date().toISOString()
  });
  const [showModal, setShowModal] = useState(false);

  // Handle body scroll when modal opens/closes
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [showModal]);

  const setDataInState = (data: any) => {
    setVulnerabilities(data.vulnerabilities);
    setFilteredVuls(() => data.vulnerabilities);
    setStats({
      ecosystemStats: data.stats.ecosystem,
      durationStats: data.stats.duration,
      severityStats: data.stats.severity,
      totalVulnerabilities: data.total,
      lastRefresh: data.stats.lastRefresh
    });
  };

  const fetchSubmittedPackagesVulnerabilities = async () => {
    const response = await fetch(`/api/vulnerabilities`, {
      method: "POST",
      body: JSON.stringify({ action: "getSubmittedPackagesVulnerabilities" })
    });

    if (!response.ok) {
      setError("Failed to fetch vulnerabilities");
      return;
    }

    let vulListData: Array<any> = await response.json();

    if (vulListData && Array.isArray(vulListData) && vulListData.length > 0) {
      setSubmittedProjectVuls(vulListData);
      return;
    }

    setSubmittedProjectVuls([]);
  };

  const fetchVulnerabilities = async () => {
    try {
      let fromCache = cacheManager.getItem(STORAGE_KEYS.VULNERABILITY_DATA);
      if (fromCache) {
        setDataInState(fromCache);
        setLoading(false);
        setRefreshing(false);
        fetchSubmittedPackagesVulnerabilities();
        return;
      }

      setError(null);

      const response = await fetch(`/api/vulnerabilities`);
      setRefreshing(false);

      if (!response.ok) {
        throw new Error("Failed to fetch vulnerabilities");
      }

      let data: VulnerabilityResponse = await response.json();

      if (data.total > 0) {
        setDataInState(data);
        cacheManager.setItem(STORAGE_KEYS.VULNERABILITY_DATA, data);
        fetchSubmittedPackagesVulnerabilities();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const refreshCache = async () => {
    cacheManager.removeItem(STORAGE_KEYS.VULNERABILITY_DATA);
    setRefreshing(true);
    fetchVulnerabilities();
  };

  const handleFiltersChange = (newFilters: VulnerabilityFilters) => {
    setFilters(newFilters);

    let filteredVulnerabilities: Array<IVulnerabilityType> = vulnerabilities;
    // Apply filters
    if (newFilters.ecosystem) {
      filteredVulnerabilities = filteredVulnerabilities.filter(
        (vul) => vul.ecosystem === newFilters.ecosystem
      );
    }

    if (newFilters.severity) {
      filteredVulnerabilities = filteredVulnerabilities.filter(
        (vul) => vul.severity === newFilters.severity
      );
    }

    if (newFilters.status) {
      filteredVulnerabilities = filteredVulnerabilities.filter(
        (vul) => vul.status === newFilters.status
      );
    }

    if (newFilters.search) {
      const searchTerm = newFilters.search.toLowerCase();
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
    filteredVulnerabilities.sort((a, b) => {
      const severityDiff =
        severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return (
        new Date(b.publishedDate).getTime() -
        new Date(a.publishedDate).getTime()
      );
    });

    setFilteredVuls(() => [...filteredVulnerabilities]);
  };

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
    setRefreshing(false);

    if (!response.ok) {
      if (response.status === 403) {
        setError("Unauthored. API key is required");
      } else {
        setError("Failed to fetch vulnerabilities");
      }

      setshowFetchLatestModal(false);
      return;
    }

    let vulListData: VulnerabilityResponse = await response.json();

    setFetchingLatest(false);
    setshowFetchLatestModal(() => false);

    if (vulListData) {
      setDataInState(vulListData);
      cacheManager.setItem(STORAGE_KEYS.VULNERABILITY_DATA, vulListData);
    }
  };

  useEffect(() => {
    fetchVulnerabilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className='min-vh-100 bg-light'>
        <Header />
        <Container fluid className='py-4'>
          <div className='mb-1'>
            <div className=''>
              <div>
                <Button
                  variant='primary'
                  className='d-flex align-items-center float-right'
                  size='sm'
                  onClick={handleShowFetchModal}
                >
                  <i className={`bi bi-gear me-2 `}></i>
                  Fetch Latest
                </Button>
                <h3 className='fw-bold text-dark mb-0'>
                  Vulnerability Dashboard
                </h3>
                <p className='text-muted d-flex align-items-center'>
                  Monitor security vulnerabilities across NPM, Maven, and NuGet
                  ecosystems
                  <Button variant='outline' onClick={() => setShowModal(true)}>
                    <i className='bi bi-info-circle'></i>
                  </Button>
                </p>
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
          />

          {/* Filters */}
          <VulnerabilityFiltersComponent
            onFiltersChange={handleFiltersChange}
            onRefresh={refreshCache}
            isLoading={refreshing}
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
              <Spinner animation='border' variant='primary' className='me-2' />
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

              <VulnerabilityDisplay vulnerabilities={filteredVuls} />
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
                Try adjusting your filters or refresh the data to see the latest
                vulnerabilities.
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
          <div>
            <h5 className='mb-3 d-flex align-items-center'>
              <i className='bi bi-shield-check text-primary me-2'></i>
              About This Dashboard
            </h5>
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
        </Modal>
      )}

      {showFetchLatestModal && (
        <Modal
          show={true}
          onHide={() => setshowFetchLatestModal(false)}
          title='Fetch Latest Vulnerabilities'
          size='sm'
          fullscreen='md-down'
          className='modal-fetch-vul'
        >
          <div>
            <Form noValidate onSubmit={fetchLatestVulnerabilities}>
              <Form.Group controlId='exampleInput'>
                <Row className='g-3'>
                  <Col sm={12} lg={6}>
                    <Form.Label>Ecosystem</Form.Label>
                    <Form.Select
                      value={filters.ecosystem}
                      onChange={(e) =>
                        handleLatestQueryFilterChange(
                          "ecosystem",
                          e.target.value
                        )
                      }
                    >
                      <option value='npm' selected>
                        NPM
                      </option>
                      <option value='maven'>Maven</option>
                      <option value='nuget'>NuGet</option>
                    </Form.Select>
                  </Col>

                  <Col sm={12} lg={6}>
                    <Form.Label>Duration</Form.Label>
                    <Form.Select
                      value={filters.ecosystem}
                      onChange={(e) =>
                        handleLatestQueryFilterChange(
                          "duration",
                          e.target.value
                        )
                      }
                    >
                      <option value='week' selected>
                        Last Week
                      </option>
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
                      maxLength={50}
                      required
                      isInvalid={!!apiKeyError}
                      value={filters.search}
                      onChange={(e) =>
                        handleLatestQueryFilterChange("apiKey", e.target.value)
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
                      onClick={fetchLatestVulnerabilities}
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
        </Modal>
      )}
    </>
  );
}

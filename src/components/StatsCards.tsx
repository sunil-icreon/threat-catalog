import { useAppStore } from "@/lib/store";
import {
  IEcoSystemType,
  IRecord,
  IVulnerabilityType,
  SeverityStats,
  VulnerabilityFilters
} from "@/types/vulnerability";
import {
  ECOSYSTEM_LIST,
  ECOSYSTEM_NAME,
  STORAGE_KEYS
} from "@/utilities/constants";
import {
  cacheManager,
  formatRelativeTime,
  sortedObjectByKey
} from "@/utilities/util";
import { useRouter } from "next/navigation";
import { Fragment, memo, useMemo } from "react";
import { Card, Col, Row } from "react-bootstrap";
import semver from "semver";
import { ProjectInfo } from "./PackageUploader";
import { CountPill, SeverityCount } from "./shared/UtilityComponents";
import VulnerabilityDisplay from "./VulnerabilityDisplay";

interface StatsCardsProps {
  ecosystemStats: Record<string, number>;
  severityStats: SeverityStats;
  durationStats: Record<string, IRecord>;
  totalVulnerabilities: number;
  lastUpdate: string;
  vulnerabilities: Array<IVulnerabilityType>;
  onVulnerabilityClick?: (vulnerability: IVulnerabilityType) => void;
}

interface IRenderStatCardProps {
  label: string;
  countStat: Record<string, number>;
  ecosystemStats: Record<string, number>;
  total: number;
  variant: "critical" | "high" | "medium" | "low";
}

// eslint-disable-next-line react/display-name
const RenderStatCard = memo((props: IRenderStatCardProps) => {
  const { countStat, total, variant } = props;
  return (
    <SeverityCount
      count={countStat.total}
      total={total}
      variant={variant}
      showPercentage={true}
    />
  );
});

// eslint-disable-next-line react/display-name
const RenderEcoSystemCards = memo(
  (props: {
    ecosystemStats: IRecord;
    durationStats: Record<string, IRecord>;
    severityStats: SeverityStats;
  }) => {
    const { ecosystemStats, durationStats, severityStats } = props;
    const router = useRouter();
    const { setThreatFilter, selectedEcosystems } = useAppStore();

    const handleClick = (ecosystem: string) => {
      let newFilter: VulnerabilityFilters = {
        ecosystem: ecosystem
      };

      setThreatFilter(newFilter);

      const params = new URLSearchParams(window.location.search);
      params.set("ecosystem", ecosystem);
      router.replace(`?${params.toString()}`, { scroll: false });
    };

    const sortedEcoSystemStat = useMemo(() => {
      return sortedObjectByKey(ecosystemStats);
    }, [ecosystemStats]);

    return (
      <>
        {Object.entries(sortedEcoSystemStat).map(([ecosystem, count]) => {
          const ecoSystemDuration = durationStats[ecosystem];

          if (!ecoSystemDuration || !selectedEcosystems.includes(ecosystem)) {
            return <Fragment key={ecosystem}></Fragment>;
          }

          const { fetchedAt, duration } = ecoSystemDuration;

          return (
            <Col md={6} lg={3} key={ecosystem}>
              <Card className='custom-card stat-card h-100'>
                <Card.Body className='d-flex flex-column h-100'>
                  {/* Top section with ecosystem info */}
                  <div className='d-flex flex-column gap-1'>
                    <div className='d-flex justify-content-between align-items-center mb-2'>
                      <div>
                        <p className='text-muted  mb-1 small'>Ecosystem</p>
                        <h3 className='mb-0'>
                          <span>{ECOSYSTEM_NAME[ecosystem] ?? ecosystem}</span>
                        </h3>
                      </div>
                      <div
                        className='p-3 bg-success bg-opacity-10 rounded-circle cursor-pointer'
                        data-role='button'
                        title={`View ${ecosystem?.toUpperCase()} vulnerabilities`}
                        onClick={handleClick.bind(this, ecosystem)}
                      >
                        {count}
                      </div>
                    </div>
                  </div>

                  {/* Middle section with severity stats */}
                  <div
                    key={ecosystem}
                    className='justify-content-between small flex-grow-1'
                  >
                    <span className='text-muted text-capitalize'>
                      {severityStats.CRITICAL?.[ecosystem] > 0 && (
                        <SeverityCount
                          count={severityStats.CRITICAL[ecosystem]}
                          total={count}
                          variant='critical'
                          showPercentage={true}
                          ecosystem={ecosystem as IEcoSystemType}
                        />
                      )}

                      {severityStats.HIGH?.[ecosystem] > 0 && (
                        <SeverityCount
                          count={severityStats.HIGH[ecosystem]}
                          total={count}
                          variant='high'
                          showPercentage={true}
                          ecosystem={ecosystem as IEcoSystemType}
                        />
                      )}
                      {severityStats.MEDIUM?.[ecosystem] > 0 && (
                        <SeverityCount
                          count={severityStats.MEDIUM[ecosystem]}
                          total={count}
                          variant='medium'
                          showPercentage={true}
                          ecosystem={ecosystem as IEcoSystemType}
                        />
                      )}
                      {severityStats.LOW?.[ecosystem] > 0 && (
                        <SeverityCount
                          count={severityStats.LOW[ecosystem]}
                          total={count}
                          variant='low'
                          showPercentage={true}
                          ecosystem={ecosystem as IEcoSystemType}
                        />
                      )}
                    </span>
                  </div>

                  {/* Bottom section with scan info - always at bottom */}
                  <div className='text-muted small mt-auto border-top'>
                    <span className='small'>
                      Scanned <strong>{formatRelativeTime(fetchedAt)}</strong>{" "}
                      for last <strong>{duration}</strong> day
                      {duration > 1 ? "s" : ""}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </>
    );
  }
);

type EcosystemData = Record<string, number>;
type SeverityData = Record<string, EcosystemData>;

export default function StatsCards({
  ecosystemStats,
  severityStats,
  durationStats,
  totalVulnerabilities,
  vulnerabilities
}: StatsCardsProps) {
  const { setThreatFilter, selectedEcosystems } = useAppStore();
  const router = useRouter();

  const handleClick = () => {
    setThreatFilter({});

    router.replace("/", { scroll: false });
  };

  const { foundCount, foundVuls } = useMemo(() => {
    const lastAnalyzed: ProjectInfo | null = cacheManager.getItem(
      STORAGE_KEYS.LAST_ANALYZED_PROJECT
    );
    if (lastAnalyzed) {
      const targetMap = new Map<string, any[]>();
      for (const t of vulnerabilities) {
        if (!targetMap.has(t.packageName)) targetMap.set(t.packageName, []);
        targetMap.get(t.packageName)!.push(t);
      }

      const matchedTargets: any[] = [];

      for (const s of lastAnalyzed.packages) {
        const targets = targetMap.get(s.name) ?? [];
        for (const t of targets) {
          if (semver.satisfies(s.version, t.version)) {
            matchedTargets.push(t);
          }
        }
      }

      if (matchedTargets.length > 0) {
        return {
          foundCount: matchedTargets.length,
          foundVuls: {
            name: lastAnalyzed.name,
            version: lastAnalyzed.version,
            matchedVuls: matchedTargets
          }
        };
      }
    }

    return {
      foundCount: 0,
      foundVuls: null
    };
  }, [vulnerabilities]);

  function filterEcosystemTotals(data: SeverityData, ecosystemArray: string[]) {
    const result: SeverityData = {};

    for (const [severity, values] of Object.entries(data)) {
      // Clone the severity data
      const updated: EcosystemData = { ...values };

      let newTotal = values.total;

      // Subtract values for ecosystems not in the array
      for (const [eco, count] of Object.entries(values)) {
        if (eco !== "total" && !ecosystemArray.includes(eco)) {
          newTotal -= count;
        }
      }

      updated.total = newTotal;
      result[severity] = updated;
    }

    return result;
  }

  const { criticalStat, highStat, mediumStat, lowStat, total } = useMemo(() => {
    if (selectedEcosystems.length <= ECOSYSTEM_LIST.length) {
      const filteredStats = filterEcosystemTotals(
        severityStats,
        selectedEcosystems
      );

      if (filteredStats) {
        return {
          criticalStat: filteredStats.CRITICAL,
          highStat: filteredStats.HIGH,
          mediumStat: filteredStats.MEDIUM,
          lowStat: filteredStats.LOW,
          total: Object.values(filteredStats).reduce(
            (sum, severityData) => sum + severityData.total,
            0
          )
        };
      }
    }

    return {
      criticalStat: severityStats.CRITICAL,
      highStat: severityStats.HIGH,
      mediumStat: severityStats.MEDIUM,
      lowStat: severityStats.LOW,
      total: totalVulnerabilities
    };
  }, [severityStats, selectedEcosystems]);

  return (
    <Row className='g-4 mb-4'>
      {totalVulnerabilities > 0 && (
        <Col md={6} lg={3}>
          <Card className='custom-card small stat-card'>
            <Card.Body>
              <div className='d-flex justify-content-between align-items-center mb-3'>
                <div>
                  <p className='text-muted mb-1 small'>Total Vulnerabilities</p>
                  <h3 className='mb-0'>{total}</h3>
                </div>
                <div
                  className='p-3 bg-primary bg-opacity-10 rounded-circle cursor-pointer'
                  title='View all vulnerabilities'
                  data-role='button'
                  onClick={handleClick}
                >
                  <i className='bi bi-shield-check text-primary fs-4'></i>
                </div>
              </div>

              {criticalStat?.total > 0 && (
                <RenderStatCard
                  countStat={criticalStat}
                  ecosystemStats={ecosystemStats}
                  variant='critical'
                  label='Critical'
                  total={totalVulnerabilities}
                />
              )}

              {highStat?.total > 0 && (
                <RenderStatCard
                  countStat={highStat}
                  ecosystemStats={ecosystemStats}
                  variant='high'
                  label='High Severity'
                  total={totalVulnerabilities}
                />
              )}

              {mediumStat?.total > 0 && (
                <RenderStatCard
                  countStat={mediumStat}
                  ecosystemStats={ecosystemStats}
                  variant='medium'
                  label='Medium Severity'
                  total={totalVulnerabilities}
                />
              )}

              {lowStat?.total > 0 && (
                <RenderStatCard
                  countStat={lowStat}
                  ecosystemStats={ecosystemStats}
                  variant='low'
                  label='Low Severity'
                  total={totalVulnerabilities}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      )}

      <RenderEcoSystemCards
        durationStats={durationStats}
        ecosystemStats={ecosystemStats}
        severityStats={severityStats}
      />

      {foundCount > 0 && foundVuls && (
        <Col md={12}>
          <Card className='custom-card vul-in-project-card'>
            <Card.Body>
              <div className='d-flex justify-content-between align-items-center mb-2'>
                <div>
                  <h6 className='mb-1 text-danger'>
                    Vulnerabilities found in last analyzed package
                  </h6>
                </div>
              </div>

              <div className='d-flex flex-column gap-1'>
                <div className='d-flex gap-3 flex-wrap'>
                  <CountPill
                    count={foundVuls.name}
                    label={<b>Project Name</b>}
                    variant='grey'
                  />

                  <CountPill
                    count={foundCount}
                    label={<b>Vulnerabilities</b>}
                    variant='grey'
                  />
                </div>

                <VulnerabilityDisplay vulnerabilities={foundVuls.matchedVuls} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      )}
    </Row>
  );
}

import { useAppStore } from "@/lib/store";
import {
  IEcoSystemType,
  IRecord,
  IVulnerabilityType,
  SeverityStats,
  VulnerabilityFilters
} from "@/types/vulnerability";
import { ECOSYSTEM_LIST, ECOSYSTEM_NAME } from "@/utilities/constants";
import { sortedObjectByKey } from "@/utilities/util";
import { useRouter } from "next/navigation";
import { Fragment, memo, useMemo } from "react";
import { Card, Col, Row } from "react-bootstrap";

import { RelativeTimeDisplay } from "./shared/RelativeTimeDisplay";
import { SeverityCount } from "./shared/UtilityComponents";

interface StatsCardsProps {
  ecosystemStats: Record<string, number>;
  severityStats: SeverityStats;
  durationStats: Record<string, IRecord>;
  totalVulnerabilities: number;
  lastUpdate: string;
  vulnerabilities: Array<IVulnerabilityType>;
  resultKey: number;
  onVulnerabilityClick?: (vulnerability: IVulnerabilityType) => void;
}

interface IRenderStatCardProps {
  label: string;
  countStat: Record<string, number>;
  ecosystemStats: Record<string, number>;
  total: number;
  variant: "critical" | "high" | "medium" | "low";
  threatFilter?: VulnerabilityFilters;
}

// eslint-disable-next-line react/display-name
const RenderStatCard = memo((props: IRenderStatCardProps) => {
  const { countStat, total, variant, threatFilter } = props;
  return (
    <SeverityCount
      count={countStat.total}
      total={total}
      variant={variant}
      showPercentage={true}
      threatFilter={threatFilter}
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
    const { setThreatFilter, selectedEcosystems, threatFilter } = useAppStore();

    const handleClick = (ecosystem: string) => {
      let newFilter: VulnerabilityFilters = {
        ecosystem: ecosystem,
        severity: ""
      };

      setThreatFilter(newFilter);
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

          const isSelected = threatFilter?.ecosystem === ecosystem;

          return (
            <Col md={6} lg={3} key={ecosystem}>
              <Card
                className={`custom-card stat-card h-100 ${
                  isSelected ? "border-primary border-3 shadow-sm" : ""
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: "rgba(13, 110, 253, 0.05)"
                      }
                    : {}
                }
              >
                <Card.Body className='d-flex flex-column h-100'>
                  <div className='d-flex flex-column gap-1'>
                    <div className='d-flex justify-content-between align-items-center mb-2'>
                      <div>
                        <p className='mb-1 small' style={{ color: "#495057" }}>
                          Ecosystem
                        </p>
                        <h3 className='mb-0'>
                          <span>{ECOSYSTEM_NAME[ecosystem] ?? ecosystem}</span>
                        </h3>
                      </div>
                      <div
                        className='p-3 bg-success bg-opacity-10 rounded-circle cursor-pointer'
                        data-role='button'
                        title={`View ${ecosystem?.toUpperCase()} vulnerabilities`}
                        onClick={handleClick.bind(this, ecosystem)}
                        style={{ color: "#198754", fontWeight: "bold" }}
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
                    <span
                      className='text-capitalize'
                      style={{ color: "#495057" }}
                    >
                      {severityStats.CRITICAL?.[ecosystem] > 0 && (
                        <SeverityCount
                          count={severityStats.CRITICAL[ecosystem]}
                          total={count}
                          variant='critical'
                          showPercentage={true}
                          ecosystem={ecosystem as IEcoSystemType}
                          threatFilter={threatFilter}
                        />
                      )}

                      {severityStats.HIGH?.[ecosystem] > 0 && (
                        <SeverityCount
                          count={severityStats.HIGH[ecosystem]}
                          total={count}
                          variant='high'
                          showPercentage={true}
                          ecosystem={ecosystem as IEcoSystemType}
                          threatFilter={threatFilter}
                        />
                      )}
                      {severityStats.MEDIUM?.[ecosystem] > 0 && (
                        <SeverityCount
                          count={severityStats.MEDIUM[ecosystem]}
                          total={count}
                          variant='medium'
                          showPercentage={true}
                          ecosystem={ecosystem as IEcoSystemType}
                          threatFilter={threatFilter}
                        />
                      )}
                      {severityStats.LOW?.[ecosystem] > 0 && (
                        <SeverityCount
                          count={severityStats.LOW[ecosystem]}
                          total={count}
                          variant='low'
                          showPercentage={true}
                          ecosystem={ecosystem as IEcoSystemType}
                          threatFilter={threatFilter}
                        />
                      )}
                    </span>
                  </div>

                  {/* Bottom section with scan info - always at bottom */}
                  <div
                    className='small mt-auto border-top'
                    style={{ color: "#495057" }}
                  >
                    <RelativeTimeDisplay fetchedAt={fetchedAt} duration={duration} />
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
  resultKey
}: StatsCardsProps) {
  const { setThreatFilter, selectedEcosystems, threatFilter } = useAppStore();
  const router = useRouter();

  const handleClick = () => {
    setThreatFilter({});
    router.push("/", { scroll: false });
  };

  function filterEcosystemTotals(data: SeverityData, ecosystemArray: string[]) {
    if (!data) {
      return {};
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severityStats, selectedEcosystems, totalVulnerabilities, resultKey]);

  return (
    <Row className='g-4 mb-4'>
      {totalVulnerabilities > 0 && (
        <Col md={6} lg={3}>
          <Card className='custom-card small stat-card'>
            <Card.Body>
              <div className='d-flex justify-content-between align-items-center mb-3'>
                <div>
                  <p className='mb-1 small' style={{ color: "#495057" }}>
                    Total Vulnerabilities
                  </p>
                  <h3 className='mb-0'>{total}</h3>
                </div>
                <div
                  className='p-3 bg-primary bg-opacity-10 rounded-circle cursor-pointer'
                  title='View all vulnerabilities'
                  data-role='button'
                  onClick={handleClick}
                >
                  <i
                    className='bi bi-shield-check fs-4'
                    style={{ color: "#0d6efd" }}
                  ></i>
                </div>
              </div>

              {criticalStat?.total > 0 && (
                <RenderStatCard
                  countStat={criticalStat}
                  ecosystemStats={ecosystemStats}
                  variant='critical'
                  label='Critical'
                  total={totalVulnerabilities}
                  threatFilter={threatFilter}
                />
              )}

              {highStat?.total > 0 && (
                <RenderStatCard
                  countStat={highStat}
                  ecosystemStats={ecosystemStats}
                  variant='high'
                  label='High Severity'
                  total={totalVulnerabilities}
                  threatFilter={threatFilter}
                />
              )}

              {mediumStat?.total > 0 && (
                <RenderStatCard
                  countStat={mediumStat}
                  ecosystemStats={ecosystemStats}
                  variant='medium'
                  label='Medium Severity'
                  total={totalVulnerabilities}
                  threatFilter={threatFilter}
                />
              )}

              {lowStat?.total > 0 && (
                <RenderStatCard
                  countStat={lowStat}
                  ecosystemStats={ecosystemStats}
                  variant='low'
                  label='Low Severity'
                  total={totalVulnerabilities}
                  threatFilter={threatFilter}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      )}

      <RenderEcoSystemCards
        key={resultKey}
        durationStats={durationStats}
        ecosystemStats={ecosystemStats}
        severityStats={severityStats}
      />
    </Row>
  );
}

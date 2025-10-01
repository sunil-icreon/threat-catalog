import { ISubmittedProjectVulType, useAppStore } from "@/lib/store";
import {
  IEcoSystemType,
  IRecord,
  IVulnerabilityType,
  SeverityStats,
  VulnerabilityFilters
} from "@/types/vulnerability";
import { EPSSData, formatRelativeTime } from "@/utilities/util";
import { memo, useMemo } from "react";
import { Badge, Card, Col, Row, Table } from "react-bootstrap";
import { RenderEPSS, SeverityCount } from "./shared/UtilityComponents";
import { severityVariants } from "./VulnerabilityCard";

interface StatsCardsProps {
  ecosystemStats: Record<string, number>;
  severityStats: SeverityStats;
  durationStats: Record<string, IRecord>;
  totalVulnerabilities: number;
  lastUpdate: string;
  vulnerabilities: Array<IVulnerabilityType>;
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
  const { countStat, total, variant, ecosystemStats } = props;
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

    const { setThreatFilter } = useAppStore();
    const handleClick = (ecosystem: string) => {
      let newFilter: VulnerabilityFilters = {
        ecosystem: ecosystem
      };

      setThreatFilter(newFilter);
    };

    return (
      <>
        {Object.entries(ecosystemStats).map(([ecosystem, count]) => {
          const ecoSystemDuration = durationStats[ecosystem];

          if (!ecoSystemDuration) {
            return <></>;
          }

          const { fetchedAt, duration } = ecoSystemDuration;

          return (
            <Col md={6} lg={3} key={ecosystem}>
              <Card className='custom-card stat-card'>
                <Card.Body>
                  <div className='d-flex flex-column gap-1'>
                    <div className='d-flex justify-content-between align-items-center mb-2'>
                      <div>
                        <p className='text-muted  mb-1 small'>Ecosystem</p>
                        <h3 className='mb-0 text-uppercase'>
                          <span>{ecosystem}</span>
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

                  <div
                    key={ecosystem}
                    className='justify-content-between small'
                  >
                    <span className='text-muted text-capitalize'>
                      {severityStats.CRITICAL[ecosystem] > 0 && (
                        <SeverityCount
                          count={severityStats.CRITICAL[ecosystem]}
                          total={count}
                          variant='critical'
                          showPercentage={true}
                          ecosystem={ecosystem as IEcoSystemType}
                        />
                      )}

                      {severityStats.HIGH[ecosystem] > 0 && (
                        <SeverityCount
                          count={severityStats.HIGH[ecosystem]}
                          total={count}
                          variant='high'
                          showPercentage={true}
                          ecosystem={ecosystem as IEcoSystemType}
                        />
                      )}
                      {severityStats.MEDIUM[ecosystem] > 0 && (
                        <SeverityCount
                          count={severityStats.MEDIUM[ecosystem]}
                          total={count}
                          variant='medium'
                          showPercentage={true}
                          ecosystem={ecosystem as IEcoSystemType}
                        />
                      )}
                      {severityStats.LOW[ecosystem] > 0 && (
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

                  <div className='text-muted small mt-3'>
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

export default function StatsCards({
  ecosystemStats,
  severityStats,
  totalVulnerabilities,
  lastUpdate,
  durationStats,
  vulnerabilities
}: StatsCardsProps) {
  const criticalStat = severityStats.CRITICAL;
  const highStat = severityStats.HIGH;
  const mediumStat = severityStats.MEDIUM;
  const lowStat = severityStats.LOW;

  const { setThreatFilter, submittedProjectVuls } = useAppStore();
  const handleClick = () => {
    setThreatFilter({});
  };

  const { foundCount, foundVuls } = useMemo(() => {
    const foundInProject = submittedProjectVuls.map(
      (vul: ISubmittedProjectVulType) => vul
    );

    return {
      foundCount: foundInProject.length,
      foundVuls: foundInProject
    };
  }, [submittedProjectVuls]);

  return (
    <Row className='g-4 mb-4'>
      {totalVulnerabilities > 0 && (
        <Col md={6} lg={3}>
          <Card className='custom-card small stat-card'>
            <Card.Body>
              <div className='d-flex justify-content-between align-items-center mb-3'>
                <div>
                  <p className='text-muted mb-1 small'>Total Vulnerabilities</p>
                  <h3 className='mb-0'>{totalVulnerabilities}</h3>
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

      {foundCount > 0 && (
        <Col md={12}>
          <Card className='custom-card vul-in-project-card'>
            <Card.Body>
              <div className='d-flex justify-content-between align-items-center mb-2'>
                <div>
                  <h6 className='mb-1 text-danger'>
                    Analyzed Packages Vulnerabilities ({foundCount})
                  </h6>
                </div>
              </div>

              <div className='d-flex flex-column gap-1'>
                <div className='table-responsive  rounded'>
                  <Table striped size='sm' hover className='mb-0 table-hover'>
                    <thead className='table-dark'>
                      <tr>
                        <th style={{ width: "200px" }}>Project Name</th>
                        <th>Summary</th>
                        <th style={{ width: "250px" }}>Package</th>
                        <th style={{ width: "80px" }}>Severity</th>
                        <th style={{ width: "80px" }}>EPSS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {foundVuls.map((proj: ISubmittedProjectVulType) => {
                        return (
                          <>
                            {proj.matchedVuls.map((vul: IVulnerabilityType) => {
                              return (
                                <tr key={proj.name}>
                                  <td rowSpan={proj.matchedVuls.length}>
                                    <span className='text-muted small'>
                                      {proj.name}
                                    </span>
                                  </td>
                                  <td className='small'>{vul.summary}</td>
                                  <td>{vul.packageName}</td>

                                  <td>
                                    <Badge
                                      bg={severityVariants[vul.severity]}
                                      className='text-capitalize me-2 w-70-px severity-badge'
                                    >
                                      {vul.severity}
                                    </Badge>
                                  </td>
                                  <td>
                                    <RenderEPSS
                                      epss={vul.epss as EPSSData}
                                      displayType='table'
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      )}
    </Row>
  );
}

import { useAppStore } from "@/lib/store";
import { IEcoSystemType, VulnerabilityFilters } from "@/types/vulnerability";
import { EPSSData, getEPSSRisk } from "@/utilities/util";
import { ReactNode, useMemo } from "react";
import { Badge } from "react-bootstrap";
import { severityVariants } from "../VulnerabilityCard";

interface ICountPillProps {
  label: string | ReactNode;
  count: number | string;
  variant: "critical" | "high" | "medium" | "low" | "grey";
  className?: string;
}
export const CountPill = (props: ICountPillProps) => {
  const { label, count, variant, className } = props;
  return (
    <div className={`vul-pill vul-pill-${variant} ${className}`}>
      <div className='label'>{label}</div>
      <div className='value'>{count}</div>
    </div>
  );
};

interface ISeverityCountProps {
  label?: string;
  count: number;
  total: number;
  variant: "critical" | "high" | "medium" | "low";
  ecosystem?: IEcoSystemType;
  showPercentage?: boolean;
}
export const SeverityCount = (props: ISeverityCountProps) => {
  const { label, count, total, variant, showPercentage, ecosystem } = props;
  const { setThreatFilter } = useAppStore();

  const displayLabel = useMemo(() => {
    switch (variant) {
      case "critical":
        return "Critical";
      case "high":
        return "High";
      case "medium":
        return "Medium";
      case "low":
        return "Low";
      default:
        return label ?? "";
    }
  }, [variant, label]);

  const handleClick = () => {
    let newFilter: VulnerabilityFilters = {
      severity: variant?.toUpperCase(),
      ecosystem: ecosystem ?? ""
    };

    setThreatFilter(newFilter);
  };

  return (
    <div
      className='d-flex justify-content-between cursor-pointer severity-item'
      data-role='button'
      onClick={handleClick}
    >
      <span className={`text-${variant} text-capitalize`}>
        <strong
          style={{
            fontFamily: "monospace",
            whiteSpace: "pre"
          }}
        >
          {String(count).padStart(3, "  ")}
        </strong>{" "}
        {displayLabel}
      </span>

      {showPercentage && (
        <span className='text-muted small ms-3'>
          ({count > 0 ? Math.round((count / total) * 100) : 0}% of total)
        </span>
      )}
    </div>
  );
};

interface IEPSSProps {
  epss: EPSSData;
  displayType: "table" | "card";
}
export const RenderEPSS = (props: IEPSSProps) => {
  const { epss, displayType } = props;

  const epssData = getEPSSRisk(epss);

  if (displayType === "card") {
    return (
      <Badge
        bg={severityVariants[epssData.risk]}
        className={`text-capitalize small`}
      >
        EPSS:{epssData.score}%
      </Badge>
    );
  }

  return (
    <div
      className={`small text-${epssData.risk.toLocaleLowerCase()}`}
      title={`${epssData.risk} Risk`}
    >
      {epssData.score}%
    </div>
  );
};

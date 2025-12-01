import { useAppStore } from "@/lib/store";
import {
  IEcoSystemType,
  ILabelValueType,
  IVariantType,
  VulnerabilityFilters
} from "@/types/vulnerability";
import { ECOSYSTEM_LIST } from "@/utilities/constants";
import { EPSSData, getEPSSRisk } from "@/utilities/util";
import { memo, ReactNode, useMemo } from "react";
import { Badge } from "react-bootstrap";

interface ICountPillProps {
  label?: string | ReactNode;
  count: number | string | ReactNode;
  variant: IVariantType;
  className?: string;
}
export const CountPill = memo((props: ICountPillProps) => {
  const { label, count, variant, className } = props;
  return (
    <div
      className={`vul-pill vul-pill-${variant} ${className} ${
        !label ? "no-label-pill" : ""
      }`}
    >
      {label && <div className='label'>{label}</div>}
      <div className='value'>{count}</div>
    </div>
  );
});

CountPill.displayName = "CountPill";

interface ISeverityCountProps {
  label?: string;
  count: number;
  total: number;
  variant: IVariantType;
  ecosystem?: IEcoSystemType;
  showPercentage?: boolean;
  threatFilter?: VulnerabilityFilters;
}
export const SeverityCount = (props: ISeverityCountProps) => {
  const {
    label,
    count,
    total,
    variant,
    showPercentage,
    ecosystem,
    threatFilter
  } = props;
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

  // Check if this severity is selected
  const isSelected =
    threatFilter?.severity === variant.toUpperCase() &&
    (!ecosystem ||
      threatFilter?.ecosystem === ecosystem ||
      !threatFilter?.ecosystem);

  return (
    <div
      className={`d-flex justify-content-between cursor-pointer severity-item ${
        isSelected ? "border-start border-primary border-3 ps-2 rounded" : ""
      }`}
      data-role='button'
      onClick={handleClick}
      style={
        isSelected
          ? {
              backgroundColor: "rgba(13, 110, 253, 0.08)",
              fontWeight: "600"
            }
          : {}
      }
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
SeverityCount.displayName = "SeverityCount";
interface IEPSSProps {
  epss: EPSSData;
  displayType: "table" | "card";
}
export const RenderEPSS = memo((props: IEPSSProps) => {
  const { epss, displayType } = props;

  const epssData = getEPSSRisk(epss);

  if (displayType === "card") {
    return (
      <Badge bg='outline' className='ecosystem-maven text-capitalize small'>
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
});

RenderEPSS.displayName = "RenderEPSS";

interface IAffectedPillProps {
  affectedVersions: Array<string> | undefined;
  label?: string;
  variant?: IVariantType;
  className?: string;
}
export const RenderAffectedPill = (props: IAffectedPillProps) => {
  const {
    affectedVersions,
    className,
    label = "Affected",
    variant = "grey"
  } = props;

  if (!affectedVersions) {
    return <></>;
  }

  return (
    <CountPill
      count={
        <div className='affected-list'>
          {affectedVersions?.filter(Boolean).map((aff: string) => {
            return aff.split(",").map((affected: string) => (
              <div key={affected} className='affected-divider'>
                {affected}
              </div>
            ));
          })}
        </div>
      }
      label={label}
      variant={variant}
      className={className}
    />
  );
};

// eslint-disable-next-line react/display-name
export const GetEcosystemOptions = memo(() => {
  const { selectedEcosystems } = useAppStore();
  let options: Array<ReactNode> = [
    <option key='all' value=''>
      All Ecosystems
    </option>
  ];

  const optionList = useMemo(() => {
    if (!selectedEcosystems || selectedEcosystems.length === 0) {
      return ECOSYSTEM_LIST;
    }

    return ECOSYSTEM_LIST.filter((ecos: ILabelValueType) =>
      selectedEcosystems.includes(ecos.value as string)
    );
  }, [selectedEcosystems]);

  return [
    ...options,
    optionList.map((eco: ILabelValueType) => (
      <option key={eco.value} value={eco.value}>
        {eco.label}
      </option>
    ))
  ];
});

interface IAffectedVersionTagsProps {
  affectedVersions: string[];
}

export const AffectedVersionTags = memo((props: IAffectedVersionTagsProps) => {
  const { affectedVersions } = props;
  return (
    <div className='affected-list d-flex flex-wrap gap-1'>
      {affectedVersions.filter(Boolean).map((aff: string) => {
        return aff.split(",").map((affected: string) => (
          <code className='version vulnerable me-1' key={affected}>
            {affected}
          </code>
        ));
      })}
    </div>
  );
});

AffectedVersionTags.displayName = "AffectedVersionTags";

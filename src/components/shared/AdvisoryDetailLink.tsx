import { IVulnerabilityType } from "@/types/vulnerability";
import { memo, useCallback } from "react";
import { Button } from "react-bootstrap";

interface IAdvisoryDetailLinkProps {
  vulnerability: IVulnerabilityType;
  onVulnerabilityClick?: (vulnerability: IVulnerabilityType) => void;
}
export const AdvisoryDetailLink = memo((props: IAdvisoryDetailLinkProps) => {
  const { vulnerability, onVulnerabilityClick } = props;

  const handleClick = useCallback(
    (e: any) => {
      e.preventDefault();
      onVulnerabilityClick && onVulnerabilityClick(vulnerability);
    },
    [vulnerability, onVulnerabilityClick]
  );

  return (
    <>
      <Button
        variant='link'
        type='button'
        className='p-0 text-decoration-none alt-link b small text-left me-3'
        onClick={handleClick}
        style={{ userSelect: "text" }}
      >
        <span className='break-all small'>{vulnerability.summary}</span>
      </Button>
    </>
  );
});

AdvisoryDetailLink.displayName = "AdvisoryDetailLink";

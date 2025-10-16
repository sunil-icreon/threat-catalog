import { IVulnerabilityType } from "@/types/vulnerability";
import { Button } from "react-bootstrap";

interface IAdvisoryDetailLinkProps {
  vulnerability: IVulnerabilityType;
  onVulnerabilityClick?: (vulnerability: IVulnerabilityType) => void;
}
export const AdvisoryDetailLink = (props: IAdvisoryDetailLinkProps) => {
  const { vulnerability, onVulnerabilityClick } = props;

  const handleClick = (e: any) => {
    e.preventDefault();
    onVulnerabilityClick && onVulnerabilityClick(vulnerability);
  };
  return (
    <>
      <Button
        variant='link'
        type='button'
        className='p-0 text-decoration-none alt-link b small text-left me-3 mb-2'
        onClick={handleClick}
        style={{ userSelect: "text" }}
      >
        <span className='break-all small'>{vulnerability.summary}</span>
      </Button>
    </>
  );
};

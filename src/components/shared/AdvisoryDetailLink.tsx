import { ReactNode, useMemo } from "react";
import { Button } from "react-bootstrap";

interface IAdvisoryDetailLinkProps {
  source: "OSV" | "Synk" | "GHSA";
  id: string;
  label: string | ReactNode;
}
export const AdvisoryDetailLink = (props: IAdvisoryDetailLinkProps) => {
  const { source, id, label } = props;

  const url = useMemo(() => {
    switch (source) {
      case "OSV":
        return `https://osv.dev/vulnerability/${id}`;

      default:
        return `https://github.com/advisories/${id}`;
    }
  }, [source, id]);

  return (
    <Button
      variant='link'
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      className='p-0 text-decoration-none small alt-link text-left'
      size='sm'
    >
      <span className='break-all'>{label}</span>
    </Button>
  );
};

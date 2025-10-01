import { useMemo } from "react";
import { Button } from "react-bootstrap";

interface IPackageDetailLinkProps {
  ecoSystem: string;
  packageName: string;
}
export const PackageDetailLink = (props: IPackageDetailLinkProps) => {
  const { ecoSystem, packageName } = props;

  const url = useMemo(() => {
    switch (ecoSystem) {
      case "npm":
        return `https://www.npmjs.com/package/${packageName}`;

      case "Maven":
        return `https://mvnrepository.com/artifact/${packageName.replace(
          ":",
          "/"
        )}`;

      case "NuGet":
        return `https://www.nuget.org/packages/${packageName}`;
    }
  }, [ecoSystem, packageName]);

  return (
    <Button
      variant='link'
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      className='p-0 text-decoration-none small package-name-cell-content small'
      size='sm'
    >
      {/* <i className='bi bi-box-arrow-up-right me-1'></i> */}
      <span className='break-all'>{packageName}</span>
    </Button>
  );
};

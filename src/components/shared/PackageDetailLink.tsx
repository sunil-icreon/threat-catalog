import { useMemo } from "react";

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

      case "maven":
        return `https://mvnrepository.com/artifact/${packageName.replace(
          ":",
          "/"
        )}`;

      case "nuget":
        return `https://www.nuget.org/packages/${packageName}`;
    }
  }, [ecoSystem, packageName]);

  return (
    <a
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      className='p-0 text-decoration-none small package-name-cell-content small'
    >
      <span className='break-all'>{packageName}</span>
    </a>
  );
};

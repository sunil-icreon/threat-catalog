import { IEcoSystemType } from "@/types/vulnerability";
import { getPackageURL } from "@/utilities/util";
import { memo, useMemo } from "react";

interface IPackageDetailLinkProps {
  ecoSystem: string;
  packageName: string;
  label?: string;
  version?: string;
  className?: string;
}
export const PackageDetailLink = memo((props: IPackageDetailLinkProps) => {
  const { ecoSystem, packageName, version, label, className } = props;

  const url = useMemo(() => {
    return getPackageURL(ecoSystem as IEcoSystemType, packageName, version);
  }, [ecoSystem, packageName, version]);

  return (
    <a
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      className={
        className ??
        `p-0 text-decoration-none small package-name-cell-content small`
      }
    >
      <span className='break-all'>{label ?? packageName}</span>
    </a>
  );
});

PackageDetailLink.displayName = "PackageDetailLink";

import type { Package } from "ee/constants/PackageConstants";

export interface PackageSearchItemProps {
  searchedPackages: Package[];
}

const PackageSearchItem = (props: PackageSearchItemProps) => {
  // eslint-disable-next-line
  const { searchedPackages } = props;

  return null;
};

export default PackageSearchItem;

import type { Package } from "@appsmith/constants/PackageConstants";

export type PackageCardListProps = {
  isMobile: boolean;
  workspaceId: string;
  packages?: Package[];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PackageCardList(props: PackageCardListProps) {
  return null;
}

export default PackageCardList;

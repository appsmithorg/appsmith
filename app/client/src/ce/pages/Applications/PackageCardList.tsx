import type { Package } from "@appsmith/constants/PackageConstants";
import type { Workspace } from "@appsmith/constants/workspaceConstants";

export interface PackageCardListProps {
  isMobile: boolean;
  workspaceId: string;
  packages?: Package[];
  workspace: Workspace;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PackageCardList(props: PackageCardListProps) {
  return null;
}

export default PackageCardList;

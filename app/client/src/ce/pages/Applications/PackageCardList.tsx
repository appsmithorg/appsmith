import type { Package } from "ee/constants/PackageConstants";
import type { Workspace } from "ee/constants/workspaceConstants";

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

export * from "ce/pages/Applications/PackageCardList";

import React from "react";
import { useSelector } from "react-redux";

import {
  getIsCreatingPackage,
  getIsFetchingPackages,
} from "@appsmith/selectors/packageSelectors";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import { getWorkspaces } from "@appsmith/selectors/workspaceSelectors";
import { hasManagePackagePermission } from "@appsmith/utils/permissionHelpers";
import type { Package } from "@appsmith/constants/PackageConstants";
import PackageCardListRenderer from "./PackageCardListRenderer";

export type PackageCardListProps = {
  isMobile: boolean;
  workspaceId: string;
  packages?: Package[];
};

function PackageCardList({
  isMobile,
  workspaceId,
  packages = [],
}: PackageCardListProps) {
  const showQueryModule = useSelector(getShowQueryModule);
  const isCreatingPackage = useSelector((state) =>
    getIsCreatingPackage(state, workspaceId),
  );
  const isFetchingPackages = useSelector(getIsFetchingPackages);
  const userWorkspaces = useSelector(getWorkspaces);

  const currentUserWorkspace = userWorkspaces.find(
    (w) => w.workspace.id === workspaceId,
  );
  const workspace = currentUserWorkspace?.workspace;
  const canManagePackages = hasManagePackagePermission(
    workspace?.userPermissions,
  );

  if (!showQueryModule || isFetchingPackages || !canManagePackages) return null;

  return (
    <PackageCardListRenderer
      isCreatingPackage={isCreatingPackage}
      isFetchingPackages={isFetchingPackages}
      isMobile={isMobile}
      packages={packages}
      workspaceId={workspaceId}
    />
  );
}

export default PackageCardList;

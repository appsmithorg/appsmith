export * from "ce/pages/Applications/PackageCardList";

import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import PackageCardListRenderer from "./PackageCardListRenderer";
import {
  getIsCreatingPackage,
  getIsFetchingPackages,
} from "@appsmith/selectors/packageSelectors";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import { hasManageWorkspacePackagePermission } from "@appsmith/utils/permissionHelpers";
import { createPackageFromWorkspace } from "@appsmith/actions/packageActions";
import type { Package } from "@appsmith/constants/PackageConstants";
import type { Workspace } from "@appsmith/constants/workspaceConstants";

export interface PackageCardListProps {
  isMobile: boolean;
  workspaceId: string;
  packages?: Package[];
  workspace: Workspace;
}

function PackageCardList({
  isMobile,
  packages = [],
  workspace,
  workspaceId,
}: PackageCardListProps) {
  const dispatch = useDispatch();
  const showQueryModule = useSelector(getShowQueryModule);
  const isCreatingPackage = useSelector((state) =>
    getIsCreatingPackage(state, workspaceId),
  );
  const isFetchingPackages = useSelector(getIsFetchingPackages);
  const onCreateNewPackage = useCallback(() => {
    dispatch(createPackageFromWorkspace({ workspaceId }));
  }, [createPackageFromWorkspace, dispatch, workspaceId]);
  const canManagePackages = hasManageWorkspacePackagePermission(
    workspace?.userPermissions,
  );

  if (!showQueryModule || isFetchingPackages || !canManagePackages) return null;

  const packagesOfWorkspace = packages.filter(
    (p) => p.workspaceId === workspaceId,
  );
  return (
    <PackageCardListRenderer
      createPackage={onCreateNewPackage}
      isCreatingPackage={isCreatingPackage}
      isFetchingPackages={isFetchingPackages}
      isMobile={isMobile}
      packages={packagesOfWorkspace}
      workspaceId={workspaceId}
    />
  );
}

export default PackageCardList;

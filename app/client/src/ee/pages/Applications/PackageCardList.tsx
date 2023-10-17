export * from "ce/pages/Applications/PackageCardList";

import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import PackageCardListRenderer from "./PackageCardListRenderer";
import {
  getIsCreatingPackage,
  getIsFetchingPackages,
} from "@appsmith/selectors/packageSelectors";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import { getWorkspaces } from "@appsmith/selectors/workspaceSelectors";
import { hasManageWorkspacePackagePermission } from "@appsmith/utils/permissionHelpers";
import { createPackageFromWorkspace } from "@appsmith/actions/packageActions";
import type { Package } from "@appsmith/constants/PackageConstants";

export interface PackageCardListProps {
  isMobile: boolean;
  workspaceId: string;
  packages?: Package[];
}

function PackageCardList({
  isMobile,
  packages = [],
  workspaceId,
}: PackageCardListProps) {
  const dispatch = useDispatch();
  const showQueryModule = useSelector(getShowQueryModule);
  const isCreatingPackage = useSelector((state) =>
    getIsCreatingPackage(state, workspaceId),
  );
  const isFetchingPackages = useSelector(getIsFetchingPackages);
  const userWorkspaces = useSelector(getWorkspaces);
  const onCreateNewPackage = useCallback(() => {
    dispatch(createPackageFromWorkspace({ workspaceId }));
  }, [createPackageFromWorkspace, dispatch, workspaceId]);

  const currentUserWorkspace = userWorkspaces.find(
    (w) => w.workspace.id === workspaceId,
  );
  const workspace = currentUserWorkspace?.workspace;
  const canManagePackages = hasManageWorkspacePackagePermission(
    workspace?.userPermissions,
  );

  if (!showQueryModule || isFetchingPackages || !canManagePackages) return null;

  return (
    <PackageCardListRenderer
      createPackage={onCreateNewPackage}
      isCreatingPackage={isCreatingPackage}
      isFetchingPackages={isFetchingPackages}
      isMobile={isMobile}
      packages={packages}
      workspaceId={workspaceId}
    />
  );
}

export default PackageCardList;

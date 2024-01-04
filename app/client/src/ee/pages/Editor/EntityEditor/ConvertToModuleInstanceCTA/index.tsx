export * from "ce/pages/Editor/EntityEditor/ConvertToModuleInstanceCTA";
import type { ConvertToModuleInstanceCTAProps } from "ce/pages/Editor/EntityEditor/ConvertToModuleInstanceCTA";

import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "design-system";

import PackageListMenu from "./PackageListMenu";
import { convertEntityToInstance } from "@appsmith/actions/moduleInstanceActions";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { hasCreatePackagePermission } from "@appsmith/utils/permissionHelpers";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import usePackageListToConvertEntity from "./usePackageListToConvertEntity";
import type { OnItemClickProps } from "./PackageListMenu";
import {
  CONVERT_MODULE_CTA_TEXT,
  createMessage,
} from "@appsmith/constants/messages";

function ConvertToModuleInstanceCTA({
  canCreateModuleInstance,
  canDeleteEntity,
  entityId,
  moduleType,
}: ConvertToModuleInstanceCTAProps) {
  const packages = usePackageListToConvertEntity();
  const dispatch = useDispatch();
  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const canCreateNewPackage = hasCreatePackagePermission(
    currentWorkspace?.userPermissions,
  );
  const showQueryModule = useSelector(getShowQueryModule);
  const canConvertEntity = canDeleteEntity && canCreateModuleInstance;

  const createNewModuleInstance = useCallback(
    ({ packageId }: OnItemClickProps) => {
      dispatch(
        convertEntityToInstance({
          moduleType,
          publicEntityId: entityId,
          packageId,
          initiatedFromPathname: location.pathname,
        }),
      );
    },
    [entityId, moduleType],
  );

  if (!showQueryModule) {
    return null;
  }

  if (packages.length === 0) {
    const isDisabled = !canConvertEntity || !canCreateNewPackage;

    return (
      <Button
        data-testid="t--convert-module-btn"
        isDisabled={isDisabled}
        kind="secondary"
        onClick={() => createNewModuleInstance({ packageId: undefined })}
        size="md"
      >
        {createMessage(CONVERT_MODULE_CTA_TEXT)}
      </Button>
    );
  }

  return (
    <PackageListMenu
      canCreateNewPackage={canCreateNewPackage}
      isDisabled={!canConvertEntity}
      onItemClick={createNewModuleInstance}
      packages={packages}
      title={createMessage(CONVERT_MODULE_CTA_TEXT)}
    />
  );
}

export default ConvertToModuleInstanceCTA;

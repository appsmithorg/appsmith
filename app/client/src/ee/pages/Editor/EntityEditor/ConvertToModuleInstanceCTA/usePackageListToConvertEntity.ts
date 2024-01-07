import { useSelector } from "react-redux";

import { getPackagesList } from "@appsmith/selectors/packageSelectors";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { hasCreateModulePermission } from "@appsmith/utils/permissionHelpers";
import {
  CANNOT_CREATE_MODULE_WARN,
  CONVERT_ENTITY_UNPUBLISHED_CHANGES_WARN,
  createMessage,
} from "@appsmith/constants/messages";

export type ConvertPackageList = ReturnType<
  typeof usePackageListToConvertEntity
>;

function usePackageListToConvertEntity() {
  const packagesList = useSelector(getPackagesList);
  const currentWorkspace = useSelector(getCurrentAppWorkspace);

  const currentWorkspacePackages = packagesList
    .filter((pkg) => pkg.workspaceId === currentWorkspace.id)
    .map((pkg) => {
      const hasUnpublishedChanges =
        Date.parse(pkg.modifiedAt) - Date.parse(pkg.lastPublishedAt) > 0;
      const canCreateModule = hasCreateModulePermission(pkg.userPermissions);
      let disabledTooltipText;
      if (hasUnpublishedChanges) {
        disabledTooltipText = createMessage(
          CONVERT_ENTITY_UNPUBLISHED_CHANGES_WARN,
        );
      }

      if (!canCreateModule) {
        disabledTooltipText = createMessage(CANNOT_CREATE_MODULE_WARN);
      }

      return {
        ...pkg,
        disabledTooltipText,
        isDisabled: !canCreateModule || hasUnpublishedChanges,
      };
    });

  return currentWorkspacePackages;
}

export default usePackageListToConvertEntity;

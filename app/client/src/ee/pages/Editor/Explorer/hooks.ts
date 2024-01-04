export * from "ce/pages/Editor/Explorer/hooks";
import type { UseConvertToModulesOptionsProps } from "ce/pages/Editor/Explorer/hooks";
import { useActiveAction as useCEActiveAction } from "ce/pages/Editor/Explorer/hooks";
import {
  MODULE_INSTANCE_ID_PATH,
  basePathForActiveAction,
} from "@appsmith/constants/routes/appRoutes";
import { matchPath, useLocation } from "react-router";
import { noop } from "lodash";
import usePackageListToConvertEntity from "../EntityEditor/ConvertToModuleInstanceCTA/usePackageListToConvertEntity";
import {
  CONVERT_MODULE_CTA_TEXT,
  createMessage,
} from "@appsmith/constants/messages";
import { convertEntityToInstance } from "@appsmith/actions/moduleInstanceActions";
import { useCallback } from "react";
import type { TreeDropdownOption } from "pages/Editor/Explorer/ContextMenu";
import { useDispatch, useSelector } from "react-redux";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getPagePermissions } from "selectors/editorSelectors";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { hasCreatePackagePermission } from "@appsmith/utils/permissionHelpers";
import { getIsActionConverting } from "@appsmith/selectors/entitiesSelector";

export function useActiveAction() {
  const location = useLocation();

  const path = basePathForActiveAction;

  const baseMatch = matchPath<{ apiId: string }>(location.pathname, {
    path,
    strict: false,
    exact: false,
  });

  const basePath = baseMatch?.path || "";

  const ceActiveAction = useCEActiveAction();

  if (ceActiveAction) return ceActiveAction;

  const moduleInstanceMatch = matchPath<{ moduleInstanceId: string }>(
    location.pathname,
    {
      path: `${basePath}${MODULE_INSTANCE_ID_PATH}`,
    },
  );
  if (moduleInstanceMatch?.params?.moduleInstanceId) {
    return moduleInstanceMatch.params.moduleInstanceId;
  }
}

export const useConvertToModuleOptions = ({
  canDelete,
  id,
  moduleType,
}: UseConvertToModulesOptionsProps): TreeDropdownOption => {
  const packages = usePackageListToConvertEntity();
  const dispatch = useDispatch();
  const hasPackages = Boolean(packages.length);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const pagePermissions = useSelector(getPagePermissions);
  const canCreateModuleInstance = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const canCreateNewPackage = hasCreatePackagePermission(
    currentWorkspace?.userPermissions,
  );
  const isConverting = useSelector((state) => getIsActionConverting(state, id));

  const canConvertEntity = canDelete && canCreateModuleInstance;

  const createNewModuleInstance = useCallback(
    ({ value }: TreeDropdownOption) => {
      const packageId = value === "" ? undefined : value;

      dispatch(
        convertEntityToInstance({
          moduleType,
          publicEntityId: id,
          packageId,
          initiatedFromPathname: location.pathname,
        }),
      );
    },
    [id, moduleType],
  );

  const option: TreeDropdownOption = {
    value: "",
    onSelect: hasPackages ? noop : createNewModuleInstance,
    label: createMessage(CONVERT_MODULE_CTA_TEXT),
    disabled: !canConvertEntity || !canCreateNewPackage || isConverting,
  };

  if (hasPackages) {
    option.children = packages.map((pkg) => ({
      label: `Add to ${pkg.name}`,
      value: pkg.id,
      onSelect: pkg.isDisabled ? noop : createNewModuleInstance,
      disabled: pkg.isDisabled,
      tooltipText: pkg.disabledTooltipText,
    }));

    // Add a divider
    option.children?.push({
      value: "divider",
      onSelect: noop,
      label: "divider",
      type: "menu-divider",
    });

    option.children?.push({
      value: "",
      onSelect: canCreateNewPackage ? createNewModuleInstance : noop,
      label: "Add to a new package",
      disabled: !canCreateNewPackage,
    });
  }

  return option;
};

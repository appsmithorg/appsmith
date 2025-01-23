import React from "react";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useSelector } from "react-redux";
import { getPagePermissions } from "selectors/editorSelectors";
import {
  getHasCreateActionPermission,
  getHasDeleteActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { MODULE_TYPE } from "ee/constants/ModuleConstants";
import ConvertToModuleInstanceCTA from "ee/pages/Editor/EntityEditor/ConvertToModuleInstanceCTA";
import { PluginType } from "entities/Plugin";
import type { Action } from "entities/Action";

interface Props {
  action: Action;
}

export const ConvertToModule = ({ action }: Props) => {
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateModuleInstance = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const canDeleteAction = getHasDeleteActionPermission(
    isFeatureEnabled,
    action.userPermissions,
  );

  if (action.pluginType === PluginType.INTERNAL) {
    // Workflow queries cannot be converted to modules
    return null;
  }

  const convertToModuleProps = {
    canCreateModuleInstance: canCreateModuleInstance,
    canDeleteEntity: canDeleteAction,
    entityId: action.id,
    moduleType: MODULE_TYPE.QUERY,
  };

  return <ConvertToModuleInstanceCTA {...convertToModuleProps} />;
};

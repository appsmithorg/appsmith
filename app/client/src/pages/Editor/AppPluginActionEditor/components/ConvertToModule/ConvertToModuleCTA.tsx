import React from "react";
import { usePluginActionContext } from "PluginActionEditor";
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

const ConvertToModuleCTA = () => {
  const { action, plugin } = usePluginActionContext();
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const pagePermissions = useSelector(getPagePermissions);
  const isCreatePermitted = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const isDeletePermitted = getHasDeleteActionPermission(
    isFeatureEnabled,
    action.userPermissions,
  );

  if (plugin.type === PluginType.INTERNAL) {
    // Workflow queries cannot be converted to modules
    return null;
  }

  const convertToModuleProps = {
    canCreateModuleInstance: isCreatePermitted,
    canDeleteEntity: isDeletePermitted,
    entityId: action.id,
    moduleType: MODULE_TYPE.QUERY,
  };

  return <ConvertToModuleInstanceCTA {...convertToModuleProps} />;
};

export default ConvertToModuleCTA;

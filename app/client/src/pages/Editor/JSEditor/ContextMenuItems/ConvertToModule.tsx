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
import type { JSCollection } from "entities/JSCollection";

interface Props {
  jsAction: JSCollection;
}

export const ConvertToModule = ({ jsAction }: Props) => {
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateModuleInstance = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const canDeleteJSAction = getHasDeleteActionPermission(
    isFeatureEnabled,
    jsAction.userPermissions,
  );

  const convertToModuleProps = {
    canCreateModuleInstance: canCreateModuleInstance,
    canDeleteEntity: canDeleteJSAction,
    entityId: jsAction.id,
    moduleType: MODULE_TYPE.JS,
  };

  return <ConvertToModuleInstanceCTA {...convertToModuleProps} />;
};

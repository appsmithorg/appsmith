import React from "react";
import { MenuSeparator } from "@appsmith/ads";
import {
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  usePluginActionContext,
  DocsMenuItem as Docs,
} from "PluginActionEditor";
import { ConvertToModule, Copy, Delete, Move } from "../ContextMenuItems";
import { RenameMenuItem } from "IDE";
import { InspectStateMenuItem } from "components/editorComponents/Debugger/StateInspector/CTAs";

export const ToolbarMenu = () => {
  const { action } = usePluginActionContext();

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    action.userPermissions,
  );
  const isDeletePermitted = getHasDeleteActionPermission(
    isFeatureEnabled,
    action.userPermissions,
  );

  return (
    <>
      <RenameMenuItem disabled={!isChangePermitted} entityId={action.id} />
      <MenuSeparator />
      <ConvertToModule action={action} />
      <Copy action={action} disabled={!isChangePermitted} />
      <Move action={action} disabled={!isChangePermitted} />
      <MenuSeparator />
      <InspectStateMenuItem entityId={action.id} />
      <Docs />
      <MenuSeparator />
      <Delete action={action} disabled={!isDeletePermitted} />
    </>
  );
};

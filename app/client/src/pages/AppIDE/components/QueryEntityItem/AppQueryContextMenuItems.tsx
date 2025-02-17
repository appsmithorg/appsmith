import React from "react";
import type { Action } from "entities/Action";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import {
  ConvertToModule,
  Copy,
  Delete,
  Move,
  Rename,
  ShowBindings,
} from "../AppPluginActionEditor/components/ContextMenuItems";
import { MenuSeparator } from "@appsmith/ads";
import { InspectStateMenuItem } from "components/editorComponents/Debugger/StateInspector/CTAs";

export interface Props {
  action: Action;
}

export function AppQueryContextMenuItems(props: Props) {
  const { action } = props;
  const actionPermissions = action.userPermissions || [];

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canDeleteAction = getHasDeleteActionPermission(
    isFeatureEnabled,
    actionPermissions,
  );

  const canManageAction = getHasManageActionPermission(
    isFeatureEnabled,
    actionPermissions,
  );

  return (
    <>
      <Rename action={action} disabled={!canManageAction} />
      <MenuSeparator />
      <ConvertToModule action={action} />
      <Copy action={action} disabled={!canManageAction} />
      <Move action={action} disabled={!canManageAction} />
      <MenuSeparator />
      <ShowBindings action={action} />
      <InspectStateMenuItem entityId={action.id} />
      <MenuSeparator />
      <Delete action={action} disabled={!canDeleteAction} />
    </>
  );
}

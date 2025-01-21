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
} from "pages/Editor/AppPluginActionEditor/components/ContextMenuItems";

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
      <ShowBindings action={action} />
      <ConvertToModule action={action} hideIcon />
      <Copy action={action} disabled={!canManageAction} hideIcon />
      <Move action={action} disabled={!canManageAction} hideIcon />
      <Delete action={action} disabled={!canDeleteAction} hideIcon />
    </>
  );
}

import React from "react";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import type { JSCollection } from "entities/JSCollection";
import {
  ConvertToModule,
  Copy,
  Delete,
  Move,
  Rename,
  ShowBindings,
} from "pages/Editor/JSEditor/ContextMenuItems";

export interface Props {
  jsAction: JSCollection;
}

export function AppJSContextMenuItems(props: Props) {
  const { jsAction } = props;
  const jsActionPermissions = jsAction.userPermissions || [];

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canDeleteAction = getHasDeleteActionPermission(
    isFeatureEnabled,
    jsActionPermissions,
  );

  const canManageAction = getHasManageActionPermission(
    isFeatureEnabled,
    jsActionPermissions,
  );

  return (
    <>
      <Rename disabled={!canManageAction} jsAction={jsAction} />
      <ShowBindings jsAction={jsAction} />
      <ConvertToModule action={jsAction} hideIcon />
      <Copy disabled={!canManageAction} hideIcon jsAction={jsAction} />
      <Move disabled={!canManageAction} hideIcon jsAction={jsAction} />
      <Delete disabled={!canDeleteAction} hideIcon jsAction={jsAction} />
    </>
  );
}

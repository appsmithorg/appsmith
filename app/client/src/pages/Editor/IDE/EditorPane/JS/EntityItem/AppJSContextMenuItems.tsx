import React from "react";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import type { JSCollection } from "entities/JSCollection";
import {
  Copy,
  Delete,
  Move,
  Rename,
  ShowBindings,
} from "pages/Editor/JSEditor/ContextMenuItems";
import { MenuSeparator } from "@appsmith/ads";

export interface Props {
  jsAction: JSCollection;
}

export function AppJSContextMenuItems(props: Props) {
  const { jsAction } = props;
  const jsActionPermissions = jsAction.userPermissions || [];

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canDeleteJSAction = getHasDeleteActionPermission(
    isFeatureEnabled,
    jsActionPermissions,
  );

  const canManageJSAction = getHasManageActionPermission(
    isFeatureEnabled,
    jsActionPermissions,
  );

  if (Boolean(jsAction?.isMainJSCollection)) {
    return null;
  }

  return (
    <>
      <Rename disabled={!canManageJSAction} jsAction={jsAction} />
      <ShowBindings jsAction={jsAction} />
      <Copy disabled={!canManageJSAction} jsAction={jsAction} />
      <Move disabled={!canManageJSAction} jsAction={jsAction} />
      <MenuSeparator />
      <Delete disabled={!canDeleteJSAction} jsAction={jsAction} />
    </>
  );
}

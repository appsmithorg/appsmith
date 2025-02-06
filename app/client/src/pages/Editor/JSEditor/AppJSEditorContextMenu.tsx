import React from "react";
import {
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { JSCollection } from "entities/JSCollection";
import { Copy, Delete, Move, Prettify } from "./ContextMenuItems";
import { RenameMenuItem } from "IDE";
import { MenuSeparator } from "@appsmith/ads";
import EntityContextMenu from "../IDE/EditorPane/components/EntityContextMenu";

interface AppJSEditorContextMenuProps {
  jsCollection: JSCollection;
}

export function AppJSEditorContextMenu({
  jsCollection,
}: AppJSEditorContextMenuProps) {
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isDeletePermitted = getHasDeleteActionPermission(
    isFeatureEnabled,
    jsCollection?.userPermissions || [],
  );
  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    jsCollection?.userPermissions || [],
  );

  if (Boolean(jsCollection?.isMainJSCollection)) {
    return null;
  }

  return (
    <EntityContextMenu dataTestId="t--more-action-trigger">
      <RenameMenuItem
        disabled={!isChangePermitted}
        entityId={jsCollection.id}
      />
      <Copy disabled={!isChangePermitted} jsAction={jsCollection} />
      <Move disabled={!isChangePermitted} jsAction={jsCollection} />
      <Prettify disabled={!isChangePermitted} jsAction={jsCollection} />
      <MenuSeparator />
      <Delete disabled={!isDeletePermitted} jsAction={jsCollection} />
    </EntityContextMenu>
  );
}

export default AppJSEditorContextMenu;

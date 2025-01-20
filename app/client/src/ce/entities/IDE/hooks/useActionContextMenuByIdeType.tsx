import React from "react";
import type { Action } from "entities/Action";
import { IDE_TYPE, type IDEType } from "../constants";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "../../FeatureFlag";
import { useParentEntityInfo } from "ee/IDE/hooks/useParentEntityInfo";
import {
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { QueryEntityContextMenu } from "pages/Editor/IDE/EditorPane/Query/ListItem/QueryEntityContextMenu";

export const useActionContextMenuByIdeType = (
  ideType: IDEType,
  action: Action,
) => {
  const actionPermissions = action.userPermissions || [];
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const { parentEntityId } = useParentEntityInfo(ideType);

  switch (ideType) {
    case IDE_TYPE.App: {
      const canDeleteAction = getHasDeleteActionPermission(
        isFeatureEnabled,
        actionPermissions,
      );

      const canManageAction = getHasManageActionPermission(
        isFeatureEnabled,
        actionPermissions,
      );

      return (
        <QueryEntityContextMenu
          canDeleteAction={canDeleteAction}
          canManageAction={canManageAction}
          id={action.id}
          name={action.name}
          parentEntityId={parentEntityId}
          pluginType={action.pluginType}
        />
      );
    }
  }
};

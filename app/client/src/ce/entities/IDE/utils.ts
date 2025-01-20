import type { IDEType, EditorState } from "ee/entities/IDE/constants";
import {
  defaultActionMenuItems,
  IDE_TYPE,
  IDEBasePaths,
} from "ee/entities/IDE/constants";
import { matchPath } from "react-router";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "ee/constants/routes/appRoutes";
import { saveActionName } from "actions/pluginActionActions";
import { saveJSObjectName } from "actions/jsActionActions";
import { EditorEntityTab, type EntityItem } from "ee/entities/IDE/constants";
import { getHasManageActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";

export interface SaveEntityName {
  params: {
    name: string;
    id: string;
  };
  segment: EditorEntityTab;
  entity?: EntityItem;
}

export const EDITOR_PATHS = [
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
];

export function getCurrentAppState(currentUrl: string): EditorState {
  const entityInfo = identifyEntityFromPath(currentUrl);

  return entityInfo.appState;
}

export function getIDETypeByUrl(path: string): IDEType {
  for (const type in IDEBasePaths) {
    const basePaths = IDEBasePaths[type as IDEType];

    if (matchPath(path, { path: basePaths })) {
      return type as IDEType;
    }
  }

  return IDE_TYPE.None;
}

export function getBaseUrlsForIDEType(type: IDEType): string[] {
  return IDEBasePaths[type];
}

export const saveEntityName = ({ params, segment }: SaveEntityName) => {
  let saveNameAction = saveActionName(params);

  if (EditorEntityTab.JS === segment) {
    saveNameAction = saveJSObjectName(params);
  }

  return saveNameAction;
};

export interface EditableTabPermissions {
  isFeatureEnabled: boolean;
  entity?: EntityItem;
}

export const getEditableTabPermissions = ({
  entity,
  isFeatureEnabled,
}: EditableTabPermissions) => {
  return getHasManageActionPermission(
    isFeatureEnabled,
    entity?.userPermissions || [],
  );
};

export const getMenuItemsForActionEntityByIdeType = (ideType: IDEType) => {
  switch (ideType) {
    case IDE_TYPE.App:
      return defaultActionMenuItems;
    default:
      return defaultActionMenuItems;
  }
};

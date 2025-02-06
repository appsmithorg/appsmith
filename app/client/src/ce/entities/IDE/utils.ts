import type { EditorState } from "IDE/enums";
import { IDE_TYPE, type IDEType } from "ee/IDE/Interfaces/IDETypes";
import { IDEBasePaths } from "ee/IDE/constants/routes";
import { matchPath } from "react-router";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "ee/constants/routes/appRoutes";
import { saveActionName } from "actions/pluginActionActions";
import { saveJSObjectName } from "actions/jsActionActions";
import { EditorEntityTab } from "IDE/Interfaces/EditorTypes";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";
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

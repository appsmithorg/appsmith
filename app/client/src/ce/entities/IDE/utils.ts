import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "ee/constants/routes/appRoutes";
import type { EditorState, IDEType } from "ee/entities/IDE/constants";
import { IDEBasePaths, IDE_TYPE } from "ee/entities/IDE/constants";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { matchPath } from "react-router";

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

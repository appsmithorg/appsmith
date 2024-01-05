import type { IDEType } from "@appsmith/entities/IDE/constants";
import {
  EditorState,
  IDE_TYPE,
  IDEBasePaths,
} from "@appsmith/entities/IDE/constants";
import { matchPath } from "react-router";
import {
  APP_STATE_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  INTEGRATION_EDITOR_PATH,
  SAAS_GSHEET_EDITOR_ID_PATH,
} from "@appsmith/constants/routes/appRoutes";

export function getCurrentAppState(currentUrl: string): EditorState {
  const match = matchPath<{
    appState?: "datasource" | "settings" | "libraries";
    datasourceId?: string;
    selectedTab?: string;
  }>(currentUrl, {
    path: [
      BUILDER_PATH_DEPRECATED + SAAS_GSHEET_EDITOR_ID_PATH,
      BUILDER_PATH + SAAS_GSHEET_EDITOR_ID_PATH,
      BUILDER_CUSTOM_PATH + SAAS_GSHEET_EDITOR_ID_PATH,
      BUILDER_PATH_DEPRECATED + INTEGRATION_EDITOR_PATH,
      BUILDER_PATH + INTEGRATION_EDITOR_PATH,
      BUILDER_CUSTOM_PATH + INTEGRATION_EDITOR_PATH,
      BUILDER_PATH_DEPRECATED + APP_STATE_PATH,
      BUILDER_PATH + APP_STATE_PATH,
      BUILDER_CUSTOM_PATH + APP_STATE_PATH,
    ],
  });

  if (match) {
    const { appState, datasourceId, selectedTab } = match.params;
    if (appState === "datasource" || datasourceId || selectedTab) {
      return EditorState.DATA;
    } else if (appState === "settings") {
      return EditorState.SETTINGS;
    } else if (appState === "libraries") {
      return EditorState.LIBRARIES;
    } else {
      return EditorState.EDITOR;
    }
  }
  return EditorState.EDITOR;
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

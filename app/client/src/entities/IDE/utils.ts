import { matchPath } from "react-router";
import {
  APP_STATE_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  DATASOURCE_CREATE_PATH,
  SAAS_GSHEET_EDITOR_ID_PATH,
} from "constants/routes";
import { EditorState } from "./constants";

export function getCurrentAppState(currentUrl: string): EditorState {
  const match = matchPath<{
    appState?: "datasource" | "settings" | "libraries";
    datasourceId?: string;
  }>(currentUrl, {
    path: [
      BUILDER_PATH_DEPRECATED + SAAS_GSHEET_EDITOR_ID_PATH,
      BUILDER_PATH + SAAS_GSHEET_EDITOR_ID_PATH,
      BUILDER_CUSTOM_PATH + SAAS_GSHEET_EDITOR_ID_PATH,
      BUILDER_PATH_DEPRECATED + DATASOURCE_CREATE_PATH,
      BUILDER_PATH + DATASOURCE_CREATE_PATH,
      BUILDER_CUSTOM_PATH + DATASOURCE_CREATE_PATH,
      BUILDER_PATH_DEPRECATED + APP_STATE_PATH,
      BUILDER_PATH + APP_STATE_PATH,
      BUILDER_CUSTOM_PATH + APP_STATE_PATH,
    ],
  });

  if (match) {
    const { appState, datasourceId } = match.params;
    if (
      appState === "datasource" ||
      datasourceId ||
      match.path.includes(DATASOURCE_CREATE_PATH)
    ) {
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

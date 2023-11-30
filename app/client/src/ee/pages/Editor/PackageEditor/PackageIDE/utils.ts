import { matchPath } from "react-router";
import {
  APP_STATE_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  INTEGRATION_EDITOR_PATH,
  SAAS_GSHEET_EDITOR_ID_PATH,
} from "constants/routes";
import {
  MODULE_EDITOR_PATH,
  PACKAGE_EDITOR_PATH,
} from "@appsmith/constants/routes/packageRoutes";
import { EditorState } from "entities/IDE/constants";

export function getCurrentPackageState(currentUrl: string): EditorState {
  const match = matchPath<{
    appState?: "datasource" | "settings" | "libraries";
    datasourceId?: string;
    selectedTab?: string;
  }>(currentUrl, {
    path: [
      PACKAGE_EDITOR_PATH + DATA_SOURCES_EDITOR_ID_PATH,
      PACKAGE_EDITOR_PATH + SAAS_GSHEET_EDITOR_ID_PATH,
      PACKAGE_EDITOR_PATH + INTEGRATION_EDITOR_PATH,
      PACKAGE_EDITOR_PATH + APP_STATE_PATH,
      MODULE_EDITOR_PATH + APP_STATE_PATH,
    ],
  });

  if (match) {
    const { appState, datasourceId, selectedTab } = match.params;
    if (appState === "datasource" || datasourceId || selectedTab) {
      return EditorState.DATA;
    } else if (appState === "settings") {
      return EditorState.SETTINGS;
    } else {
      return EditorState.EDITOR;
    }
  }
  return EditorState.EDITOR;
}

import { matchPath } from "react-router";
import {
  APP_STATE_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  INTEGRATION_EDITOR_PATH,
  SAAS_GSHEET_EDITOR_ID_PATH,
} from "constants/routes";
import { EditorState } from "entities/IDE/constants";
import { WORKFLOW_EDITOR_URL } from "@appsmith/constants/routes/workflowRoutes";

export function getCurrentWorkflowState(currentUrl: string): EditorState {
  const match = matchPath<{
    appState?: "datasource" | "settings" | "libraries";
    datasourceId?: string;
    selectedTab?: string;
  }>(currentUrl, {
    path: [
      WORKFLOW_EDITOR_URL + DATA_SOURCES_EDITOR_ID_PATH,
      WORKFLOW_EDITOR_URL + SAAS_GSHEET_EDITOR_ID_PATH,
      WORKFLOW_EDITOR_URL + INTEGRATION_EDITOR_PATH,
      WORKFLOW_EDITOR_URL + APP_STATE_PATH,
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

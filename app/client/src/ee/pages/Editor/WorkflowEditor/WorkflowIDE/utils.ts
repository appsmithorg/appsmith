import { matchPath } from "react-router";
import {
  ENTITY_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  INTEGRATION_EDITOR_PATH,
  SAAS_GSHEET_EDITOR_ID_PATH,
} from "constants/routes";
import { EditorState } from "@appsmith/entities/IDE/constants";
import { WORKFLOW_EDITOR_URL } from "@appsmith/constants/routes/workflowRoutes";

export function getCurrentWorkflowState(currentUrl: string): EditorState {
  const match = matchPath<{
    entity?: "datasource" | "settings" | "libraries";
    datasourceId?: string;
    selectedTab?: string;
  }>(currentUrl, {
    path: [
      WORKFLOW_EDITOR_URL + DATA_SOURCES_EDITOR_ID_PATH,
      WORKFLOW_EDITOR_URL + SAAS_GSHEET_EDITOR_ID_PATH,
      WORKFLOW_EDITOR_URL + INTEGRATION_EDITOR_PATH,
      WORKFLOW_EDITOR_URL + ENTITY_PATH,
    ],
  });

  if (match) {
    const { datasourceId, entity, selectedTab } = match.params;
    if (entity === "datasource" || datasourceId || selectedTab) {
      return EditorState.DATA;
    } else if (entity === "settings") {
      return EditorState.SETTINGS;
    } else {
      return EditorState.EDITOR;
    }
  }
  return EditorState.EDITOR;
}

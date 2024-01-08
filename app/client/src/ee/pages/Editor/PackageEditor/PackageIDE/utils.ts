import { matchPath } from "react-router";
import {
  ENTITY_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  INTEGRATION_EDITOR_PATH,
  SAAS_GSHEET_EDITOR_ID_PATH,
} from "constants/routes";
import {
  MODULE_EDITOR_PATH,
  PACKAGE_EDITOR_PATH,
} from "@appsmith/constants/routes/packageRoutes";
import { EditorState } from "@appsmith/entities/IDE/constants";

export function getCurrentPackageState(currentUrl: string): EditorState {
  const match = matchPath<{
    entity?: "datasource" | "settings" | "libraries";
    datasourceId?: string;
    selectedTab?: string;
  }>(currentUrl, {
    path: [
      PACKAGE_EDITOR_PATH + DATA_SOURCES_EDITOR_ID_PATH,
      PACKAGE_EDITOR_PATH + SAAS_GSHEET_EDITOR_ID_PATH,
      PACKAGE_EDITOR_PATH + INTEGRATION_EDITOR_PATH,
      PACKAGE_EDITOR_PATH + ENTITY_PATH,
      MODULE_EDITOR_PATH + ENTITY_PATH,
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

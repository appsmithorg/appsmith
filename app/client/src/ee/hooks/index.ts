export * from "ce/hooks";
import {
  type EditorType,
  EditorNames as CE_EditorNames,
  editorType as CE_editorType,
} from "ce/hooks";
import { BASE_PACKAGE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";
import {
  BUILDER_BASE_PATH_DEPRECATED,
  BUILDER_VIEWER_PATH_PREFIX,
} from "constants/routes";
import { matchPath } from "react-router";
import { BASE_WORKFLOW_EDITOR_URL } from "@appsmith/constants/routes/workflowRoutes";

export const EditorNames = {
  ...CE_EditorNames,
  PACKAGE: "package",
  WORKFLOW: "workflow",
};

export const editorType: EditorType = {
  ...CE_editorType,
  [BASE_PACKAGE_EDITOR_PATH]: EditorNames.PACKAGE,
  [BASE_WORKFLOW_EDITOR_URL]: EditorNames.WORKFLOW,
};

export const useEditorType = (path: string) => {
  const basePath = matchPath(path, {
    path: [
      BASE_PACKAGE_EDITOR_PATH,
      BASE_WORKFLOW_EDITOR_URL,
      BUILDER_VIEWER_PATH_PREFIX,
      BUILDER_BASE_PATH_DEPRECATED,
    ],
  });

  return basePath
    ? editorType[basePath.path]
    : editorType[BUILDER_VIEWER_PATH_PREFIX];
};

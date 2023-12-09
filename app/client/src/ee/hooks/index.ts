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

export const EditorNames = {
  ...CE_EditorNames,
  PACKAGE: "packageEditor",
};

export const editorType: EditorType = {
  ...CE_editorType,
  [BASE_PACKAGE_EDITOR_PATH]: EditorNames.PACKAGE,
};

export const useEditorType = (path: string) => {
  const basePath = matchPath(path, {
    path: [
      BASE_PACKAGE_EDITOR_PATH,
      BUILDER_VIEWER_PATH_PREFIX,
      BUILDER_BASE_PATH_DEPRECATED,
    ],
  });

  return basePath
    ? editorType[basePath.path]
    : editorType[BUILDER_VIEWER_PATH_PREFIX];
};

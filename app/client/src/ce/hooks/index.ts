import {
  BUILDER_BASE_PATH_DEPRECATED,
  BUILDER_VIEWER_PATH_PREFIX,
} from "constants/routes";
import { matchPath } from "react-router";

export const EditorNames = {
  APPLICATION: "appEditor",
};

export const useEditorType = (path: string) => {
  const basePath = matchPath(path, {
    path: [BUILDER_VIEWER_PATH_PREFIX, BUILDER_BASE_PATH_DEPRECATED],
  });
  const editorType: any = {
    [BUILDER_VIEWER_PATH_PREFIX]: EditorNames.APPLICATION,
  };

  return basePath
    ? editorType[basePath.path]
    : editorType[BUILDER_VIEWER_PATH_PREFIX];
};

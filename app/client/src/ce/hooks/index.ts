import {
  BUILDER_BASE_PATH_DEPRECATED,
  BUILDER_VIEWER_PATH_PREFIX,
} from "constants/routes";
import { matchPath } from "react-router";

export const EditorNames = {
  APPLICATION: "appEditor",
};

export interface EditorType {
  [key: string]: string;
}

export const editorType: EditorType = {
  [BUILDER_VIEWER_PATH_PREFIX]: EditorNames.APPLICATION,
};

export const useEditorType = (path: string) => {
  const basePath = matchPath(path, {
    path: [BUILDER_VIEWER_PATH_PREFIX, BUILDER_BASE_PATH_DEPRECATED],
  });

  return basePath
    ? editorType[basePath.path]
    : editorType[BUILDER_VIEWER_PATH_PREFIX];
};

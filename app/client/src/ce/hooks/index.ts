import {
  BUILDER_BASE_PATH_DEPRECATED,
  BUILDER_VIEWER_PATH_PREFIX,
} from "constants/routes";
import { useEffect, type RefObject } from "react";
import { matchPath } from "react-router";

export const EditorNames = {
  APPLICATION: "app",
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

export function useOutsideClick<T extends HTMLElement>(
  ref: RefObject<T>,
  inputRef: RefObject<T>,
  callback: () => void,
) {
  useEffect(() => {
    // This function checks if the click was outside the specified ref elements and calls the callback if true.
    function handleClickOutside(event: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        callback();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, inputRef, callback]);
}

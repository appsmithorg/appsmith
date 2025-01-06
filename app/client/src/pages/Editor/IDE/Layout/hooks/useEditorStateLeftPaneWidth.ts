import useWindowDimensions from "utils/hooks/useWindowDimensions";
import { useEffect, useState } from "react";
import {
  APP_SIDEBAR_WIDTH,
  DEFAULT_EXPLORER_PANE_WIDTH,
  SPLIT_SCREEN_RATIO,
} from "constants/AppConstants";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { EditorEntityTab, EditorViewMode } from "ee/entities/IDE/constants";
import { useCurrentEditorState } from "../../hooks";
import { previewModeSelector } from "selectors/editorSelectors";
import { useGitProtectedMode } from "pages/Editor/gitSync/hooks/modHooks";

export const useEditorStateLeftPaneWidth = (): number => {
  const [windowWidth] = useWindowDimensions();
  const [width, setWidth] = useState(windowWidth - APP_SIDEBAR_WIDTH);
  const editorMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();
  const propertyPaneWidth = useSelector(getPropertyPaneWidth);
  const isPreviewMode = useSelector(previewModeSelector);
  const isProtectedMode = useGitProtectedMode();

  useEffect(
    function updateWidth() {
      if (isPreviewMode || isProtectedMode) {
        setWidth(0);
      } else if (segment !== EditorEntityTab.UI) {
        if (editorMode === EditorViewMode.SplitScreen) {
          setWidth(windowWidth * SPLIT_SCREEN_RATIO);
        } else {
          setWidth(windowWidth - APP_SIDEBAR_WIDTH);
        }
      } else {
        setWidth(DEFAULT_EXPLORER_PANE_WIDTH);
      }
    },
    [
      editorMode,
      segment,
      propertyPaneWidth,
      windowWidth,
      isPreviewMode,
      isProtectedMode,
    ],
  );

  return width;
};

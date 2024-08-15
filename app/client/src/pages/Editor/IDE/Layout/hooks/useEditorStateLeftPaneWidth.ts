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
import type { AnimatedGridUnit } from "components/AnimatedGridLayout";
import { previewModeSelector } from "selectors/editorSelectors";

export const useEditorStateLeftPaneWidth = (): AnimatedGridUnit => {
  const [windowWidth] = useWindowDimensions();
  const [width, setWidth] = useState(windowWidth - APP_SIDEBAR_WIDTH + "px");
  const editorMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();
  const propertyPaneWidth = useSelector(getPropertyPaneWidth);
  const isPreviewMode = useSelector(previewModeSelector);
  useEffect(
    function updateWidth() {
      if (isPreviewMode) {
        setWidth("0px");
      } else if (segment !== EditorEntityTab.UI) {
        if (editorMode === EditorViewMode.SplitScreen) {
          setWidth(windowWidth * SPLIT_SCREEN_RATIO + "px");
        } else {
          setWidth(windowWidth - APP_SIDEBAR_WIDTH + "px");
        }
      } else {
        setWidth(DEFAULT_EXPLORER_PANE_WIDTH + "px");
      }
    },
    [editorMode, segment, propertyPaneWidth, windowWidth, isPreviewMode],
  );

  return width as AnimatedGridUnit;
};

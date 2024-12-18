import React from "react";
import type { AnimatedGridUnit } from "components/AnimatedGridLayout";
import { useSelector } from "react-redux";
import useWindowDimensions from "utils/hooks/useWindowDimensions";
import { useCurrentEditorState } from "../../hooks";
import { useCurrentAppState } from "../../hooks/useCurrentAppState";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { previewModeSelector } from "selectors/editorSelectors";
import { getIDEViewMode } from "selectors/ideSelectors";
import {
  EditorEntityTab,
  EditorState,
  EditorViewMode,
} from "ee/entities/IDE/constants";
import {
  APP_SETTINGS_PANE_WIDTH,
  APP_SIDEBAR_WIDTH,
  APP_LIBRARIES_PANE_WIDTH,
} from "constants/AppConstants";
import { useEditorStateLeftPaneWidth } from "./useEditorStateLeftPaneWidth";
import { type Area, Areas, SIDEBAR_WIDTH } from "../constants";
import { useGitProtectedMode } from "pages/Editor/gitSync/hooks/modHooks";

interface ReturnValue {
  areas: Area[][];
  rows: AnimatedGridUnit[];
  columns: AnimatedGridUnit[];
}

function useGridLayoutTemplate(): ReturnValue {
  const areas = React.useMemo(function initialiseAreas() {
    return [
      [Areas.Sidebar, Areas.Explorer, Areas.WidgetEditor, Areas.PropertyPane],
    ];
  }, []);
  const [columns, setColumns] = React.useState<AnimatedGridUnit[]>([]);
  const [rows] = React.useState<AnimatedGridUnit[]>(["1fr"]);

  const [windowWidth] = useWindowDimensions();
  const editorStateLeftPaneWidth = useEditorStateLeftPaneWidth();
  const PropertyPaneWidth = useSelector(getPropertyPaneWidth);
  const { segment } = useCurrentEditorState();
  const appState = useCurrentAppState();
  const isPreviewMode = useSelector(previewModeSelector);
  const editorMode = useSelector(getIDEViewMode);
  const isProtectedMode = useGitProtectedMode();

  React.useEffect(
    function updateIDEColumns() {
      switch (appState) {
        case EditorState.DATA:
          if (isPreviewMode || isProtectedMode) {
            setColumns([
              "0px",
              "0px",
              (windowWidth + "px") as AnimatedGridUnit,
              "0px",
            ]);
          } else {
            setColumns([
              SIDEBAR_WIDTH,
              "300px",
              (windowWidth - 300 - 50 + "px") as AnimatedGridUnit,
              "0px",
            ]);
          }

          break;
        case EditorState.SETTINGS:
          if (isPreviewMode || isProtectedMode) {
            setColumns([
              "0px",
              "0px",
              (windowWidth + "px") as AnimatedGridUnit,
              "0px",
            ]);
          } else {
            setColumns([
              SIDEBAR_WIDTH,
              (APP_SETTINGS_PANE_WIDTH + "px") as AnimatedGridUnit,
              (windowWidth -
                APP_SIDEBAR_WIDTH -
                APP_SETTINGS_PANE_WIDTH +
                "px") as AnimatedGridUnit,
              "0px",
            ]);
          }

          break;
        case EditorState.LIBRARIES:
          if (isPreviewMode || isProtectedMode) {
            setColumns([
              "0px",
              "0px",
              (windowWidth + "px") as AnimatedGridUnit,
              "0px",
            ]);
          } else {
            setColumns([
              SIDEBAR_WIDTH,
              `${APP_LIBRARIES_PANE_WIDTH}px`,
              (windowWidth -
                APP_SIDEBAR_WIDTH -
                APP_LIBRARIES_PANE_WIDTH +
                "px") as AnimatedGridUnit,
              "0px",
            ]);
          }

          break;
        case EditorState.EDITOR:
          if (isPreviewMode || isProtectedMode) {
            setColumns([
              "0px",
              (editorStateLeftPaneWidth + "px") as AnimatedGridUnit,
              (windowWidth + "px") as AnimatedGridUnit,
              "0px",
            ]);
          } else if (segment !== EditorEntityTab.UI) {
            if (editorMode === EditorViewMode.SplitScreen) {
              setColumns([
                SIDEBAR_WIDTH,
                (editorStateLeftPaneWidth + "px") as AnimatedGridUnit,
                (windowWidth -
                  APP_SIDEBAR_WIDTH -
                  editorStateLeftPaneWidth +
                  "px") as AnimatedGridUnit,
                "0px",
              ]);
            } else {
              setColumns([
                SIDEBAR_WIDTH,
                (editorStateLeftPaneWidth + "px") as AnimatedGridUnit,
                "0px",
                "0px",
              ]);
            }
          } else {
            setColumns([
              SIDEBAR_WIDTH,
              (editorStateLeftPaneWidth + "px") as AnimatedGridUnit,
              (windowWidth -
                APP_SIDEBAR_WIDTH -
                editorStateLeftPaneWidth -
                PropertyPaneWidth +
                1 +
                "px") as AnimatedGridUnit,
              (PropertyPaneWidth + 1 + "px") as AnimatedGridUnit,
            ]);
          }
      }
    },
    [
      appState,
      isPreviewMode,
      isProtectedMode,
      editorStateLeftPaneWidth,
      PropertyPaneWidth,
      segment,
      editorMode,
      windowWidth,
    ],
  );

  return { areas, columns, rows };
}

export { useGridLayoutTemplate };

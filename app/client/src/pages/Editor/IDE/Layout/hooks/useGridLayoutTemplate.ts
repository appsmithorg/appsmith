import React from "react";
import type { AnimatedGridUnit } from "components/AnimatedGridLayout";
import { useSelector } from "react-redux";
import useWindowDimensions from "utils/hooks/useWindowDimensions";
import { useCurrentAppState, useCurrentEditorState } from "../../hooks";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { previewModeSelector } from "selectors/editorSelectors";
import { getIDEViewMode } from "selectors/ideSelectors";
import { protectedModeSelector } from "selectors/gitSyncSelectors";
import {
  EditorEntityTab,
  EditorState,
  EditorViewMode,
} from "ee/entities/IDE/constants";
import { APP_SETTINGS_PANE_WIDTH } from "constants/AppConstants";
import { useEditorStateLeftPaneWidth } from "./useEditorStateLeftPaneWidth";
import { IDE_HEADER_HEIGHT } from "IDE";
import { BOTTOM_BAR_HEIGHT } from "components/BottomBar/constants";
import { PROTECTED_CALLOUT_HEIGHT } from "../../ProtectedCallout";
import { type Area, Areas, SIDEBAR_WIDTH } from "../constants";

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
  const [rows, setRows] = React.useState<AnimatedGridUnit[]>([]);

  const [windowWidth, windowHeight] = useWindowDimensions();
  const editorStateLeftPaneWidth = useEditorStateLeftPaneWidth();
  const PropertyPaneWidth = useSelector(getPropertyPaneWidth);
  const { segment } = useCurrentEditorState();
  const appState = useCurrentAppState();
  const isPreviewMode = useSelector(previewModeSelector);
  const editorMode = useSelector(getIDEViewMode);
  const isProtectedMode = useSelector(protectedModeSelector);

  React.useEffect(
    function updateIDERows() {
      const IDE_BODY_HEIGHT =
        windowHeight - IDE_HEADER_HEIGHT - BOTTOM_BAR_HEIGHT;

      if (isProtectedMode) {
        setRows([
          (IDE_BODY_HEIGHT -
            PROTECTED_CALLOUT_HEIGHT +
            "px") as AnimatedGridUnit,
        ]);
      } else {
        setRows([(IDE_BODY_HEIGHT + "px") as AnimatedGridUnit]);
      }
    },
    [isProtectedMode, windowHeight],
  );

  React.useEffect(
    function updateIDEColumns() {
      switch (appState) {
        case EditorState.DATA:
          setColumns([
            SIDEBAR_WIDTH,
            "300px",
            (windowWidth - 300 - 50 + "px") as AnimatedGridUnit,
            "0px",
          ]);
          break;
        case EditorState.SETTINGS:
          setColumns([
            SIDEBAR_WIDTH,
            (APP_SETTINGS_PANE_WIDTH + "px") as AnimatedGridUnit,
            "1fr",
            "0px",
          ]);
          break;
        case EditorState.LIBRARIES:
          setColumns([SIDEBAR_WIDTH, "255px", "1fr", "0px"]);
          break;
        case EditorState.EDITOR:
          if (isPreviewMode) {
            setColumns(["0px", editorStateLeftPaneWidth, "1fr", "0px"]);
          } else if (segment !== EditorEntityTab.UI) {
            if (editorMode === EditorViewMode.SplitScreen) {
              setColumns([
                SIDEBAR_WIDTH,
                editorStateLeftPaneWidth,
                "1fr",
                "0px",
              ]);
            } else {
              setColumns([
                SIDEBAR_WIDTH,
                editorStateLeftPaneWidth,
                "0px",
                "0px",
              ]);
            }
          } else {
            setColumns([
              SIDEBAR_WIDTH,
              editorStateLeftPaneWidth,
              "1fr",
              (PropertyPaneWidth + "px") as AnimatedGridUnit,
            ]);
          }
      }
    },
    [
      appState,
      isPreviewMode,
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

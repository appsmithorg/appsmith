import React, { useEffect, useMemo, useState } from "react";
import {
  AnimatedGridLayout,
  type AnimatedGridUnit,
  LayoutArea,
} from "components/AnimatedGridLayout";
import Sidebar from "./Sidebar";
import LeftPane from "./LeftPane";
import MainPane from "./MainPane";
import RightPane from "./RightPane";
import {
  useCurrentAppState,
  useCurrentEditorState,
  useEditorPaneWidth,
} from "./hooks";
import { useSelector } from "react-redux";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { previewModeSelector } from "selectors/editorSelectors";
import { getIDEViewMode } from "selectors/ideSelectors";
import {
  EditorEntityTab,
  EditorState,
  EditorViewMode,
} from "ee/entities/IDE/constants";
import { APP_SETTINGS_PANE_WIDTH } from "constants/AppConstants";
import EditorWrapperContainer from "../commons/EditorWrapperContainer";
import BottomBar from "components/BottomBar";
import useWindowDimensions from "utils/hooks/useWindowDimensions";
import { IDE_HEADER_HEIGHT } from "IDE";
import { BOTTOM_BAR_HEIGHT } from "components/BottomBar/contants";
import { protectedModeSelector } from "../../../selectors/gitSyncSelectors";
import { PROTECTED_CALLOUT_HEIGHT } from "./ProtectedCallout";

export const Areas = {
  Sidebar: "Sidebar",
  Explorer: "Explorer",
  CodeEditor: "CodeEditor",
  WidgetEditor: "WidgetEditor",
  PropertyPane: "PropertyPane",
  BottomBar: "BottomBar",
} as const;

const SIDEBAR_WIDTH = "50px";

export function useAppIDEAnimated(): [
  AnimatedGridUnit[],
  AnimatedGridUnit[],
  string[][],
] {
  const areas = useMemo(
    () => [
      [Areas.Sidebar, Areas.Explorer, Areas.WidgetEditor, Areas.PropertyPane],
    ],
    [],
  );
  const [, height] = useWindowDimensions();
  const [columns, setColumns] = useState<AnimatedGridUnit[]>([]);
  const [rows, setRows] = useState<AnimatedGridUnit[]>([
    (height - IDE_HEADER_HEIGHT - BOTTOM_BAR_HEIGHT + "px") as AnimatedGridUnit,
  ]);
  const LeftPaneWidth = useEditorPaneWidth();
  const PropertyPaneWidth = useSelector(getPropertyPaneWidth);
  const { segment } = useCurrentEditorState();
  const appState = useCurrentAppState();
  const isPreviewMode = useSelector(previewModeSelector);
  const editorMode = useSelector(getIDEViewMode);
  const isProtectedMode = useSelector(protectedModeSelector);

  useEffect(
    function updateIDERows() {
      const IDE_BODY_HEIGHT = height - IDE_HEADER_HEIGHT - BOTTOM_BAR_HEIGHT;

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
    [isProtectedMode, height],
  );

  useEffect(
    function updateIDEColumns() {
      switch (appState) {
        case EditorState.DATA:
          setColumns([SIDEBAR_WIDTH, "300px", "1fr", "0px"]);
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
            setColumns(["0px", "0px", "1fr", "0px"]);
          } else if (segment !== EditorEntityTab.UI) {
            if (editorMode === EditorViewMode.SplitScreen) {
              setColumns([
                SIDEBAR_WIDTH,
                LeftPaneWidth as AnimatedGridUnit,
                "1fr",
                "0px",
              ]);
            } else {
              setColumns([SIDEBAR_WIDTH, "1fr", "0px", "0px"]);
            }
          } else {
            setColumns([
              SIDEBAR_WIDTH,
              "255px",
              "1fr",
              (PropertyPaneWidth + "px") as AnimatedGridUnit,
            ]);
          }
      }
    },
    [
      appState,
      isPreviewMode,
      LeftPaneWidth,
      PropertyPaneWidth,
      segment,
      editorMode,
    ],
  );

  return [rows, columns, areas];
}

function AnimatedGridIDE() {
  const [rows, columns, areas] = useAppIDEAnimated();
  const isPreviewMode = useSelector(previewModeSelector);
  return (
    <>
      <EditorWrapperContainer>
        <AnimatedGridLayout
          areas={areas}
          columns={columns}
          height="100%"
          rows={rows}
          width="100vw"
        >
          <LayoutArea name={Areas.Sidebar}>
            <Sidebar />
          </LayoutArea>
          <LayoutArea name={Areas.Explorer}>
            <LeftPane />
          </LayoutArea>
          <LayoutArea name={Areas.WidgetEditor}>
            <MainPane id="app-body" />
          </LayoutArea>
          <LayoutArea name={Areas.PropertyPane}>
            <RightPane />
          </LayoutArea>
        </AnimatedGridLayout>
      </EditorWrapperContainer>
      <BottomBar viewMode={isPreviewMode} />
    </>
  );
}

export default AnimatedGridIDE;

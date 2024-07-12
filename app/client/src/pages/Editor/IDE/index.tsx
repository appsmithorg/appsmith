import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import BottomBar from "components/BottomBar";
import {
  // combinedPreviewModeSelector,
  previewModeSelector,
} from "selectors/editorSelectors";
import EditorWrapperContainer from "../commons/EditorWrapperContainer";
import Sidebar from "pages/Editor/IDE/Sidebar";
import LeftPane from "./LeftPane";
import MainPane from "./MainPane";
import RightPane from "./RightPane";
// import { protectedModeSelector } from "selectors/gitSyncSelectors";
import { AnimatedGridLayout, LayoutArea } from "components/AnimatedGridLayout";
import {
  useCurrentAppState,
  useCurrentEditorState,
  useEditorPaneWidth,
} from "./hooks";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import {
  EditorEntityTab,
  EditorState,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { APP_SETTINGS_PANE_WIDTH } from "constants/AppConstants";
import CodeEditor from "./EditorPane/CodeEditor";
import { getIDEViewMode } from "../../../selectors/ideSelectors";

const Areas = {
  // Header: "Header",
  Sidebar: "Sidebar",
  Explorer: "Explorer",
  CodeEditor: "CodeEditor",
  WidgetEditor: "WidgetEditor",
  PropertyPane: "PropertyPane",
};

const SIDEBAR_WIDTH = "50px";

function useAppIDEAnimated(): [string[], string[], string[][]] {
  const areas = useMemo(
    () => [
      [
        Areas.Sidebar,
        Areas.Explorer,
        Areas.CodeEditor,
        Areas.WidgetEditor,
        Areas.PropertyPane,
      ],
    ],
    [],
  );
  const [columns, setColumns] = useState<string[]>([]);
  const [rows] = useState<string[]>(["1fr"]);
  const LeftPaneWidth = useEditorPaneWidth();
  const PropertyPaneWidth = useSelector(getPropertyPaneWidth);
  const { segment } = useCurrentEditorState();
  const appState = useCurrentAppState();
  const isPreviewMode = useSelector(previewModeSelector);
  const editorMode = useSelector(getIDEViewMode);
  // const isCombinedPreviewMode = useSelector(combinedPreviewModeSelector);
  // const isProtectedMode = useSelector(protectedModeSelector);

  useEffect(() => {
    switch (appState) {
      case EditorState.DATA:
        setColumns([SIDEBAR_WIDTH, "300px", "0px", "1fr", "0px"]);
        break;
      case EditorState.SETTINGS:
        setColumns([
          SIDEBAR_WIDTH,
          APP_SETTINGS_PANE_WIDTH + "px",
          "0px",
          "1fr",
          "0px",
        ]);
        break;
      case EditorState.LIBRARIES:
        setColumns([SIDEBAR_WIDTH, "250px", "0px", "1fr", "0px"]);
        break;
      case EditorState.EDITOR:
        if (isPreviewMode) {
          setColumns(["0px", "0px", "0px", "1fr", "0px"]);
        } else if (segment !== EditorEntityTab.UI) {
          if (editorMode === EditorViewMode.SplitScreen) {
            setColumns([SIDEBAR_WIDTH, "0px", LeftPaneWidth, "1fr", "0px"]);
          } else {
            setColumns([SIDEBAR_WIDTH, "255px", "1fr", "0px", "0px"]);
          }
        } else {
          setColumns([
            SIDEBAR_WIDTH,
            "255px",
            "0px",
            "1fr",
            PropertyPaneWidth + "px",
          ]);
        }
    }
  }, [
    appState,
    isPreviewMode,
    LeftPaneWidth,
    PropertyPaneWidth,
    segment,
    editorMode,
  ]);

  return [rows, columns, areas];
}

/**
 * OldName: MainContainer
 */
function IDE() {
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
          width={"100vw"}
        >
          <LayoutArea name={Areas.Sidebar}>
            <Sidebar />
          </LayoutArea>
          <LayoutArea name={Areas.Explorer}>
            <LeftPane />
          </LayoutArea>
          <LayoutArea name={Areas.CodeEditor}>
            <CodeEditor />
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

IDE.displayName = "AppsmithIDE";

export default React.memo(IDE);

import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { ResizerCSS } from "components/editorComponents/Debugger/Resizer";
import Resizable from "components/editorComponents/Debugger/Resizer";
import { useSelector } from "react-redux";
import { getResponsePaneHeight } from "selectors/debuggerSelectors";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import ActionExecutionInProgressView from "components/editorComponents/ActionExecutionInProgressView";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import type { BottomTab } from "components/editorComponents/EntityBottomTabs";
import EntityBottomTabs from "components/editorComponents/EntityBottomTabs";

const Container = styled.div`
  ${ResizerCSS};
  height: ${ActionExecutionResizerHeight}px;
  // Minimum height of bottom tabs as it can be resized
  min-height: 36px;
  width: 100%;
  background-color: var(--ads-v2-color-bg);
  border-top: 1px solid var(--ads-v2-color-border);
  z-index: 6;
`;

interface Props {
  onResizeComplete: (height: number) => void;
  isRunning: boolean;
  tabs: BottomTab[];
}

const ActionDrawer = (props: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const responsePaneHeight = useSelector(getResponsePaneHeight);
  const [selectedTab, setSelectedTab] = useState<string>("");
  useEffect(() => {
    if (props.tabs.length) {
      setSelectedTab(props.tabs[0].key);
    }
  }, []);

  return (
    <Container ref={panelRef}>
      <Resizable
        initialHeight={responsePaneHeight}
        onResizeComplete={props.onResizeComplete}
        openResizer={props.isRunning}
        panelRef={panelRef}
        snapToHeight={ActionExecutionResizerHeight}
      />
      {props.isRunning && (
        <ActionExecutionInProgressView
          actionType="query"
          theme={EditorTheme.LIGHT}
        />
      )}
      <EntityBottomTabs
        onSelect={setSelectedTab}
        selectedTabKey={selectedTab}
        tabs={props.tabs}
      />
    </Container>
  );
};

export default ActionDrawer;

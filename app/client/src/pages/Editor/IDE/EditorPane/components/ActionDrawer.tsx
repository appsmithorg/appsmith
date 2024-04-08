import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { ResizerCSS } from "components/editorComponents/Debugger/Resizer";
import Resizable from "components/editorComponents/Debugger/Resizer";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
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
  height?: number;
}

const ActionDrawer = (props: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [selectedTab, setSelectedTab] = useState<string>("");
  useEffect(() => {
    if (props.tabs.length) {
      setSelectedTab(props.tabs[0].key);
    }
  }, []);

  return (
    <Container ref={panelRef}>
      <Resizable
        initialHeight={props.height || ActionExecutionResizerHeight}
        onResizeComplete={props.onResizeComplete}
        openResizer={props.isRunning}
        panelRef={panelRef}
        snapToHeight={ActionExecutionResizerHeight}
      />
      <EntityBottomTabs
        onSelect={setSelectedTab}
        selectedTabKey={selectedTab}
        tabs={props.tabs}
      />
    </Container>
  );
};

export default ActionDrawer;

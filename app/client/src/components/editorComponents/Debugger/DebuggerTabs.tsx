import React, { RefObject, useRef, useState } from "react";
import styled from "styled-components";
import { TabComponent } from "components/ads/Tabs";
import Icon, { IconSize } from "components/ads/Icon";
import DebuggerLogs from "./DebuggerLogs";
import { useDispatch } from "react-redux";
import { showDebugger } from "actions/debuggerActions";
import Errors from "./Errors";
import Resizer from "./Resizer";

const TABS_HEADER_HEIGHT = 36;
const MAX_DEBUGGER_HEIGHT = 337;
const MIN_DEBUGGER_HEIGHT = 115;

const Container = styled.div`
  position: fixed;
  bottom: 0;
  height: ${MAX_DEBUGGER_HEIGHT}px;
  background-color: ${(props) => props.theme.colors.debugger.background};
  width: calc(100vw - ${(props) => props.theme.sidebarWidth});
  z-index: 10;

  ul.react-tabs__tab-list {
    padding: 0px ${(props) => props.theme.spaces[12]}px;
  }
  .react-tabs__tab-panel {
    height: calc(100% - ${TABS_HEADER_HEIGHT}px);
  }

  .close-debugger {
    position: absolute;
    top: 0px;
    right: 0px;
    padding: 12px 15px;
  }
`;

type DebuggerTabsProps = {
  defaultIndex: number;
};

const DebuggerTabs = (props: DebuggerTabsProps) => {
  const [selectedIndex, setSelectedIndex] = useState(props.defaultIndex);
  const dispatch = useDispatch();
  const panelRef: RefObject<HTMLDivElement> = useRef(null);

  const handleResize = (movementY: number) => {
    const panel = panelRef.current;
    if (!panel) return;

    const { height } = panel.getBoundingClientRect();

    const resizeTop = () => {
      const updatedHeight = height - movementY;

      if (
        updatedHeight < MAX_DEBUGGER_HEIGHT &&
        updatedHeight > MIN_DEBUGGER_HEIGHT
      ) {
        panel.style.height = `${height - movementY}px`;
      }
    };

    resizeTop();
  };

  return (
    <Container ref={panelRef}>
      <Resizer onResize={handleResize} />
      <TabComponent
        selectedIndex={selectedIndex}
        onSelect={(index) => setSelectedIndex(index)}
        tabs={[
          {
            key: "errors",
            title: "Errors",
            panelComponent: <Errors />,
          },
          {
            key: "logs",
            title: "Logs",
            panelComponent: <DebuggerLogs />,
          },
        ]}
      />
      <Icon
        className="close-debugger"
        name="cross"
        size={IconSize.SMALL}
        onClick={() => {
          dispatch(showDebugger(false));
        }}
      />
    </Container>
  );
};

export default DebuggerTabs;

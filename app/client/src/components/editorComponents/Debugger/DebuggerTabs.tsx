import React, { RefObject, useRef, useState } from "react";
import styled from "styled-components";
import { TabComponent } from "components/ads/Tabs";
import Icon, { IconSize } from "components/ads/Icon";
import DebuggerLogs from "./DebuggerLogs";
import { useDispatch } from "react-redux";
import { showDebugger } from "actions/debuggerActions";
import Errors from "./Errors";
import Resizer, { ResizerCSS } from "./Resizer";

const TABS_HEADER_HEIGHT = 36;

const Container = styled.div`
  ${ResizerCSS}
  height: 337px;
  min-height: ${TABS_HEADER_HEIGHT}px;
  background-color: ${(props) => props.theme.colors.debugger.background};

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

  return (
    <Container ref={panelRef}>
      <Resizer panelRef={panelRef} />
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

import React, { RefObject, useRef, useState } from "react";
import styled from "styled-components";
import { TabComponent } from "components/ads/Tabs";
import Icon, { IconSize } from "components/ads/Icon";
import DebuggerLogs from "./DebuggerLogs";
import { useDispatch } from "react-redux";
import { showDebugger } from "actions/debuggerActions";
import Errors from "./Errors";
import Resizer, { ResizerCSS } from "./Resizer";
import AnalyticsUtil from "utils/AnalyticsUtil";

const TABS_HEADER_HEIGHT = 36;

const Container = styled.div`
  ${ResizerCSS}
  position: fixed;
  bottom: 0;
  height: 25%;
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

const DEBUGGER_TABS = [
  {
    key: "ERROR",
    title: "Errors",
    panelComponent: <Errors hasShortCut />,
  },
  {
    key: "LOGS",
    title: "Logs",
    panelComponent: <DebuggerLogs hasShortCut />,
  },
];

const DebuggerTabs = (props: DebuggerTabsProps) => {
  const [selectedIndex, setSelectedIndex] = useState(props.defaultIndex);
  const dispatch = useDispatch();
  const panelRef: RefObject<HTMLDivElement> = useRef(null);
  const onTabSelect = (index: number) => {
    AnalyticsUtil.logEvent("DEBUGGER_TAB_SWITCH", {
      tabName: DEBUGGER_TABS[index].key,
    });

    setSelectedIndex(index);
  };
  const onClose = () => dispatch(showDebugger(false));

  return (
    <Container ref={panelRef}>
      <Resizer panelRef={panelRef} />
      <TabComponent
        selectedIndex={selectedIndex}
        onSelect={onTabSelect}
        tabs={DEBUGGER_TABS}
      />
      <Icon
        className="close-debugger"
        name="cross"
        size={IconSize.SMALL}
        onClick={onClose}
      />
    </Container>
  );
};

export default DebuggerTabs;

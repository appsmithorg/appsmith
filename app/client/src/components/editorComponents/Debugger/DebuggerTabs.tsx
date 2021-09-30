import React, { RefObject, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { TabComponent } from "components/ads/Tabs";
import Icon, { IconSize } from "components/ads/Icon";
import DebuggerLogs from "./DebuggerLogs";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentTab, showDebugger } from "actions/debuggerActions";
import Errors from "./Errors";
import Resizer, { ResizerCSS } from "./Resizer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import EntityDeps from "./EntityDependecies";
import {
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  INSPECT_ENTITY,
} from "constants/messages";
import { stopEventPropagation } from "utils/AppsmithUtils";
import { getCurrentDebuggerTab } from "selectors/debuggerSelectors";
import { DEBUGGER_TAB_KEYS } from "./helpers";
import { Colors } from "constants/Colors";

const TABS_HEADER_HEIGHT = 36;

const Container = styled.div`
  ${ResizerCSS}
  position: absolute;
  bottom: 0;
  height: 25%;
  min-height: ${TABS_HEADER_HEIGHT}px;
  background-color: ${(props) => props.theme.colors.debugger.background};
  border: 1px solid ${Colors.ALTO};

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
    key: DEBUGGER_TAB_KEYS.ERROR_TAB,
    title: createMessage(DEBUGGER_ERRORS),
    panelComponent: <Errors hasShortCut />,
  },
  {
    key: DEBUGGER_TAB_KEYS.LOGS_TAB,
    title: createMessage(DEBUGGER_LOGS),
    panelComponent: <DebuggerLogs hasShortCut />,
  },
  {
    key: DEBUGGER_TAB_KEYS.INSPECT_TAB,
    title: createMessage(INSPECT_ENTITY),
    panelComponent: <EntityDeps />,
  },
];

function DebuggerTabs(props: DebuggerTabsProps) {
  const [selectedIndex, setSelectedIndex] = useState(props.defaultIndex);
  const currentTab = useSelector(getCurrentDebuggerTab);
  const dispatch = useDispatch();
  const panelRef: RefObject<HTMLDivElement> = useRef(null);
  const onTabSelect = (index: number) => {
    AnalyticsUtil.logEvent("DEBUGGER_TAB_SWITCH", {
      tabName: DEBUGGER_TABS[index].key,
    });
    setSelectedIndex(index);
    dispatch(setCurrentTab(DEBUGGER_TABS[index].key));
  };
  const onClose = () => dispatch(showDebugger(false));

  useEffect(() => {
    const index = DEBUGGER_TABS.findIndex((tab) => tab.key === currentTab);

    if (index >= 0) {
      onTabSelect(index);
    } else {
      onTabSelect(0);
    }
  }, [currentTab]);

  return (
    <Container onClick={stopEventPropagation} ref={panelRef}>
      <Resizer panelRef={panelRef} />
      <TabComponent
        onSelect={onTabSelect}
        selectedIndex={selectedIndex}
        tabs={DEBUGGER_TABS}
      />
      <Icon
        className="close-debugger t--close-debugger"
        name="cross"
        onClick={onClose}
        size={IconSize.SMALL}
      />
    </Container>
  );
}

export default DebuggerTabs;

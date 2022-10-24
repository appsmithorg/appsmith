import React, { RefObject, useRef } from "react";
import styled from "styled-components";
import { Icon, IconSize } from "design-system";
import DebuggerLogs from "./DebuggerLogs";
import { useDispatch, useSelector } from "react-redux";
import {
  setCanvasDebuggerSelectedTab,
  showDebugger,
} from "actions/debuggerActions";
import Errors from "./Errors";
import Resizer, { ResizerCSS } from "./Resizer";
import EntityDeps from "./EntityDependecies";
import {
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  INSPECT_ENTITY,
} from "@appsmith/constants/messages";
import { stopEventPropagation } from "utils/AppsmithUtils";
import { DEBUGGER_TAB_KEYS } from "./helpers";
import { Colors } from "constants/Colors";
import EntityBottomTabs from "../EntityBottomTabs";
import { getSelectedCanvasDebuggerTab } from "selectors/editorContextSelectors";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";

const TABS_HEADER_HEIGHT = 36;

const Container = styled.div`
  ${ResizerCSS}
  position: absolute;
  bottom: 0;
  height: ${ActionExecutionResizerHeight}px;
  min-height: ${TABS_HEADER_HEIGHT}px;
  background-color: ${(props) => props.theme.colors.debugger.background};
  border-top: 1px solid ${Colors.ALTO};

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

function DebuggerTabs() {
  const dispatch = useDispatch();
  const panelRef: RefObject<HTMLDivElement> = useRef(null);
  const selectedTab = useSelector(getSelectedCanvasDebuggerTab);
  const setSelectedTab = (tabKey: string) => {
    dispatch(setCanvasDebuggerSelectedTab(tabKey));
  };
  const onClose = () => dispatch(showDebugger(false));

  return (
    <Container
      className="t--debugger-tabs-container"
      onClick={stopEventPropagation}
      ref={panelRef}
    >
      <Resizer panelRef={panelRef} />
      <EntityBottomTabs
        expandedHeight={`${ActionExecutionResizerHeight}px`}
        onSelect={setSelectedTab}
        selectedTabKey={selectedTab}
        tabs={DEBUGGER_TABS}
      />
      <Icon
        className="close-debugger t--close-debugger"
        name="expand-more"
        onClick={onClose}
        size={IconSize.XXXXL}
      />
    </Container>
  );
}

export default DebuggerTabs;

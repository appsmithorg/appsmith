import React, { useCallback } from "react";

import { IDEBottomView, ViewDisplayMode, ViewHideBehaviour } from "IDE";
import {
  setDebuggerSelectedTab,
  setResponsePaneHeight,
  showDebugger,
} from "actions/debuggerActions";
import {
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  INSPECT_ENTITY,
  createMessage,
} from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import { useDispatch, useSelector } from "react-redux";
import {
  getDebuggerSelectedTab,
  getErrorCount,
  getResponsePaneHeight,
} from "selectors/debuggerSelectors";

import EntityBottomTabs from "../EntityBottomTabs";
import DebuggerLogs from "./DebuggerLogs";
import EntityDeps from "./EntityDependecies";
import Errors from "./Errors";
import { DEBUGGER_TAB_KEYS } from "./helpers";

function DebuggerTabs() {
  const dispatch = useDispatch();
  const selectedTab = useSelector(getDebuggerSelectedTab);
  // fetch the error count from the store.
  const errorCount = useSelector(getErrorCount);
  // get the height of the response pane.
  const responsePaneHeight = useSelector(getResponsePaneHeight);
  // set the height of the response pane.
  const updateResponsePaneHeight = useCallback((height: number) => {
    dispatch(setResponsePaneHeight(height));
  }, []);
  const setSelectedTab = (tabKey: string) => {
    if (tabKey === DEBUGGER_TAB_KEYS.ERROR_TAB) {
      AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
        source: "WIDGET_EDITOR",
      });
    }
    dispatch(setDebuggerSelectedTab(tabKey));
  };
  const onClose = () => dispatch(showDebugger(false));

  const DEBUGGER_TABS = [
    {
      key: DEBUGGER_TAB_KEYS.ERROR_TAB,
      title: createMessage(DEBUGGER_ERRORS),
      count: errorCount,
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

  // Do not render if response, header or schema tab is selected in the bottom bar.
  const shouldRender = !(
    selectedTab === DEBUGGER_TAB_KEYS.RESPONSE_TAB ||
    selectedTab === DEBUGGER_TAB_KEYS.HEADER_TAB ||
    selectedTab === DEBUGGER_TAB_KEYS.SCHEMA_TAB
  );

  return (
    <IDEBottomView
      behaviour={ViewHideBehaviour.CLOSE}
      className="t--debugger-tabs-container"
      displayMode={ViewDisplayMode.OVERLAY}
      height={responsePaneHeight}
      hidden={!shouldRender}
      onHideClick={onClose}
      setHeight={updateResponsePaneHeight}
    >
      <EntityBottomTabs
        expandedHeight={`${ActionExecutionResizerHeight}px`}
        onSelect={setSelectedTab}
        selectedTabKey={selectedTab}
        tabs={DEBUGGER_TABS}
      />
    </IDEBottomView>
  );
}

export default DebuggerTabs;

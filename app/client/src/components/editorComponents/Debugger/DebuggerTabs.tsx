import React, { useCallback } from "react";
import DebuggerLogs from "./DebuggerLogs";
import { useDispatch, useSelector } from "react-redux";
import {
  setDebuggerSelectedTab,
  setResponsePaneHeight,
  showDebugger,
} from "actions/debuggerActions";
import {
  getDebuggerSelectedTab,
  getErrorCount,
  getResponsePaneHeight,
} from "selectors/debuggerSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import Errors from "./Errors";
import {
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  DEBUGGER_STATE,
} from "ee/constants/messages";
import { DEBUGGER_TAB_KEYS } from "./constants";
import EntityBottomTabs from "../EntityBottomTabs";
import { ActionExecutionResizerHeight } from "PluginActionEditor/components/PluginActionResponse/constants";
import { IDEBottomView, ViewHideBehaviour, ViewDisplayMode } from "IDE";
import { StateInspector } from "./StateInspector";

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
      key: DEBUGGER_TAB_KEYS.LOGS_TAB,
      title: createMessage(DEBUGGER_LOGS),
      panelComponent: <DebuggerLogs hasShortCut />,
    },
    {
      key: DEBUGGER_TAB_KEYS.ERROR_TAB,
      title: createMessage(DEBUGGER_ERRORS),
      count: errorCount,
      panelComponent: <Errors hasShortCut />,
    },
    {
      key: DEBUGGER_TAB_KEYS.STATE_TAB,
      title: createMessage(DEBUGGER_STATE),
      panelComponent: <StateInspector />,
    },
  ];

  // Do not render if response, header or schema tab is selected in the bottom bar.
  const shouldRender = !(
    selectedTab === DEBUGGER_TAB_KEYS.RESPONSE_TAB ||
    selectedTab === DEBUGGER_TAB_KEYS.HEADER_TAB ||
    selectedTab === DEBUGGER_TAB_KEYS.DATASOURCE_TAB
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

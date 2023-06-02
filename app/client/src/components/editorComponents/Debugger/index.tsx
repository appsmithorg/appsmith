import React from "react";
import { useDispatch, useSelector } from "react-redux";
import DebuggerTabs from "./DebuggerTabs";
import type { AppState } from "@appsmith/reducers";
import {
  setDebuggerSelectedTab,
  setErrorCount,
  showDebugger as showDebuggerAction,
} from "actions/debuggerActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { stopEventPropagation } from "utils/AppsmithUtils";
import {
  getDebuggerSelectedTab,
  getMessageCount,
  showDebuggerFlag,
} from "selectors/debuggerSelectors";
import { DEBUGGER_TAB_KEYS } from "./helpers";
import { Button, Tooltip } from "design-system";

function Debugger() {
  // Debugger render flag
  const showDebugger = useSelector(showDebuggerFlag);

  return showDebugger ? <DebuggerTabs /> : null;
}

export function DebuggerTrigger() {
  const dispatch = useDispatch();
  const showDebugger = useSelector(
    (state: AppState) => state.ui.debugger.isOpen,
  );
  const selectedTab = useSelector(getDebuggerSelectedTab);
  const messageCounters = useSelector(getMessageCount);
  const totalMessageCount = messageCounters.errors + messageCounters.warnings;
  dispatch(setErrorCount(totalMessageCount));

  const onClick = (e: any) => {
    // If debugger is already open and selected tab is error tab then we will close debugger.
    if (showDebugger && selectedTab === DEBUGGER_TAB_KEYS.ERROR_TAB) {
      dispatch(showDebuggerAction(false));
    } else {
      // If debugger is not open then we will open debugger and show error tab.
      if (!showDebugger) {
        dispatch(showDebuggerAction(true));
      }
      // Select error tab if debugger is open and selected tab is not error tab.
      // And also when we are opening debugger.
      dispatch(setDebuggerSelectedTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
    }
    if (!showDebugger)
      AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
        source: "CANVAS",
      });
    stopEventPropagation(e);
  };

  //tooltip will always show error count as we are opening error tab on click of debugger.
  const tooltipContent =
    totalMessageCount !== 0
      ? `View details for ${totalMessageCount} ${
          totalMessageCount > 1 ? "errors" : "error"
        }`
      : `No errors`;

  return (
    <Tooltip content={tooltipContent}>
      <Button
        className="t--debugger-count"
        kind={totalMessageCount > 0 ? "error" : "tertiary"}
        onClick={onClick}
        size="md"
        startIcon={totalMessageCount ? "close-circle" : "close-circle-line"}
      >
        {totalMessageCount > 99 ? "99+" : totalMessageCount}
      </Button>
    </Tooltip>
  );
}

export default Debugger;

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DebuggerTabs from "./DebuggerTabs";
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
  hideDebuggerIconSelector,
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
  const showDebugger = useSelector(showDebuggerFlag);
  const selectedTab = useSelector(getDebuggerSelectedTab);
  const messageCounters = useSelector(getMessageCount);
  const hideDebuggerIcon = useSelector(hideDebuggerIconSelector);

  useEffect(() => {
    dispatch(setErrorCount(messageCounters.errors));
  });

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
    messageCounters.errors !== 0
      ? `View details for ${messageCounters.errors} ${
          messageCounters.errors > 1 ? "errors" : "error"
        }`
      : `No errors`;

  if (hideDebuggerIcon) return null;

  return (
    <Tooltip content={tooltipContent}>
      <Button
        className="t--debugger-count"
        kind={messageCounters.errors > 0 ? "error" : "tertiary"}
        onClick={onClick}
        size="md"
        startIcon={
          messageCounters.errors ? "close-circle" : "close-circle-line"
        }
      >
        {messageCounters.errors > 99 ? "99+" : messageCounters.errors}
      </Button>
    </Tooltip>
  );
}

export default Debugger;

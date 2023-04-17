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
  const showDebugger = useSelector(
    (state: AppState) => state.ui.debugger.isOpen,
  );
  const messageCounters = useSelector(getMessageCount);
  const totalMessageCount = messageCounters.errors + messageCounters.warnings;
  const hideDebuggerIcon = useSelector(hideDebuggerIconSelector);
  dispatch(setErrorCount(totalMessageCount));

  const onClick = (e: any) => {
    //Removed canvas condition
    //Because we want to show debugger in all pages.
    //Updated in PR #21753 and commit id ee87fa2
    dispatch(showDebuggerAction(!showDebugger));
    if (!showDebugger)
      AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
        source: "CANVAS",
      });
    //Removed as this logic was confusing
    // Now on click of debugger we will always show error tab.
    dispatch(setDebuggerSelectedTab(DEBUGGER_TAB_KEYS.ERROR_TAB));

    stopEventPropagation(e);
  };

  //tooltip will always show error count as we are opening error tab on click of debugger.
  const tooltipContent = `View details for ${totalMessageCount} ${
    totalMessageCount > 1 ? "errors" : "error"
  }`;

  if (hideDebuggerIcon) return null;

  return (
    <Tooltip content={tooltipContent}>
      <Button
        className="t--debugger-count"
        color={"red"}
        kind="tertiary"
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

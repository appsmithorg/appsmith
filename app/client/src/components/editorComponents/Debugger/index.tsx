import { Icon, IconSize } from "design-system";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import DebuggerTabs from "./DebuggerTabs";
import { AppState } from "@appsmith/reducers";
import {
  setCanvasDebuggerSelectedTab,
  showDebugger as showDebuggerAction,
} from "actions/debuggerActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Colors } from "constants/Colors";
import { stopEventPropagation } from "utils/AppsmithUtils";
import {
  getMessageCount,
  hideDebuggerIconSelector,
} from "selectors/debuggerSelectors";
import { matchBuilderPath } from "constants/routes";
import { getTypographyByKey, TooltipComponent } from "design-system";
import { DEBUGGER_TAB_KEYS } from "./helpers";

function Debugger() {
  const showDebugger = useSelector(
    (state: AppState) => state.ui.debugger.isOpen,
  );

  return showDebugger ? <DebuggerTabs /> : null;
}

const TriggerContainer = styled.div<{
  errorCount: number;
  warningCount: number;
}>`
  position: relative;
  overflow: visible;
  display: flex;
  align-items: center;

  .debugger-count {
    color: ${Colors.WHITE};
    ${getTypographyByKey("btnSmall")}
    height: 16px;
    width: 16px;
    background-color: ${(props) =>
      props.errorCount + props.warningCount > 0
        ? props.errorCount === 0
          ? props.theme.colors.debugger.floatingButton.warningCount
          : props.theme.colors.debugger.floatingButton.errorCount
        : props.theme.colors.debugger.floatingButton.noErrorCount};
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    top: -8px;
    left: 100%;
    font-size: 10px;
    border-radius: 50%;
  }
`;

export function DebuggerTrigger() {
  const dispatch = useDispatch();
  const showDebugger = useSelector(
    (state: AppState) => state.ui.debugger.isOpen,
  );
  const messageCounters = useSelector(getMessageCount);
  const totalMessageCount = messageCounters.errors + messageCounters.warnings;
  const hideDebuggerIcon = useSelector(hideDebuggerIconSelector);

  const onClick = (e: any) => {
    const isOnCanvas = matchBuilderPath(window.location.pathname);
    if (isOnCanvas) {
      dispatch(showDebuggerAction(!showDebugger));
      if (!showDebugger)
        AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
          source: "CANVAS",
        });

      return;
    } else {
      if (totalMessageCount > 0) {
        dispatch(setCanvasDebuggerSelectedTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
      } else {
        dispatch(setCanvasDebuggerSelectedTab(DEBUGGER_TAB_KEYS.LOGS_TAB));
      }
    }
    stopEventPropagation(e);
  };

  const tooltipContent =
    totalMessageCount > 0
      ? `View details for ${totalMessageCount} ${
          totalMessageCount > 1 ? "errors" : "error"
        }`
      : "View logs";

  if (hideDebuggerIcon) return null;

  return (
    <TriggerContainer
      className="t--debugger"
      errorCount={messageCounters.errors}
      warningCount={messageCounters.warnings}
    >
      <TooltipComponent
        content={tooltipContent}
        modifiers={{
          preventOverflow: { enabled: true },
        }}
      >
        <Icon name="bug" onClick={onClick} size={IconSize.XL} />
      </TooltipComponent>
      {!!messageCounters.errors && (
        <div className="debugger-count t--debugger-count">
          {totalMessageCount > 9 ? "9+" : totalMessageCount}
        </div>
      )}
    </TriggerContainer>
  );
}

export default Debugger;

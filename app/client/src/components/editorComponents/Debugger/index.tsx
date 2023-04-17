import React from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
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
import { getTypographyByKey, TooltipComponent } from "design-system-old";
import { DEBUGGER_TAB_KEYS } from "./helpers";
import { BottomBarCTAStyles } from "pages/Editor/BottomBar/styles";
import { Button } from "design-system";
import { Colors } from "constants/Colors";

function Debugger() {
  // Debugger render flag
  const showDebugger = useSelector(showDebuggerFlag);

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
  justify-content: center;
  gap: 4px;
  padding: 9px 16px;
  border-left: 1px solid ${Colors.GRAY_200};
  cursor: pointer;
  ${BottomBarCTAStyles}

  .debugger-count {
    color: ${(props) =>
      props.errorCount
        ? props.theme.colors.debugger.floatingButton.errorCount
        : Colors.GRAY_700};
    ${getTypographyByKey("btnSmall")}
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 400;
    line-height: 14px;
    -webkit-user-select: none; /* Safari */
    -ms-user-select: none; /* IE 10 and IE 11 */
    user-select: none; /* Standard syntax */
  }
`;

export const ResizerMainContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 50px);
  overflow: hidden;
  gap: 10px;
  .db-form-resizer-content {
    flex-direction: column;
  }
`;

export const ResizerContentContainer = styled.div`
  overflow: auto;
  flex: 1;
  position: relative;
  display: flex;
`;

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
    //Removed canavs condition
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
    <TooltipComponent
      content={tooltipContent}
      modifiers={{
        preventOverflow: { enabled: true },
      }}
    >
      <TriggerContainer
        className="t--debugger"
        errorCount={messageCounters.errors}
        onClick={onClick}
        warningCount={messageCounters.warnings}
      >
        <Button
          isIconButton
          kind="tertiary"
          onClick={onClick}
          size="md"
          startIcon={totalMessageCount ? "close-circle" : "close-circle-line"}
        />
        <div className="debugger-count t--debugger-count">
          {totalMessageCount > 99 ? "99+" : totalMessageCount}
        </div>
      </TriggerContainer>
    </TooltipComponent>
  );
}

export default Debugger;

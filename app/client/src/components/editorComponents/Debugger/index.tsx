import { Icon, IconSize } from "design-system-old";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { useTheme } from "styled-components";
import { get } from "lodash";
import DebuggerTabs from "./DebuggerTabs";
import type { AppState } from "@appsmith/reducers";
import {
  setDebuggerSelectedTab,
  showDebugger as showDebuggerAction,
} from "actions/debuggerActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { stopEventPropagation } from "utils/AppsmithUtils";
import {
  getMessageCount,
  hideDebuggerIconSelector,
} from "selectors/debuggerSelectors";
import { getTypographyByKey, TooltipComponent } from "design-system-old";
import { DEBUGGER_TAB_KEYS } from "./helpers";
import { BottomBarCTAStyles } from "pages/Editor/BottomBar/styles";
import { Colors } from "constants/Colors";

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
  justify-content: center;
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
    height: 16px;
    width: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 400;
    line-height 14px;
    -webkit-user-select: none; /* Safari */
    -ms-user-select: none; /* IE 10 and IE 11 */
    user-select: none; /* Standard syntax */
  }
`;

export function DebuggerTrigger() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const showDebugger = useSelector(
    (state: AppState) => state.ui.debugger.isOpen,
  );
  const messageCounters = useSelector(getMessageCount);
  const totalMessageCount = messageCounters.errors + messageCounters.warnings;
  const hideDebuggerIcon = useSelector(hideDebuggerIconSelector);

  const onClick = (e: any) => {
    //Removed canavs condition
    //Because we want to show debugger in all pages.
    if (!showDebugger) {
      dispatch(showDebuggerAction(!showDebugger));
      if (!showDebugger)
        AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
          source: "CANVAS",
        });
    }
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
    <TriggerContainer
      className="t--debugger"
      errorCount={messageCounters.errors}
      onClick={onClick}
      warningCount={messageCounters.warnings}
    >
      <TooltipComponent
        content={tooltipContent}
        modifiers={{
          preventOverflow: { enabled: true },
        }}
      >
        <Icon
          fillColor={
            totalMessageCount
              ? get(theme, "colors.debugger.error.hoverIconColor")
              : Colors.GREY_7
          }
          name={totalMessageCount ? "close-circle" : "close-circle-line"}
          size={IconSize.XL}
        />
      </TooltipComponent>
      <div className="debugger-count t--debugger-count">
        {totalMessageCount > 9 ? "9+" : totalMessageCount}
      </div>
    </TriggerContainer>
  );
}

export default Debugger;

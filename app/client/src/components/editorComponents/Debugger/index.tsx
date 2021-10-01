import { Classes } from "components/ads/common";
import Icon, { IconSize } from "components/ads/Icon";
import React from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "store";
import styled from "styled-components";
import DebuggerTabs from "./DebuggerTabs";
import { AppState } from "reducers";
import { showDebugger as showDebuggerAction } from "actions/debuggerActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Layers } from "constants/Layers";
import { stopEventPropagation } from "utils/AppsmithUtils";
import { getMessageCount } from "selectors/debuggerSelectors";
import getFeatureFlags from "utils/featureFlags";
import { setActionTabsInitialIndex } from "actions/pluginActionActions";
import {
  matchApiPath,
  matchBuilderPath,
  matchQueryPath,
} from "constants/routes";
import TooltipComponent from "components/ads/Tooltip";

const Container = styled.div<{ errorCount: number; warningCount: number }>`
  z-index: ${Layers.debugger};
  background-color: ${(props) =>
    props.theme.colors.debugger.floatingButton.background};
  position: absolute;
  right: 20px;
  bottom: 20px;
  cursor: pointer;
  padding: ${(props) => props.theme.spaces[6]}px;
  color: ${(props) => props.theme.colors.debugger.floatingButton.color};
  border-radius: 50px;
  box-shadow: ${(props) => props.theme.colors.debugger.floatingButton.shadow};

  .${Classes.ICON} {
    &:hover {
      path {
        fill: ${(props) => props.theme.colors.icon.normal};
      }
    }
  }

  .debugger-count {
    color: ${Colors.WHITE};
    ${(props) => getTypographyByKey(props, "h6")}
    height: 16px;
    padding: ${(props) => props.theme.spaces[1]}px;
    background-color: ${(props) =>
      props.errorCount + props.warningCount > 0
        ? props.errorCount === 0
          ? props.theme.colors.debugger.floatingButton.warningCount
          : props.theme.colors.debugger.floatingButton.errorCount
        : props.theme.colors.debugger.floatingButton.noErrorCount};
    border-radius: 10px;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    top: 0;
    right: 0;
  }
`;

function Debugger() {
  const dispatch = useDispatch();
  const messageCounters = useSelector(getMessageCount);

  const totalMessageCount = messageCounters.errors + messageCounters.warnings;
  const showDebugger = useSelector(
    (state: AppState) => state.ui.debugger.isOpen,
  );

  const onClick = (e: any) => {
    AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
      source: "CANVAS",
    });
    dispatch(showDebuggerAction(true));
    stopEventPropagation(e);
  };

  if (!showDebugger && !getFeatureFlags().BOTTOM_BAR)
    return (
      <Container
        className="t--debugger"
        errorCount={messageCounters.errors}
        onClick={onClick}
        warningCount={messageCounters.warnings}
      >
        <Icon name="bug" size={IconSize.XL} />
        {!!messageCounters.errors && (
          <div className="debugger-count t--debugger-count">
            {totalMessageCount}
          </div>
        )}
      </Container>
    );
  return showDebugger ? (
    <DebuggerTabs defaultIndex={totalMessageCount ? 0 : 1} />
  ) : null;
}

const TriggerContainer = styled.div<{
  errorCount: number;
  warningCount: number;
}>`
  position: relative;
  overflow: visible;
  display: flex;
  align-items: center;
  margin-right: ${(props) => props.theme.spaces[10]}px;

  .debugger-count {
    color: ${Colors.WHITE};
    ${(props) => getTypographyByKey(props, "p3")}
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
    top: 0;
    left: 100%;
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

  const onClick = (e: any) => {
    const isOnCanvas = matchBuilderPath(window.location.pathname);
    if (isOnCanvas) {
      dispatch(showDebuggerAction(!showDebugger));
      if (!showDebugger)
        AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
          source: "CANVAS",
        });
    }

    const onApiEditor = matchApiPath(window.location.pathname);
    const onQueryEditor = matchQueryPath(window.location.pathname);
    if (onApiEditor || onQueryEditor) {
      dispatch(setActionTabsInitialIndex(1));
    }
    stopEventPropagation(e);
  };

  const tooltipContent =
    totalMessageCount > 0
      ? `View details for ${totalMessageCount} ${
          totalMessageCount > 1 ? "errors" : "error"
        }`
      : "View logs";

  return (
    <TriggerContainer
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

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

const Container = styled.div<{ errorCount: number }>`
  background-color: ${(props) =>
    props.theme.colors.debugger.floatingButton.background};
  position: fixed;
  right: 20px;
  bottom: 20px;
  cursor: pointer;
  padding: 19px;
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
    font-size: 14px;
    font-weight: 500;
    ${(props) => getTypographyByKey(props, "h6")}
    height: 20px;
    padding: 6px;
    background-color: ${(props) =>
      !!props.errorCount
        ? props.theme.colors.debugger.floatingButton.errorCount
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
  const errorCount = useSelector(
    (state: AppState) => Object.keys(state.ui.debugger.errors).length,
  );
  const showDebugger = useSelector(
    (state: AppState) => state.ui.debugger.isOpen,
  );

  const onClick = () => {
    AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
      source: "CANVAS",
    });
    dispatch(showDebuggerAction(true));
  };

  if (!showDebugger)
    return (
      <Container
        className="t--debugger"
        errorCount={errorCount}
        onClick={onClick}
      >
        <Icon name="bug" size={IconSize.XXXL} />
        <div className="debugger-count">{errorCount}</div>
      </Container>
    );
  return <DebuggerTabs defaultIndex={errorCount ? 0 : 1} />;
}

export default Debugger;

import React from "react";
import styled from "styled-components";
import { TabComponent } from "components/ads/Tabs";
import Icon, { IconSize } from "components/ads/Icon";
import DebuggerLogs from "./DebuggerLogs";
import { useDispatch } from "react-redux";
import { showDebugger } from "actions/debuggerActions";
import Errors from "./Errors";

const Container = styled.div`
  position: fixed;
  bottom: 0;
  height: 337px;
  background-color: ${(props) => props.theme.colors.debugger.background};
  width: calc(100vw - ${(props) => props.theme.sidebarWidth});
  z-index: 10;

  ul.react-tabs__tab-list {
    padding: 0px ${(props) => props.theme.spaces[12]}px;
  }
  .react-tabs__tab-panel {
    height: 301px;
  }

  .close-debugger {
    position: absolute;
    top: 0px;
    right: 0px;
    padding: 12px 15px;
  }
`;

const Content = () => {
  const dispatch = useDispatch();

  return (
    <Container>
      <TabComponent
        tabs={[
          {
            key: "errors",
            title: "Errors",
            panelComponent: <Errors />,
          },
          {
            key: "logs",
            title: "Logs",
            panelComponent: <DebuggerLogs />,
          },
        ]}
      />
      <Icon
        className="close-debugger"
        name="cross"
        size={IconSize.SMALL}
        onClick={() => {
          dispatch(showDebugger(false));
        }}
      />
    </Container>
  );
};

export default Content;

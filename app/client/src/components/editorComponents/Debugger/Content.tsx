import React from "react";
import styled from "styled-components";
import { TabComponent } from "components/ads/Tabs";
import DebuggerLogs from "./DebuggerLogs";
import Icon, { IconSize } from "components/ads/Icon";

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
    top: 15px;
    right: 15px;
  }
`;

const Content = (props: any) => {
  return (
    <Container>
      <TabComponent
        tabs={[
          {
            key: "logs",
            title: "Logs",
            panelComponent: <DebuggerLogs onClose={props.onClose} />,
          },
        ]}
      />
      <Icon
        className="close-debugger"
        name="downArrow"
        size={IconSize.XXS}
        onClick={props.onClose}
      />
    </Container>
  );
};

export default Content;

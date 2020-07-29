import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import styled from "styled-components";
import { Icon, IconName } from "./Icon";
import { Size } from "./Button";

const TabsWrapper = styled.div<{ shouldOverflow?: boolean }>`
  font-family: ${props => props.theme.fonts.main};
  user-select: none;
  border-radius: 0px;
  height: 100%;
  span {
    margin-right: ${props => props.theme.spaces[2] - 1}px;
  }
  .react-tabs {
    height: 100%;
  }
  .react-tabs__tab-panel {
    height: calc(100% - 32px);
    overflow: scroll;
  }
  .react-tabs__tab-list {
    border-bottom: 2px solid ${props => props.theme.colors.blackShades[3]};
    color: ${props => props.theme.colors.blackShades[6]};
    ${props =>
      props.shouldOverflow &&
      `
      overflow-y: hidden;
      overflow-x: auto;
      white-space: nowrap;
    `}
  }
  .react-tabs__tab {
    padding: ${props => props.theme.space[7]}px 0;
    margin-right: ${props => props.theme.space[15]}px;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .react-tabs__tab:hover {
    color: ${props => props.theme.colors.blackShades[9]};
    path {
      fill: ${props => props.theme.colors.blackShades[9]};
    }
  }
  .react-tabs__tab:focus {
    box-shadow: none;
    border-bottom: ${props => props.theme.colors.info.main}
      ${props => props.theme.space[16]}px solid;
    path {
      fill: ${props => props.theme.colors.blackShades[9]};
    }
  }
  .react-tabs__tab--selected {
    color: ${props => props.theme.colors.blackShades[9]};
    border: 0px solid;
    border-bottom: ${props => props.theme.colors.info.main}
      ${props => props.theme.space[16]}px solid;
    background-color: transparent;
    path {
      fill: ${props => props.theme.colors.blackShades[9]};
    }
  }
  .react-tabs__tab:focus:after {
    content: none;
    height: ${props => props.theme.space[16]}px;
    background: ${props => props.theme.colors.info.main};
  }
`;

type TabbedViewComponentType = {
  tabs: Array<{
    key: string;
    title: string;
    panelComponent: JSX.Element;
    icon?: IconName;
  }>;
  selectedIndex?: number;
  setSelectedIndex?: Function;
  overflow?: boolean;
};

export const AdsTabComponent = (props: TabbedViewComponentType) => {
  return (
    <TabsWrapper shouldOverflow={props.overflow}>
      <Tabs
        selectedIndex={props.selectedIndex}
        onSelect={(index: number) => {
          props.setSelectedIndex && props.setSelectedIndex(index);
        }}
      >
        <TabList>
          {props.tabs.map(tab => (
            <Tab key={tab.key}>
              {tab.icon ? <Icon name={tab.icon} size={Size.large} /> : null}
              {tab.title}
            </Tab>
          ))}
        </TabList>
        {props.tabs.map(tab => (
          <TabPanel key={tab.key}>{tab.panelComponent}</TabPanel>
        ))}
      </Tabs>
    </TabsWrapper>
  );
};

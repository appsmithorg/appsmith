import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import styled from "styled-components";
import Icon, { IconName } from "./Icon";
import { Size } from "./Button";

const TabsWrapper = styled.div<{ shouldOverflow?: boolean }>`
  user-select: none;
  border-radius: 0px;
  height: 100%;
  .ads-icon {
    margin-right: ${props => props.theme.spaces[3]}px;
    svg {
      width: ${props => props.theme.spaces[9]}px;
      height: ${props => props.theme.spaces[9]}px;
    }
  }
  .react-tabs {
    height: 100%;
  }
  .react-tabs__tab-panel {
    height: calc(100% - 32px);
    overflow: scroll;
  }
  .react-tabs__tab-list {
    display: flex;
    align-items: center;
    border-bottom: ${props => props.theme.spaces[1] - 2}px solid
      ${props => props.theme.colors.blackShades[3]};
    color: ${props => props.theme.colors.blackShades[6]};
    path {
      fill: ${props => props.theme.colors.blackShades[6]};
    }
    ${props =>
      props.shouldOverflow &&
      `
      overflow-y: hidden;
      overflow-x: auto;
      white-space: nowrap;
    `}
  }
  .react-tabs__tab {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 0 ${props => props.theme.spaces[4]}px 0;
    margin-right: ${props => props.theme.spaces[12] - 3}px;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-color: transparent;
    position: relative;
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
      ${props => props.theme.spaces[1] - 2}px solid;
    path {
      fill: ${props => props.theme.colors.blackShades[9]};
    }
  }
  .react-tabs__tab--selected {
    color: ${props => props.theme.colors.blackShades[9]};
    background-color: transparent;

    path {
      fill: ${props => props.theme.colors.blackShades[9]};
    }

    &::after {
      content: "";
      position: absolute;
      width: 100%;
      bottom: ${props => props.theme.spaces[0] - 1}px;
      left: ${props => props.theme.spaces[0]}px;
      height: ${props => props.theme.spaces[1] - 2}px;
      background-color: ${props => props.theme.colors.info.main};
    }
  }
  .react-tabs__tab:focus:after {
    content: none;
    height: ${props => props.theme.spaces[1] - 2}px;
    background: ${props => props.theme.colors.info.main};
  }
`;

const TabTitle = styled.span`
  font-size: ${props => props.theme.typography.h4.fontSize}px;
  font-weight: normal;
  line-height: ${props => props.theme.typography.h4.lineHeight}px;
  letter-spacing: ${props => props.theme.typography.h4.letterSpacing}px;
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
              <TabTitle>{tab.title}</TabTitle>
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

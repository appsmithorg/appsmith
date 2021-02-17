import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import styled from "styled-components";
import Icon, { IconName, IconSize } from "./Icon";
import { Classes, CommonComponentProps } from "./common";

export type TabProp = {
  key: string;
  title: string;
  panelComponent: JSX.Element;
  icon?: IconName;
};

const TabsWrapper = styled.div<{ shouldOverflow?: boolean }>`
  user-select: none;
  border-radius: 0px;
  height: 100%;
  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[3]}px;
  }
  .react-tabs {
    height: 100%;
  }
  .react-tabs__tab-panel {
    height: 100%;
    overflow: auto;
  }
  .react-tabs__tab-list {
    margin: 0px;
    display: flex;
    align-items: center;
    border-bottom: ${(props) => props.theme.spaces[1] - 2}px solid
      ${(props) => props.theme.colors.tabs.border};
    color: ${(props) => props.theme.colors.tabs.normal};
    path {
      fill: ${(props) => props.theme.colors.tabs.normal};
    }
    ${(props) =>
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
    padding: ${(props) => props.theme.spaces[3] - 1}px 0
      ${(props) => props.theme.spaces[4]}px 0;
    margin-right: ${(props) => props.theme.spaces[12] - 3}px;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-color: transparent;
    position: relative;
  }
  .react-tabs__tab:hover {
    color: ${(props) => props.theme.colors.tabs.hover};
    path {
      fill: ${(props) => props.theme.colors.tabs.hover};
    }
  }
  .react-tabs__tab--selected {
    color: ${(props) => props.theme.colors.tabs.hover};
    background-color: transparent;

    path {
      fill: ${(props) => props.theme.colors.tabs.hover};
    }

    &::after {
      content: "";
      position: absolute;
      width: 100%;
      bottom: ${(props) => props.theme.spaces[0] - 1}px;
      left: ${(props) => props.theme.spaces[0]}px;
      height: ${(props) => props.theme.spaces[1] - 2}px;
      background-color: ${(props) => props.theme.colors.info.main};
    }
  }
  .react-tabs__tab:focus {
    &::after {
      content: "";
      position: absolute;
      width: 100%;
      bottom: ${(props) => props.theme.spaces[0] - 1}px;
      left: ${(props) => props.theme.spaces[0]}px;
      height: ${(props) => props.theme.spaces[1] - 2}px;
      background-color: ${(props) => props.theme.colors.info.main};
    }
    box-shadow: none;
    border-color: transparent;
    path {
      fill: ${(props) => props.theme.colors.tabs.hover};
    }
  }
`;

const TabTitle = styled.span`
  font-size: ${(props) => props.theme.typography.h5.fontSize}px;
  font-weight: ${(props) => props.theme.typography.h5.fontWeight};
  line-height: ${(props) => props.theme.typography.h5.lineHeight - 3}px;
  letter-spacing: ${(props) => props.theme.typography.h5.letterSpacing}px;
`;

type TabbedViewComponentType = CommonComponentProps & {
  tabs: Array<TabProp>;
  selectedIndex?: number;
  onSelect?: (tabIndex: number) => void;
  overflow?: boolean;
};

export const TabComponent = (props: TabbedViewComponentType) => {
  return (
    <TabsWrapper
      shouldOverflow={props.overflow}
      data-cy={props.cypressSelector}
    >
      <Tabs
        selectedIndex={props.selectedIndex}
        onSelect={(index: number) => {
          props.onSelect && props.onSelect(index);
        }}
      >
        <TabList>
          {props.tabs.map((tab) => (
            <Tab key={tab.key}>
              {tab.icon ? <Icon name={tab.icon} size={IconSize.XXXL} /> : null}
              <TabTitle>{tab.title}</TabTitle>
            </Tab>
          ))}
        </TabList>
        {props.tabs.map((tab) => (
          <TabPanel key={tab.key}>{tab.panelComponent}</TabPanel>
        ))}
      </Tabs>
    </TabsWrapper>
  );
};

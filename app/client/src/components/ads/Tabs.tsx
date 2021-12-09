import React, { useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import styled from "styled-components";
import Icon, { IconName, IconSize } from "./Icon";
import { Classes, CommonComponentProps } from "./common";
import { useEffect } from "react";
import { Indices } from "constants/Layers";

export type TabProp = {
  key: string;
  title: string;
  count?: number;
  panelComponent?: JSX.Element;
  icon?: IconName;
  iconSize?: IconSize;
};

const TabsWrapper = styled.div<{
  shouldOverflow?: boolean;
  vertical?: boolean;
}>`
  border-radius: 0px;
  height: 100%;
  overflow: hidden;
  .react-tabs {
    height: 100%;
  }
  .react-tabs__tab-panel {
    height: calc(100% - 36px);
    overflow: auto;
  }
  .react-tabs__tab-list {
    margin: 0px;
    display: flex;
    flex-direction: ${(props) => (!!props.vertical ? "column" : "row")};
    align-items: ${(props) => (!!props.vertical ? "stretch" : "center")};
    border-bottom: none;
    color: ${(props) => props.theme.colors.tabs.normal};
    path {
      fill: ${(props) => props.theme.colors.tabs.icon};
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
    align-items: center;
    text-align: center;
    display: inline-flex;
    justify-content: center;
    border-color: transparent;
    position: relative;
    padding: 0px 3px;
    margin-right: ${(props) =>
      !props.vertical ? `${props.theme.spaces[12] - 3}px` : 0};
  }

  .react-tabs__tab,
  .react-tabs__tab:focus {
    box-shadow: none;
    border: none;
    &:after {
      content: none;
    }
  }

  .react-tabs__tab--selected {
    background-color: transparent;
    path {
      fill: ${(props) => props.theme.colors.tabs.hover};
    }
  }
`;

export const TabTitle = styled.span`
  font-size: ${(props) => props.theme.typography.h5.fontSize}px;
  font-weight: ${(props) => props.theme.typography.h5.fontWeight};
  line-height: ${(props) => props.theme.typography.h5.lineHeight - 3}px;
  letter-spacing: ${(props) => props.theme.typography.h5.letterSpacing}px;
  margin: 0;
  display: flex;
  align-items: center;
`;

export const TabCount = styled.div`
  background-color: ${(props) => props.theme.colors.tabs.countBg};
  border-radius: 8px;
  min-width: 17px;
  height: 17px;
  font-size: 9px;
  margin-left: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2px;
`;

const TabTitleWrapper = styled.div<{
  selected: boolean;
  vertical: boolean;
}>`
  display: flex;
  width: 100%;
  padding: ${(props) => props.theme.spaces[3] - 1}px
    ${(props) => (props.vertical ? `${props.theme.spaces[4] - 1}px` : 0)}
    ${(props) => props.theme.spaces[4] - 1}px
    ${(props) => (props.vertical ? `${props.theme.spaces[4] - 1}px` : 0)};
  color: ${(props) => props.theme.colors.tabs.normal};
  &:hover {
    color: ${(props) => props.theme.colors.tabs.hover};
    .${Classes.ICON} {
      svg {
        fill: ${(props) => props.theme.colors.tabs.hover};
        path {
          fill: ${(props) => props.theme.colors.tabs.hover};
        }
      }
    }
  }

  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[1]}px;
    border-radius: 50%;
    svg {
      width: 16px;
      height: 16px;
      margin: auto;
      fill: ${(props) => props.theme.colors.tabs.normal};
      path {
        fill: ${(props) => props.theme.colors.tabs.normal};
      }
    }
  }

  ${(props) =>
    props.selected
      ? `
  background-color: transparent;
  color: ${props.theme.colors.tabs.hover};
  .${Classes.ICON} {
    svg {
      fill: ${props.theme.colors.tabs.icon};
      path {
        fill: ${props.theme.colors.tabs.icon};
      }
    }
  }

  .tab-title {
    font-weight: 700;
  }

  &::after {
    content: "";
    position: absolute;
    width: ${props.vertical ? `${props.theme.spaces[1] - 2}px` : "100%"};
    bottom: ${props.vertical ? "0%" : `${props.theme.spaces[0] - 1}px`};
    top: ${
      props.vertical ? `${props.theme.spaces[0] - 1}px` : "calc(100% - 2px)"
    };
    left: ${props.theme.spaces[0]}px;
    height: ${props.vertical ? "100%" : `${props.theme.spaces[1] - 2}px`};
    background-color: ${props.theme.colors.info.main};
    z-index: ${Indices.Layer3};
  }
  `
      : ""}
`;

export type TabItemProps = {
  tab: TabProp;
  selected: boolean;
  vertical: boolean;
};

function DefaultTabItem(props: TabItemProps) {
  const { selected, tab, vertical } = props;
  return (
    <TabTitleWrapper selected={selected} vertical={vertical}>
      {tab.icon ? (
        <Icon
          name={tab.icon}
          size={tab.iconSize ? tab.iconSize : IconSize.XXXL}
        />
      ) : null}
      <TabTitle className="tab-title">{tab.title}</TabTitle>
      {tab.count && tab.count > 0 ? <TabCount>{tab.count}</TabCount> : null}
    </TabTitleWrapper>
  );
}

export type TabbedViewComponentType = CommonComponentProps & {
  tabs: Array<TabProp>;
  selectedIndex?: number;
  onSelect?: (tabIndex: number) => void;
  overflow?: boolean;
  vertical?: boolean;
  tabItemComponent?: (props: TabItemProps) => JSX.Element;
};

export function TabComponent(props: TabbedViewComponentType) {
  const TabItem = props.tabItemComponent || DefaultTabItem;
  // for setting selected state of an uncontrolled component
  const [selectedIndex, setSelectedIndex] = useState(props.selectedIndex || 0);

  useEffect(() => {
    if (typeof props.selectedIndex === "number")
      setSelectedIndex(props.selectedIndex);
  }, [props.selectedIndex]);

  return (
    <TabsWrapper
      data-cy={props.cypressSelector}
      shouldOverflow={props.overflow}
      vertical={props.vertical}
    >
      <Tabs
        onSelect={(index: number) => {
          props.onSelect && props.onSelect(index);
          setSelectedIndex(index);
        }}
        selectedIndex={props.selectedIndex}
      >
        <TabList>
          {props.tabs.map((tab, index) => (
            <Tab
              data-cy={`t--tab-${tab.key}`}
              data-replay-id={tab.key}
              key={tab.key}
            >
              <TabItem
                selected={
                  index === props.selectedIndex || index === selectedIndex
                }
                tab={tab}
                vertical={!!props.vertical}
              />
            </Tab>
          ))}
        </TabList>
        {props.tabs.map((tab) => (
          <TabPanel key={tab.key}>{tab.panelComponent}</TabPanel>
        ))}
      </Tabs>
    </TabsWrapper>
  );
}

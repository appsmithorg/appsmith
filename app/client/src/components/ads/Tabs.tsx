import React, { RefObject, useCallback, useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import styled from "styled-components";
import Icon, { IconName, IconSize } from "./Icon";
import { Classes, CommonComponentProps } from "./common";
import { useEffect } from "react";
import { Indices } from "constants/Layers";
import { theme } from "constants/DefaultTheme";
import useResizeObserver from "utils/hooks/useResizeObserver";

export const TAB_MIN_HEIGHT = `36px`;

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
  responseViewer?: boolean;
}>`
  border-radius: 0px;
  height: 100%;
  overflow: hidden;
  .react-tabs {
    height: 100%;
  }
  .react-tabs__tab-panel {
    height: ${() => `calc(100% - ${TAB_MIN_HEIGHT})`};
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

    ${(props) =>
      props.responseViewer &&
      `
      margin-left: 30px;
      display: flex;
      align-items: center;
      height: 24px;
      background-color: ${props.theme.colors.multiSwitch.bg} !important;
      width: fit-content;
      padding-left: 1px;
      margin-top: 10px !important;
      margin-bottom: 10px !important;
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

    ${(props) =>
      props.responseViewer &&
      `
        display: flex;
        align-items: center;
        cursor: pointer;
        height: 22px;
        padding: 0 12px;
        border: 1px solid ${props.theme.colors.multiSwitch.border};
        margin-right: -1px;
        margin-left: -1px;
        margin-top: -2px;
        height: 100%;
      `}
  }

  .react-tabs__tab--selected {
    background-color: transparent;
    path {
      fill: ${(props) => props.theme.colors.tabs.hover};
    }

    ${(props) =>
      props.responseViewer &&
      `
        background-color: ${props.theme.colors.multiSwitch.selectedBg};
        border: 1px solid ${props.theme.colors.multiSwitch.border};
        border-radius: 0px;
        font-weight: normal;
      `}
  }

  ${(props) =>
    props.responseViewer &&
    `
      padding: 0px;
      margin-top: 10px;
  `}
`;

export const TabTitle = styled.span<{ responseViewer?: boolean }>`
  font-size: ${(props) => props.theme.typography.h4.fontSize}px;
  font-weight: ${(props) => props.theme.fontWeights[2]};
  line-height: ${(props) => props.theme.spaces[7]}px;
  letter-spacing: ${(props) => props.theme.typography.h4.letterSpacing}px;
  margin: 0;
  display: flex;
  align-items: center;

  ${(props) =>
    props.responseViewer &&
    `
    font-size: 12px;
    font-weight: normal;
    line-height: 16px;
    letter-spacing: normal;
    text-transform: uppercase;
    color: ${props.theme.colors.text.normal};
    `}
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
  responseViewer?: boolean;
}>`
  display: flex;
  align-items: center;
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

  ${(props) =>
    props.responseViewer &&
    `
      padding: 0px;
    `}

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
  color: var(--appsmith-color-black-900);
  .${Classes.ICON} {
    svg {
      path {
        fill:  var(--appsmith-color-black-900)
      }
    }
  }

  .tab-title {
    ${props.responseViewer &&
      `
        font-weight: normal;
      `}
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

    ${props.responseViewer &&
      `
        display: none;
      `}
  }
  `
      : ""}
`;

const CollapseIconWrapper = styled.div`
  position: absolute;
  right: 14px;
  top: ${() => theme.spaces[3] - 1}px;
  cursor: pointer;
`;

export type TabItemProps = {
  tab: TabProp;
  selected: boolean;
  vertical: boolean;
  responseViewer?: boolean;
};

function DefaultTabItem(props: TabItemProps) {
  const { responseViewer, selected, tab, vertical } = props;
  return (
    <TabTitleWrapper
      responseViewer={responseViewer}
      selected={selected}
      vertical={vertical}
    >
      {tab.icon ? (
        <Icon
          name={tab.icon}
          size={tab.iconSize ? tab.iconSize : IconSize.XXXL}
        />
      ) : null}
      <TabTitle className="tab-title" responseViewer={responseViewer}>
        {tab.title}
      </TabTitle>
      {tab.count && tab.count > 0 ? (
        <TabCount data-testid="t--tab-count">{tab.count}</TabCount>
      ) : null}
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
  responseViewer?: boolean;
  canCollapse?: boolean;
  // Reference to container for collapsing or expanding content
  containerRef?: RefObject<HTMLElement>;
  // height of container when expanded
  expandedHeight?: string;
};

// Props required to support a collapsible (foldable) tab component
export type CollapsibleTabProps = {
  // Reference to container for collapsing or expanding content
  containerRef: RefObject<HTMLDivElement>;
  // height of container when expanded( usually the default height of the tab component)
  expandedHeight: string;
};

export type CollapsibleTabbedViewComponentType = TabbedViewComponentType &
  CollapsibleTabProps;

export const collapsibleTabRequiredPropKeys: Array<keyof CollapsibleTabProps> = [
  "containerRef",
  "expandedHeight",
];

// Tab is considered collapsible only when all required collapsible props are present
export const isCollapsibleTabComponent = (
  props: TabbedViewComponentType | CollapsibleTabbedViewComponentType,
): props is CollapsibleTabbedViewComponentType =>
  collapsibleTabRequiredPropKeys.every((key) => key in props);

export function TabComponent(
  props: TabbedViewComponentType | CollapsibleTabbedViewComponentType,
) {
  const TabItem = props.tabItemComponent || DefaultTabItem;
  // for setting selected state of an uncontrolled component
  const [selectedIndex, setSelectedIndex] = useState(props.selectedIndex || 0);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (typeof props.selectedIndex === "number")
      setSelectedIndex(props.selectedIndex);
  }, [props.selectedIndex]);

  const handleContainerResize = () => {
    if (!isCollapsibleTabComponent(props)) return;
    const { containerRef, expandedHeight } = props;
    if (containerRef?.current && expandedHeight) {
      containerRef.current.style.height = isExpanded
        ? TAB_MIN_HEIGHT
        : expandedHeight;
    }
    setIsExpanded((prev) => !prev);
  };

  const resizeCallback = useCallback(
    (entries: ResizeObserverEntry[]) => {
      if (entries && entries.length) {
        const {
          contentRect: { height },
        } = entries[0];
        if (height > Number(TAB_MIN_HEIGHT.replace("px", "")) + 6) {
          !isExpanded && setIsExpanded(true);
        } else {
          isExpanded && setIsExpanded(false);
        }
      }
    },
    [isExpanded],
  );

  useResizeObserver(
    isCollapsibleTabComponent(props) ? props.containerRef?.current : null,
    resizeCallback,
  );

  useEffect(() => {
    if (!isCollapsibleTabComponent(props)) return;
    const { containerRef } = props;
    if (!isExpanded && containerRef.current) {
      containerRef.current.style.height = TAB_MIN_HEIGHT;
    }
  }, [isExpanded]);

  return (
    <TabsWrapper
      className={props.className}
      data-cy={props.cypressSelector}
      responseViewer={props.responseViewer}
      shouldOverflow={props.overflow}
      vertical={props.vertical}
    >
      {isCollapsibleTabComponent(props) && (
        <CollapseIconWrapper>
          <Icon
            name={isExpanded ? "expand-more" : "expand-less"}
            onClick={handleContainerResize}
            size={IconSize.XXXXL}
          />
        </CollapseIconWrapper>
      )}

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
                responseViewer={props.responseViewer}
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

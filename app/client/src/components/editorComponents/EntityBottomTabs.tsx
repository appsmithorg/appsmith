import type { RefObject } from "react";
import React from "react";
import type { CollapsibleTabProps } from "design-system-old";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { DEBUGGER_TAB_KEYS } from "./Debugger/helpers";
import { Tab, TabPanel, Tabs, TabsList } from "design-system";
import styled from "styled-components";
import { LIST_HEADER_HEIGHT } from "./Debugger/DebuggerLogs";

const TabPanelWrapper = styled(TabPanel)`
  margin-top: 0;
  height: calc(100% - ${LIST_HEADER_HEIGHT});
  &.ads-v2-tabs__panel {
    overflow: auto;
  }
`;

const TabsListWrapper = styled(TabsList)`
  padding: calc(var(--ads-v2-spaces-1) + 2px) var(--ads-v2-spaces-7)
    var(--ads-v2-spaces-1);
`;

interface EntityBottomTabsProps {
  className?: string;
  tabs: any;
  onSelect?: (tab: any) => void;
  selectedTabKey: string;
  canCollapse?: boolean;
  // Reference to container for collapsing or expanding content
  containerRef?: RefObject<HTMLElement>;
  // height of container when expanded
  expandedHeight?: string;
}

type CollapsibleEntityBottomTabsProps = EntityBottomTabsProps &
  CollapsibleTabProps;

// Using this if there are debugger related tabs
function EntityBottomTabs(
  props: EntityBottomTabsProps | CollapsibleEntityBottomTabsProps,
) {
  const onTabSelect = (key: string) => {
    const tab = props.tabs.find((tab: any) => tab.key === key);

    props.onSelect && props.onSelect(tab.key);

    if (Object.values<string>(DEBUGGER_TAB_KEYS).includes(tab.key)) {
      AnalyticsUtil.logEvent("DEBUGGER_TAB_SWITCH", {
        tabName: tab.key,
      });
    }
  };

  return (
    <Tabs
      className="h-full"
      defaultValue={props.selectedTabKey}
      onValueChange={onTabSelect}
      value={props.selectedTabKey}
    >
      <TabsListWrapper>
        {props.tabs.map((tab: any) => {
          return (
            <Tab
              data-testid={"t--tab-" + tab.key}
              key={tab.key}
              notificationCount={tab.count}
              value={tab.key}
            >
              {tab.title}
            </Tab>
          );
        })}
      </TabsListWrapper>
      {props.tabs.map((tab: any) => (
        <TabPanelWrapper key={tab.key} value={tab.key}>
          {tab.panelComponent}
        </TabPanelWrapper>
      ))}
    </Tabs>
  );
}

export default EntityBottomTabs;

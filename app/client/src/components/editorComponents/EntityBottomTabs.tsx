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
  & > div {
    height: 100%;
    padding-top: var(--ads-v2-spaces-4);
  }
`;

type EntityBottomTabsProps = {
  className?: string;
  tabs: any;
  onSelect?: (tab: any) => void;
  selectedTabKey: string;
  canCollapse?: boolean;
  // Reference to container for collapsing or expanding content
  containerRef?: RefObject<HTMLElement>;
  // height of container when expanded
  expandedHeight?: string;
};

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
      defaultValue={props.tabs[0].key}
      onValueChange={onTabSelect}
    >
      <TabsList>
        {props.tabs.map((tab: any) => {
          return (
            <Tab key={tab.key} notificationCount={tab.count} value={tab.key}>
              {tab.title}
            </Tab>
          );
        })}
      </TabsList>
      {props.tabs.map((tab: any) => (
        <TabPanelWrapper key={tab.key} value={tab.key}>
          {tab.panelComponent}
        </TabPanelWrapper>
      ))}
    </Tabs>
  );
}

export default EntityBottomTabs;

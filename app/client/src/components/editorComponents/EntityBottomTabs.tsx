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

export interface BottomTab {
  key: string;
  title: string;
  count?: number;
  panelComponent: React.ReactNode;
}

interface EntityBottomTabsProps {
  className?: string;
  tabs: Array<BottomTab>;
  onSelect?: (tab: string) => void;
  selectedTabKey: string;
}

type CollapsibleEntityBottomTabsProps = EntityBottomTabsProps &
  CollapsibleTabProps;

// Using this if there are debugger related tabs
function EntityBottomTabs(
  props: EntityBottomTabsProps | CollapsibleEntityBottomTabsProps,
) {
  const onTabSelect = (key: string) => {
    const tab = props.tabs.find((tab) => tab.key === key);
    if (tab) {
      props.onSelect && props.onSelect(tab.key);

      if (Object.values<string>(DEBUGGER_TAB_KEYS).includes(tab.key)) {
        AnalyticsUtil.logEvent("DEBUGGER_TAB_SWITCH", {
          tabName: tab.key,
        });
      }
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
        {props.tabs.map((tab) => {
          return (
            <Tab
              data-testid={"t--tab-" + tab.key}
              id={`debugger-tab-${tab.key}`}
              key={tab.key}
              notificationCount={tab.count}
              value={tab.key}
            >
              {tab.title}
            </Tab>
          );
        })}
      </TabsListWrapper>
      {props.tabs.map((tab) => (
        <TabPanelWrapper key={tab.key} value={tab.key}>
          {tab.panelComponent}
        </TabPanelWrapper>
      ))}
    </Tabs>
  );
}

export default EntityBottomTabs;

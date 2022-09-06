import React, { RefObject } from "react";
import {
  CollapsibleTabProps,
  collapsibleTabRequiredPropKeys,
  TabComponent,
  TabProp,
} from "components/ads/Tabs";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { DEBUGGER_TAB_KEYS } from "./Debugger/helpers";

type EntityBottomTabsProps = {
  defaultIndex: number;
  tabs: TabProp[];
  responseViewer?: boolean;
  onSelect?: (tab: TabProp) => void;
  onSelectIndex?: (tabIndex: number) => void;
  selectedTabIndex?: number; // this is used in the event you want to directly control the index changes.
  canCollapse?: boolean;
  // Reference to container for collapsing or expanding content
  containerRef?: RefObject<HTMLElement>;
  // height of container when expanded
  expandedHeight?: string;
};

type CollapsibleEntityBottomTabsProps = EntityBottomTabsProps &
  CollapsibleTabProps;

// Tab is considered collapsible only when all required collapsible props are present
export const isCollapsibleEntityBottomTab = (
  props: EntityBottomTabsProps | CollapsibleEntityBottomTabsProps,
): props is CollapsibleEntityBottomTabsProps =>
  collapsibleTabRequiredPropKeys.every((key) => key in props);

// Using this if there are debugger related tabs
function EntityBottomTabs(
  props: EntityBottomTabsProps | CollapsibleEntityBottomTabsProps,
) {
  const onTabSelect = (index: number) => {
    const tab = props.tabs[index];
    props.onSelectIndex && props.onSelectIndex(index);
    props.onSelect && props.onSelect(tab);

    if (Object.values<string>(DEBUGGER_TAB_KEYS).includes(tab.key)) {
      AnalyticsUtil.logEvent("DEBUGGER_TAB_SWITCH", {
        tabName: tab.key,
      });
    }
  };

  return (
    <TabComponent
      onSelect={onTabSelect}
      responseViewer={props.responseViewer}
      selectedIndex={props.selectedTabIndex}
      tabs={props.tabs}
      {...(isCollapsibleEntityBottomTab(props)
        ? {
            containerRef: props.containerRef,
            expandedHeight: props.expandedHeight,
          }
        : {})}
    />
  );
}

export default EntityBottomTabs;

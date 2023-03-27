import type { RefObject } from "react";
import React, { useMemo } from "react";
import type { CollapsibleTabProps, TabProp } from "design-system-old";
import {
  collapsibleTabRequiredPropKeys,
  TabComponent,
} from "design-system-old";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { DEBUGGER_TAB_KEYS } from "./Debugger/helpers";

type EntityBottomTabsProps = {
  tabs: TabProp[];
  responseViewer?: boolean;
  onSelect?: (tab: TabProp["key"]) => void;
  selectedTabKey: string;
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
    props.onSelect && props.onSelect(tab.key);

    if (Object.values<string>(DEBUGGER_TAB_KEYS).includes(tab.key)) {
      AnalyticsUtil.logEvent("DEBUGGER_TAB_SWITCH", {
        tabName: tab.key,
      });
    }
  };

  const getIndex = useMemo(() => {
    const index = props.tabs.findIndex(
      (tab) => tab.key === props.selectedTabKey,
    );

    if (index >= 0) {
      return index;
    }

    return 0;
  }, [props.selectedTabKey]);

  return (
    <TabComponent
      onSelect={onTabSelect}
      responseViewer={props.responseViewer}
      selectedIndex={getIndex}
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

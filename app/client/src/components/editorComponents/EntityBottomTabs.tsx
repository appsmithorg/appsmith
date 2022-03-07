import React, { useState, useEffect, RefObject } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentTab } from "actions/debuggerActions";
import { TabComponent, TabProp } from "components/ads/Tabs";
import { getCurrentDebuggerTab } from "selectors/debuggerSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { DEBUGGER_TAB_KEYS } from "./Debugger/helpers";

type EntityBottomTabsProps = {
  defaultIndex: number;
  tabs: TabProp[];
  responseViewer?: boolean;
  onSelect?: (tab: any) => void;
  selectedTabIndex?: number; // this is used in the event you want to directly control the index changes.
  canCollapse?: boolean;
  // Reference to container for collapsing or expanding content
  containerRef?: RefObject<HTMLElement>;
  // height of container when expanded
  expandedHeight?: string;
};
// Using this if there are debugger related tabs
function EntityBottomTabs(props: EntityBottomTabsProps) {
  const [selectedIndex, setSelectedIndex] = useState(props.defaultIndex);
  const currentTab = useSelector(getCurrentDebuggerTab);
  const dispatch = useDispatch();
  const onTabSelect = (index: number) => {
    dispatch(setCurrentTab(props.tabs[index].key));
    props.onSelect && props.onSelect(props.tabs[index]);
    setIndex(index);
  };

  const setIndex = (index: number) => {
    const tabKey = props.tabs[index]?.key;
    setSelectedIndex(index);
    if (Object.values<string>(DEBUGGER_TAB_KEYS).includes(tabKey)) {
      AnalyticsUtil.logEvent("DEBUGGER_TAB_SWITCH", {
        tabName: tabKey,
      });
    }
  };

  useEffect(() => {
    const index = props.tabs.findIndex((tab) => tab.key === currentTab);
    if (index >= 0) {
      setIndex(index);
    } else {
      setIndex(props.defaultIndex);
    }
  }, [currentTab]);

  return (
    <TabComponent
      canCollapse={props.canCollapse}
      containerRef={props.containerRef}
      expandedHeight={props.expandedHeight}
      onSelect={onTabSelect}
      responseViewer={props.responseViewer}
      selectedIndex={
        props.selectedTabIndex ? props.selectedTabIndex : selectedIndex
      }
      tabs={props.tabs}
    />
  );
}

export default EntityBottomTabs;

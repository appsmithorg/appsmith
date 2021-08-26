import React from "react";
import { TabComponent } from "components/ads/Tabs";
import { MENU_ITEMS } from "./constants";
import TabItemBackgroundFill from "components/ads/TabItemBackgroundFill";

type Props = {
  activeTabIndex: number;
  onSelect: (index: number) => void;
};

export default function Menu(props: Props) {
  return (
    <TabComponent
      onSelect={props.onSelect}
      selectedIndex={props.activeTabIndex || 0}
      tabItemComponent={TabItemBackgroundFill}
      tabs={MENU_ITEMS}
      vertical
    />
  );
}

import React from "react";
import { TabComponent } from "components/ads/Tabs";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import TabItem from "./components/TabItem";

type Props = {
  activeTabIndex: number;
  onSelect: (index: number) => void;
  options: Array<{ key: string; title: string }>;
};

const TabWrapper = styled.div`
  .react-tabs {
    border-bottom: 1px solid ${Colors.ALTO2};
  }
  .react-tabs__tab {
    margin-right: 0px;
    padding-right: ${(props) => props.theme.spaces[8]}px;
  }
`;

export default function Menu(props: Props) {
  return (
    <TabWrapper>
      <TabComponent
        onSelect={props.onSelect}
        selectedIndex={props.activeTabIndex || 0}
        tabItemComponent={TabItem}
        tabs={props.options}
      />
    </TabWrapper>
  );
}

import React, { useState } from "react";
import styled from "styled-components";

import { Colors } from "constants/Colors";
import { TabTitle, TabComponent, TabProp } from "components/ads/Tabs";
import { Tab, TabList, Tabs } from "react-tabs";

const StyledTabComponent = styled(TabComponent)`
  border: 3px solid red;
  .react-tabs__tab-list {
    display: none;
  }
`;

const StyledTabs = styled(Tabs)`
  position: sticky;
  top: 90px;
  z-index: 10;
  background: ${Colors.WHITE};
  padding: 0px 12px;
  border-bottom: 1px solid ${Colors.GREY_4};
  padding-bottom: 1px;

  .react-tabs__tab-list {
    border: 0;
    margin: 0;
  }

  .react-tabs__tab--selected {
    border: 0;
    border-radius: 0;
    border-bottom: 2px solid ${Colors.PRIMARY_ORANGE};
  }

  .tab-title {
    font-size: 12px;
  }
`;

type PropertyPaneTabProps = {
  tabs: Array<TabProp>;
};

export function PropertyPaneTab(props: PropertyPaneTabProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <>
      <StyledTabs onSelect={setSelectedIndex} selectedIndex={selectedIndex}>
        <TabList>
          <Tab>
            <TabTitle className="tab-title">CONTENT</TabTitle>
          </Tab>
          <Tab>
            <TabTitle className="tab-title">STYLE</TabTitle>
          </Tab>
        </TabList>
      </StyledTabs>
      <StyledTabComponent selectedIndex={selectedIndex} tabs={props.tabs} />
    </>
  );
}

import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.scss";
import styled from "styled-components";

const TabsWrapper = styled(Tabs)`
  ul {
    border-bottom-color: #d0d7dd;
    li {
      &.react-tabs__tab--selected {
        border-color: #d0d7dd;
        left: -1px;
        border-radius: 0;
        border-top: 5px solid ${props => props.theme.colors.primary};
      }
    }
  }
`;

type TabbedViewComponentType = {
  tabs: Array<{
    key: string;
    title: string;
    panelComponent: () => React.ReactNode;
  }>;
};

export const BaseTabbedView = (props: TabbedViewComponentType) => {
  return (
    <TabsWrapper>
      <TabList>
        {props.tabs.map(tab => (
          <Tab key={tab.key}>{tab.title}</Tab>
        ))}
      </TabList>
      {props.tabs.map(tab => (
        <TabPanel key={tab.key}>{tab.panelComponent()}</TabPanel>
      ))}
    </TabsWrapper>
  );
};

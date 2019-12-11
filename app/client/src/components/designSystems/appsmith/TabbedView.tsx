import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import styled from "styled-components";

const TabsWrapper = styled.div`
  .react-tabs__tab-list {
    border-bottom-color: #d0d7dd;
    color: #a3b3bf;
  }
  .react-tabs__tab:focus {
    box-shadow: none;
    border-color: ${props => props.theme.colors.primary};
  }
  .react-tabs__tab--selected {
    color: ${props => props.theme.colors.primary};
    border-color: #d0d7dd;
    border-top: ${props => props.theme.colors.primary} 5px solid;
    border-radius: 0;
  }
`;

type TabbedViewComponentType = {
  tabs: Array<{
    key: string;
    title: string;
    panelComponent: JSX.Element;
  }>;
};

export const BaseTabbedView = (props: TabbedViewComponentType) => {
  return (
    <TabsWrapper>
      <Tabs>
        <TabList>
          {props.tabs.map(tab => (
            <Tab key={tab.key}>{tab.title}</Tab>
          ))}
        </TabList>
        {props.tabs.map(tab => (
          <TabPanel key={tab.key}>{tab.panelComponent}</TabPanel>
        ))}
      </Tabs>
    </TabsWrapper>
  );
};

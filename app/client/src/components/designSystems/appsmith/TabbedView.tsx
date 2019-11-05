import React from "react";
import { Tab, Tabs } from "@blueprintjs/core";
import styled from "styled-components";

const TabsWrapper = styled.div`
  padding: 0 5px;
  .bp3-tab-indicator {
    background-color: ${props => props.theme.colors.primary};
  }
  .bp3-tab {
    &[aria-selected="true"] {
      color: ${props => props.theme.colors.primary};
    }
    :hover {
      color: ${props => props.theme.colors.primary};
    }
    :focus {
      outline: none;
    }
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
        {props.tabs.map(tab => (
          <Tab
            key={tab.key}
            id={tab.key}
            title={tab.title}
            panel={tab.panelComponent}
          />
        ))}
      </Tabs>
    </TabsWrapper>
  );
};

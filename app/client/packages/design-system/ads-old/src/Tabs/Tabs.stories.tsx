import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { TabComponent } from "./index";

export default {
  title: "Design System/Tabs",
  component: TabComponent,
} as ComponentMeta<typeof TabComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof TabComponent> = (args) => {
  return <TabComponent {...args} />;
};

export const Tabs = Template.bind({});

function PanelComponent({ title }) {
  return (
    <div>
      <h1>{title}</h1>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
    </div>
  );
}

Tabs.args = {
  tabs: [
    {
      key: "tab1",
      title: "Tab 1",
      panelComponent: <PanelComponent title={"Tab 1"} />,
    },
    {
      key: "tab2",
      title: "Tab 2",
      panelComponent: <PanelComponent title={"Tab 2"} />,
    },
    {
      key: "tab3",
      title: "Tab 3",
      panelComponent: <PanelComponent title={"Tab 3"} />,
    },
  ],
  onSelect: undefined,
};

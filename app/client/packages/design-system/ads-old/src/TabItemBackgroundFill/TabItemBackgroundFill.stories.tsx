import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import TabItemBackgroundFillComponent from "./index";

export default {
  title: "Design System/TabItem Background Fill",
  component: TabItemBackgroundFillComponent,
} as ComponentMeta<typeof TabItemBackgroundFillComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof TabItemBackgroundFillComponent> = (
  args,
) => {
  // eslint-disable-next-line no-console
  console.log(args, "args");
  return <TabItemBackgroundFillComponent {...args} />;
};

export const TabItemBackgroundFill = Template.bind({});
TabItemBackgroundFill.args = {
  selected: true,
  tab: {
    key: "tab1",
    title: "Tab 1",
  },
  vertical: true,
};

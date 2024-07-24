import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import SwitcherComponent from "./index";

const switches = [
  {
    id: "explorer",
    text: "Explorer",
    // eslint-disable-next-line no-console
    action: () => console.log("Explorer"),
  },
  {
    id: "widgets",
    text: "Widgets",
    // eslint-disable-next-line no-console
    action: () => console.log("Widgets"),
  },
];

export default {
  title: "Design System/Switcher",
  component: SwitcherComponent,
  decorators: [
    (Story) => (
      <div style={{ width: "230px" }}>
        <Story />
      </div>
    ),
  ],
} as ComponentMeta<typeof SwitcherComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof SwitcherComponent> = (args) => (
  <SwitcherComponent {...args} />
);

export const Switcher = Template.bind({}) as StoryObj;

Switcher.args = {
  activeObj: switches[0],
  switches,
};

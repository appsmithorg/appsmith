import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import ButtonComponent, { Size } from "./index";

export default {
  title: "Design System/Button",
  component: ButtonComponent,
  args: {
    fill: true,
    onClick: () => {
      // eslint-disable-next-line no-console
      console.log("Clicked");
    },
    size: Size.large,
    tag: "button",
    text: "Button",
  },
} as ComponentMeta<typeof ButtonComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof ButtonComponent> = (args) => {
  return <ButtonComponent {...args} />;
};

export const Primary = Template.bind({});
Primary.args = {
  category: "primary",
};

export const Secondary = Template.bind({});
Secondary.args = {
  category: "secondary",
};

export const Tertiary = Template.bind({});
Tertiary.args = {
  category: "tertiary",
};

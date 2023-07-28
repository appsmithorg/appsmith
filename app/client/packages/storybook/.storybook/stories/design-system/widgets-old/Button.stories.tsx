import * as React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import { Button, Size } from "@design-system/widgets-old";

export default {
  title: "Design System/widgets-old/Button",
  component: Button,
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
} as ComponentMeta<typeof Button>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Button> = (args: any) => {
  return <Button {...args} />;
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

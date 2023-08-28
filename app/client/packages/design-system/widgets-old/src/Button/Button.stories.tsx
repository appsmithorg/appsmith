import * as React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import { Button, Category, Size } from "@design-system/widgets-old";

export default {
  title: "Design System/Widgets-old/Button",
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
const Template: ComponentStory<typeof Button> = (args) => {
  return <Button {...args} />;
};

export const Primary = Template.bind({});
Primary.args = {
  category: Category.primary,
};

export const Secondary = Template.bind({});
Secondary.args = {
  category: Category.secondary,
};

export const Tertiary = Template.bind({});
Tertiary.args = {
  category: Category.tertiary,
};

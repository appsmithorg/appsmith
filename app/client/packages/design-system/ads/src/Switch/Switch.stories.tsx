import React from "react";
import { Switch } from "./Switch";
import type { SwitchProps } from "./Switch.types";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Switch",
  component: Switch,
  decorators: [
    (Story: () => React.ReactNode) => (
      <div style={{ width: "30vw" }}>{Story()}</div>
    ),
  ],
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: SwitchProps) => {
  return <Switch {...args} />;
};

export const SwitchStory = Template.bind({}) as StoryObj;
SwitchStory.storyName = "Switch";
SwitchStory.args = {
  children: "Set as homepage",
};

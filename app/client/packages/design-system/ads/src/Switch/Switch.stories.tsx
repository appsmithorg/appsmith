import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { Switch } from "./Switch";

export default {
  title: "ADS/Switch",
  component: Switch,
  decorators: [(Story) => <div style={{ width: "30vw" }}>{Story()}</div>],
} as ComponentMeta<typeof Switch>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Switch> = (args) => {
  return <Switch {...args} />;
};

export const SwitchStory = Template.bind({});
SwitchStory.storyName = "Switch";
SwitchStory.args = {
  children: "Set as homepage",
};

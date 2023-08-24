import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import {
  CheckboxGroup,
  RadioGroup,
  Switch,
  Checkbox,
  SwitchGroup,
  Radio,
} from "@design-system/widgets";
import { StoryGrid } from "@design-system/storybook";

const meta: Meta<typeof Switch> = {
  component: Switch,
  title: "Design System/Widgets/Group",
};

export default meta;

type Story = StoryObj<typeof Switch>;

export const LightMode: Story = {
  render: () => (
    <StoryGrid>
      <RadioGroup defaultValue="1">
        <Radio value="1">Option 1</Radio>
        <Radio value="2"> Option 2</Radio>
        <Radio value="3">Opion 3</Radio>
      </RadioGroup>
      <CheckboxGroup defaultValue={["1"]}>
        <Checkbox value="1">Option 1</Checkbox>
        <Checkbox value="2">Option 2</Checkbox>
        <Checkbox value="3">Option 3</Checkbox>
      </CheckboxGroup>
      <SwitchGroup defaultValue={["1"]}>
        <Switch value="1">Option 1</Switch>
        <Switch value="2">Option 2</Switch>
        <Switch value="3">Option 3</Switch>
      </SwitchGroup>
    </StoryGrid>
  ),
};

export const DarkMode: Story = Object.assign({}, LightMode);

DarkMode.parameters = {
  colorMode: "dark",
};

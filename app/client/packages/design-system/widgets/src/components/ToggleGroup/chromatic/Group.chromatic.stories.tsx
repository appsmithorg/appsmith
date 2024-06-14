import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import {
  ToggleGroup,
  RadioGroup,
  Switch,
  Checkbox,
  Radio,
} from "@design-system/widgets";
import { StoryGrid } from "@design-system/storybook";

const meta: Meta<typeof Switch> = {
  component: Switch,
  title: "Design System/Widgets/Group",
};

export default meta;

type Story = StoryObj<typeof Switch>;

const items = [
  { label: "Option 1", value: "1" },
  { label: "Option 2", value: "2" },
  { label: "Option 3", value: "3" },
];

export const LightMode: Story = {
  render: () => (
    <StoryGrid>
      <RadioGroup defaultValue="1">
        <Radio value="1">Option 1</Radio>
        <Radio value="2">Option 2</Radio>
        <Radio value="3">Opion 3</Radio>
      </RadioGroup>
      <ToggleGroup defaultValue={["1"]} items={items}>
        {({ label, value }) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        )}
      </ToggleGroup>
      <ToggleGroup defaultValue={["1"]} items={items}>
        {({ label, value }) => (
          <Switch key={value} value={value}>
            {label}
          </Switch>
        )}
      </ToggleGroup>
    </StoryGrid>
  ),
};

export const DarkMode: Story = Object.assign({}, LightMode);

DarkMode.parameters = {
  colorMode: "dark",
};

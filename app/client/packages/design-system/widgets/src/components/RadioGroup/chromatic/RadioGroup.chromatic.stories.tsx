import React from "react";
import type { Checkbox } from "@appsmith/wds";
import { Radio, RadioGroup } from "@appsmith/wds";
import type { Meta, StoryObj } from "@storybook/react";
import { StoryGrid, DataAttrWrapper } from "@design-system/storybook";

const meta: Meta<typeof RadioGroup> = {
  component: RadioGroup,
  title: "Design System/Widgets/RadioGroup",
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

const states = ["", "data-hovered", "data-focus-visible", "data-disabled"];

const items = [{ label: "Value 1", value: "value-1" }];

export const LightMode: Story = {
  render: () => (
    <StoryGrid>
      {states.map((state) => (
        <DataAttrWrapper attr={state} key={state} target="label">
          <RadioGroup>
            {items.map(({ label, value }) => (
              <Radio key={value} value={value}>
                {label}
              </Radio>
            ))}
          </RadioGroup>
        </DataAttrWrapper>
      ))}
      {states.map((state) => (
        <DataAttrWrapper attr={state} key={state} target="label">
          <RadioGroup defaultValue="value-1">
            {" "}
            {items.map(({ label, value }) => (
              <Radio key={value} value={value}>
                {label}
              </Radio>
            ))}
          </RadioGroup>
        </DataAttrWrapper>
      ))}
    </StoryGrid>
  ),
};

export const DarkMode: Story = Object.assign({}, LightMode);

DarkMode.parameters = {
  colorMode: "dark",
};

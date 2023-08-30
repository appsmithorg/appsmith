import React from "react";
import { Checkbox } from "@design-system/widgets";
import type { Meta, StoryObj } from "@storybook/react";
import { StoryGrid, DataAttrWrapper } from "@design-system/storybook";

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  title: "Design System/Widgets/Checkbox",
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

const states = ["", "data-hovered", "data-focused", "data-disabled"];

export const LightMode: Story = {
  render: () => (
    <StoryGrid>
      <Checkbox isIndeterminate>Indeterminate</Checkbox>
      {states.map((state) => (
        <>
          <DataAttrWrapper attr={state} key={state}>
            <Checkbox>unchecked {state}</Checkbox>
          </DataAttrWrapper>
          <DataAttrWrapper attr={state} key={state}>
            <Checkbox defaultSelected>checked {state}</Checkbox>
          </DataAttrWrapper>
        </>
      ))}
      <Checkbox defaultSelected isReadOnly isRequired>
        Readonly
      </Checkbox>
    </StoryGrid>
  ),
};

export const DarkMode: Story = Object.assign({}, LightMode);

DarkMode.parameters = {
  colorMode: "dark",
};

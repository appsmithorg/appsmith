import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Radio, RadioGroup } from "@design-system/widgets";
import { StoryGrid } from "../../../helpers/StoryGrid";
import { DataAttrWrapper } from "../../../helpers/DataAttrWrapper";

const meta: Meta<typeof Radio> = {
  component: Radio,
  title: "Design System/Widgets/Radio",
};

export default meta;

type Story = StoryObj<typeof Radio>;

const states = ["", "data-hovered", "data-focused", "data-disabled"];

export const LightMode: Story = {
  render: () => (
    <StoryGrid>
      {states.map((state) => (
        <>
          <RadioGroup>
            <DataAttrWrapper attr={state} key={state}>
              <Radio value={`${state}-unchecked`}>unchecked {state}</Radio>
            </DataAttrWrapper>
          </RadioGroup>
          <RadioGroup defaultValue={`${state}-checked`}>
            <DataAttrWrapper attr={state} key={state}>
              <Radio value={`${state}-checked`}>checked {state}</Radio>
            </DataAttrWrapper>
          </RadioGroup>
        </>
      ))}
    </StoryGrid>
  ),
};

export const DarkMode: Story = Object.assign({}, LightMode);

DarkMode.parameters = {
  colorMode: "dark",
};

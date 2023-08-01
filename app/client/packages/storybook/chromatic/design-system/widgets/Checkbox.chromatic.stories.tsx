import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Checkbox } from "@design-system/widgets";
import { StoryGrid } from "../../../helpers/StoryGrid";
import { DataAttrWrapper } from "../../../helpers/DataAttrWrapper";

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  title: "Design System/Widgets/Checkbox",
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const States: Story = {
  render: () => (
    <StoryGrid>
      <Checkbox>Default</Checkbox>
      <Checkbox defaultSelected> Checked</Checkbox>
      <Checkbox isIndeterminate>Indeterminate</Checkbox>
      <Checkbox isDisabled>Disabled</Checkbox>
      <Checkbox defaultSelected isDisabled>
        Checked Disabled
      </Checkbox>
      <DataAttrWrapper attr="data-hovered">
        <Checkbox defaultSelected>Hovered</Checkbox>
      </DataAttrWrapper>
    </StoryGrid>
  ),
};

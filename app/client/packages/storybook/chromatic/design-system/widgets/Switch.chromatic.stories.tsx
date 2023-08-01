import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Switch } from "@design-system/widgets";
import { StoryGrid } from "../../../helpers/StoryGrid";
import { DataAttrWrapper } from "../../../helpers/DataAttrWrapper";

const meta: Meta<typeof Switch> = {
  component: Switch,
  title: "Design System/Widgets/Switch",
};

export default meta;

type Story = StoryObj<typeof Switch>;

export const States: Story = {
  render: () => (
    <StoryGrid>
      <Switch>Default</Switch>
      <Switch defaultSelected> Checked</Switch>
      <Switch isDisabled>Disabled</Switch>
      <Switch defaultSelected isDisabled>
        Checked Disabled
      </Switch>
      <DataAttrWrapper attr="data-hovered">
        <Switch defaultSelected>Hovered</Switch>
      </DataAttrWrapper>
    </StoryGrid>
  ),
};

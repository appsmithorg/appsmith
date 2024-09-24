import React from "react";
import { Switch } from "@appsmith/wds";
import type { Meta, StoryObj } from "@storybook/react";
import { StoryGrid, DataAttrWrapper } from "@design-system/storybook";

const meta: Meta<typeof Switch> = {
  component: Switch,
  title: "Design System/Widgets/Switch",
};

export default meta;

type Story = StoryObj<typeof Switch>;

const states = ["", "data-hovered", "data-focus-visible", "data-disabled"];

export const LightMode: Story = {
  render: () => (
    <StoryGrid>
      {states.map((state) => (
        <>
          <DataAttrWrapper attr={state} key={state}>
            <Switch>unchecked {state}</Switch>
          </DataAttrWrapper>
          <DataAttrWrapper attr={state} key={state}>
            <Switch defaultSelected>checked {state}</Switch>
          </DataAttrWrapper>
        </>
      ))}
    </StoryGrid>
  ),
};

export const DarkMode: Story = Object.assign({}, LightMode);

DarkMode.parameters = {
  colorMode: "dark",
};
